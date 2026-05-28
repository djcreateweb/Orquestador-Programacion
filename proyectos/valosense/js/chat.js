// =====================================================
// ValoSense · chat.js
// Polling cada 3s para traer mensajes nuevos y refrescar
// la lista de amigos (unread + preview + online).
// =====================================================

(function(){
    'use strict';

    const POLL_INTERVAL_MS = 3000;
    const BASE = 'index.php?controlador=chat&action=poll';

    document.addEventListener('DOMContentLoaded', () => {
        const msgsEl = document.getElementById('chat-messages');
        const friendsList = document.getElementById('chat-friends');
        const composer = document.getElementById('chat-composer');
        const composerInput = composer ? composer.querySelector('input[name="contenido"]') : null;
        const detectedBadge = composer ? composer.querySelector('.chat-composer-detected') : null;

        const typeLabels = {
            'valorant_code': 'Código Valorant',
            'riot_id':       'Riot ID · Valorant',
            'discord_link':  'Discord · servidor',
            'discord_id':    'Discord · ID'
        };

        function detectMessageType(content) {
            const c = String(content || '').trim();
            if (!c) return 'text';
            if (/^(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com)\/[A-Za-z0-9_\-/?=&.]+$/i.test(c)) {
                return 'discord_link';
            }
            if (/^\d{17,19}$/.test(c)) return 'discord_id';
            if (/^[A-Za-z0-9 _.\-]{3,16}#[A-Za-z0-9]{2,5}$/u.test(c)) return 'riot_id';
            if (/^#[A-Za-z0-9]{4,12}$/.test(c)) return 'valorant_code';
            if (/^code:\s*[A-Za-z0-9]{4,12}$/i.test(c)) return 'valorant_code';
            if (/^[A-Z0-9]{5,8}$/.test(c) && /[A-Z]/.test(c) && /\d/.test(c)) return 'valorant_code';
            return 'text';
        }

        function updateDetectedBadge() {
            if (!composerInput || !detectedBadge) return;
            const type = detectMessageType(composerInput.value);
            detectedBadge.className = 'chat-composer-detected';
            if (!typeLabels[type]) {
                detectedBadge.hidden = true;
                detectedBadge.textContent = '';
                return;
            }
            detectedBadge.hidden = false;
            detectedBadge.classList.add('is-' + type);
            detectedBadge.textContent = typeLabels[type];
        }

        // Auto-scroll al fondo al entrar
        if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;

        if (composerInput) {
            composerInput.addEventListener('input', updateDetectedBadge);
            updateDetectedBadge();
        }

        // Enviar mensaje sin recargar página (si hay composer activo)
        if (composer) {
            composer.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = new FormData(composer);
                const content = (data.get('contenido') || '').toString().trim();
                if (!content) return;

                composer.querySelector('.chat-composer-send').disabled = true;
                try {
                    const resp = await fetch(composer.action, {
                        method: 'POST',
                        body: data,
                        credentials: 'same-origin',
                        redirect: 'follow'
                    });
                    if (resp.ok) {
                        composer.querySelector('input[name="contenido"]').value = '';
                        updateDetectedBadge();
                        // Tras enviar, pedir poll inmediato para mostrar el nuevo msg
                        await pollOnce();
                    }
                } catch(e) {
                    window.VS?.toast && window.VS.toast('No se pudo enviar el mensaje.', 'warning');
                } finally {
                    composer.querySelector('.chat-composer-send').disabled = false;
                    composer.querySelector('input[name="contenido"]').focus();
                }
            });
        }

        // ---------- Polling ----------
        function getFriendId() {
            return msgsEl ? parseInt(msgsEl.dataset.friendId || '0', 10) : 0;
        }
        function getLastId() {
            return msgsEl ? parseInt(msgsEl.dataset.lastId || '0', 10) : 0;
        }

        function renderMessage(m, meId) {
            const mine = parseInt(m.emisor_id, 10) === meId;
            const tipo = m.tipo || 'text';
            const wrap = document.createElement('div');
            wrap.className = 'chat-msg ' + (mine ? 'chat-msg-mine' : 'chat-msg-theirs') + ' msg-type-' + tipo;
            wrap.dataset.msgId = m.id;

            // Badge
            const etiquetas = {
                'valorant_code': 'Código Valorant',
                'riot_id':       'Riot ID · Valorant',
                'discord_link':  'Discord · servidor',
                'discord_id':    'Discord · ID'
            };
            if (etiquetas[tipo]) {
                const badge = document.createElement('span');
                badge.className = 'chat-msg-badge msg-badge-' + tipo;
                badge.textContent = etiquetas[tipo];
                wrap.appendChild(badge);
            }

            // Body
            const body = document.createElement('div');
            body.className = 'chat-msg-body';
            if (tipo === 'discord_link' && /^(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com)\//i.test(m.contenido)) {
                const raw = /^https?:\/\//i.test(m.contenido) ? m.contenido : 'https://' + m.contenido;
                const a = document.createElement('a');
                a.className = 'msg-link';
                a.href = raw;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = m.contenido;
                body.appendChild(a);
            } else if (tipo === 'valorant_code' || tipo === 'discord_id' || tipo === 'riot_id') {
                const code = document.createElement('code');
                code.className = 'msg-code';
                code.textContent = m.contenido;
                body.appendChild(code);
            } else {
                body.textContent = m.contenido;
            }
            wrap.appendChild(body);

            // Timestamp (silencioso si creado_en falta o es inválido)
            if (m.creado_en) {
                const time = document.createElement('time');
                time.className = 'chat-msg-time';
                time.dateTime = m.creado_en;
                const d = new Date(String(m.creado_en).replace(' ', 'T'));
                if (!isNaN(d.getTime())) {
                    const hh = String(d.getHours()).padStart(2, '0');
                    const mm = String(d.getMinutes()).padStart(2, '0');
                    time.textContent = hh + ':' + mm;
                    wrap.appendChild(time);
                }
            }

            return wrap;
        }

        async function pollOnce() {
            const friendId = getFriendId();
            const params = new URLSearchParams();
            if (friendId) {
                params.set('friend_id', String(friendId));
                params.set('last_id', String(getLastId()));
            }
            try {
                const resp = await fetch(BASE + '&' + params.toString(), {
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
                });
                if (!resp.ok) return;
                const data = await resp.json();
                if (data.error) return;

                // Pintar mensajes nuevos si hay conversación abierta
                if (msgsEl && Array.isArray(data.messages) && data.messages.length) {
                    // Quitar el "no hay mensajes"
                    const empty = msgsEl.querySelector('.chat-empty-convo');
                    if (empty) empty.remove();

                    const meId = parseInt(msgsEl.dataset.meId || '0', 10);
                    let lastId = getLastId();
                    data.messages.forEach(m => {
                        if (msgsEl.querySelector(`[data-msg-id="${m.id}"]`)) return;
                        msgsEl.appendChild(renderMessage(m, meId));
                        const mid = parseInt(m.id, 10);
                        if (mid > lastId) lastId = mid;
                    });
                    msgsEl.dataset.lastId = String(lastId);
                    // Auto-scroll abajo si el user está cerca del fondo
                    const nearBottom = (msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight) < 120;
                    if (nearBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
                }

                // Refrescar sidebar (unread + preview + online)
                if (friendsList && Array.isArray(data.friends)) {
                    data.friends.forEach(f => {
                        const li = friendsList.querySelector(`[data-friend-id="${f.usuario_id}"]`);
                        if (!li) return;
                        li.classList.toggle('is-online', !!f.online);
                        // unread
                        let unreadEl = li.querySelector('.chat-friend-unread');
                        if (f.unread > 0) {
                            if (!unreadEl) {
                                unreadEl = document.createElement('span');
                                unreadEl.className = 'chat-friend-unread badge badge--glow';
                                li.querySelector('.chat-friend-link').appendChild(unreadEl);
                            }
                            unreadEl.textContent = String(f.unread);
                        } else if (unreadEl) {
                            unreadEl.remove();
                        }
                        // preview
                        const prev = li.querySelector('.chat-friend-preview');
                        if (prev && f.ultimo) {
                            prev.textContent = f.ultimo.length > 60 ? f.ultimo.slice(0,60) : f.ultimo;
                        }
                    });
                }

                // Badge global de no leídos en el navbar
                const navBadge = document.getElementById('nav-chat-badge');
                if (navBadge) {
                    const n = parseInt(data.total_unread || 0, 10);
                    if (n > 0) { navBadge.textContent = n; navBadge.classList.remove('is-hidden'); }
                    else       { navBadge.classList.add('is-hidden'); }
                }
            } catch(e) { /* silencioso */ }
        }

        // Primer poll y timer con pausa cuando la pestaña no está visible
        // (evita disparar fetch cada 3s mientras el usuario no mira el chat).
        let pollTimer = null;
        function startPolling() {
            if (pollTimer) return;
            pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);
        }
        function stopPolling() {
            if (!pollTimer) return;
            clearInterval(pollTimer);
            pollTimer = null;
        }
        if (document.visibilityState !== 'hidden') {
            pollOnce();
            startPolling();
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopPolling();
            } else {
                pollOnce();
                startPolling();
            }
        });
    });
})();
