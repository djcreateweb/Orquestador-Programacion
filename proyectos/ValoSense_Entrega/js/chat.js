window.addEventListener('load', iniciar);

// constante de intervalo de refresco en milisegundos
let INTERVALO_REFRESCO = 3000;

// id del amigo de la conversación activa
let amigoActualId = 0;

// timer del refresco automático
let timerRefresco = null;

function iniciar() {
    let mensajesEl = document.getElementById('chat-messages');
    let composerEl = document.getElementById('chat-composer');

    // desplaza al fondo de la conversación al cargar
    if (mensajesEl) {
        mensajesEl.scrollTop = mensajesEl.scrollHeight;
        amigoActualId = parseInt(mensajesEl.dataset.friendId) || 0;
    }

    restaurarScrollChat();

    // valida el formulario antes de enviar
    if (composerEl) {
        composerEl.addEventListener('submit', validarMensaje);

        // restaura el borrador guardado
        let inputMensaje = composerEl.querySelector('input[name="contenido"]');
        if (inputMensaje && amigoActualId > 0) {
            let claveborrador = 'vsChat_draft_' + amigoActualId;
            let borrador = localStorage.getItem(claveborrador);
            if (borrador) {
                inputMensaje.value = borrador;
            }
            // guarda el borrador mientras escribe
            inputMensaje.addEventListener('input', guardarBorrador);
            inputMensaje.addEventListener('input', actualizarTipoDetectado);
            actualizarTipoDetectado.call(inputMensaje);
        }
    }

    // resalta el campo al enfocar
    let inputTexto = document.querySelector('.chat-composer-input');
    if (inputTexto) {
        inputTexto.addEventListener('focus', resaltarComposer);
        inputTexto.addEventListener('blur', quitarResaltadoComposer);
    }

    // muestra fecha y hora en los mensajes sin timestamp
    formatearTimestamps();

    // activa el refresco periódico de la barra de no leídos
    if (amigoActualId > 0) {
        timerRefresco = setInterval(actualizarNoLeidos, INTERVALO_REFRESCO);
    }

    // pausa el refresco si la pestaña no es visible
    document.addEventListener('visibilitychange', controlarRefresco);

    // marca la conversación activa en el menú lateral
    marcarConversacionActiva();
}

function validarMensaje(e) {
    let inputMensaje = this.querySelector('input[name="contenido"]');
    let texto = inputMensaje.value.trim();

    let regexVacio = /^\s*$/;

    if (texto.length === 0 || regexVacio.test(texto)) {
        e.preventDefault();
        mostrarAvisoComposer('El mensaje no puede estar vacío');
        return;
    }

    // guarda scroll y borra borrador antes del reload
    sessionStorage.setItem('vsChatScroll', String(window.scrollY));
    if (amigoActualId > 0) {
        localStorage.removeItem('vsChat_draft_' + amigoActualId);
    }
    sessionStorage.setItem('vsNotificacion', 'Mensaje enviado');
}

function restaurarScrollChat() {
    let posicion = sessionStorage.getItem('vsChatScroll');
    if (!posicion) return;
    sessionStorage.removeItem('vsChatScroll');
    let seccion = document.getElementById('chat-messages');
    if (seccion) {
        seccion.scrollTop = seccion.scrollHeight;
    } else {
        window.scrollTo(0, parseInt(posicion, 10));
    }
}

function guardarBorrador() {
    // guarda el texto del campo en localStorage
    if (amigoActualId > 0) {
        let clave = 'vsChat_draft_' + amigoActualId;
        localStorage.setItem(clave, this.value);
    }
}

function formatearTimestamps() {
    // formatea las horas de los mensajes existentes
    let tiempos = document.querySelectorAll('.chat-msg-time');
    let hoy = new Date();

    for (let i = 0; i < tiempos.length; i++) {
        let raw = tiempos[i].textContent.trim();
        if (raw.length > 0) continue;

        // usa la fecha del atributo datetime si está disponible
        let datetime = tiempos[i].getAttribute('datetime');
        if (datetime) {
            let fecha = new Date(datetime.replace(' ', 'T'));
            if (!isNaN(fecha.getTime())) {
                let horas = String(fecha.getHours()).padStart(2, '0');
                let minutos = String(fecha.getMinutes()).padStart(2, '0');
                tiempos[i].textContent = horas + ':' + minutos;
            }
        } else {
            // sin datetime, muestra la hora actual
            let h = String(hoy.getHours()).padStart(2, '0');
            let m = String(hoy.getMinutes()).padStart(2, '0');
            tiempos[i].textContent = h + ':' + m;
        }
    }
}

function actualizarNoLeidos() {
    // lee el contador de no leídos del sessionStorage
    let clave = 'vsUnread_' + amigoActualId;
    let noLeidos = parseInt(sessionStorage.getItem(clave)) || 0;

    let badge = document.getElementById('nav-chat-badge');
    if (!badge) return;

    if (noLeidos > 0) {
        badge.textContent = String(noLeidos);
        badge.classList.remove('is-hidden');
    } else {
        badge.classList.add('is-hidden');
    }
}

function controlarRefresco() {
    if (document.hidden) {
        // para el refresco cuando la pestaña no está visible
        if (timerRefresco) {
            clearInterval(timerRefresco);
            timerRefresco = null;
        }
    } else {
        // reactiva el refresco al volver a la pestaña
        if (!timerRefresco && amigoActualId > 0) {
            timerRefresco = setInterval(actualizarNoLeidos, INTERVALO_REFRESCO);
        }
    }
}

function marcarConversacionActiva() {
    if (!amigoActualId) return;

    let amigos = document.querySelectorAll('.chat-friend');
    for (let i = 0; i < amigos.length; i++) {
        let id = parseInt(amigos[i].dataset.friendId) || 0;
        if (id === amigoActualId) {
            amigos[i].classList.add('is-active');
        } else {
            amigos[i].classList.remove('is-active');
        }
    }
}

function mostrarAvisoComposer(texto) {
    // muestra un mensaje de error temporal debajo del composer
    let aviso = document.getElementById('composer-aviso');
    if (!aviso) {
        aviso = document.createElement('p');
        aviso.id = 'composer-aviso';
        aviso.className = 'auth-message';
        let composer = document.getElementById('chat-composer');
        if (composer) {
            composer.parentNode.insertBefore(aviso, composer.nextSibling);
        }
    }
    aviso.innerHTML = texto;

    // oculta el aviso tras 3 segundos
    setTimeout(function() {
        aviso.innerHTML = '';
    }, 3000);
}

function resaltarComposer() {
    this.style.borderColor = 'rgba(255,70,85,0.7)';
}

function quitarResaltadoComposer() {
    this.style.borderColor = '';
}

function detectarTipoMensaje(contenido) {
    let c = String(contenido || '').trim();
    if (c.length === 0) return 'text';
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

function actualizarTipoDetectado() {
    let badge = document.querySelector('.chat-composer-detected');
    if (!badge) return;

    let etiquetas = {
        valorant_code: 'Código Valorant',
        discord_link: 'Discord · servidor',
        discord_id: 'Discord · ID',
        riot_id: 'Riot ID · Valorant'
    };
    let tipo = detectarTipoMensaje(this.value);

    badge.className = 'chat-composer-detected';
    if (!etiquetas[tipo]) {
        badge.hidden = true;
        badge.textContent = '';
        return;
    }

    badge.hidden = false;
    badge.classList.add('is-' + tipo);
    badge.textContent = etiquetas[tipo];
}
