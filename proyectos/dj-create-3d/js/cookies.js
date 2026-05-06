/* ════════════════════════════════════════════════════════════
   DJ Create — Gestor de consentimiento de cookies (RGPD / LSSI)
   - Banner inicial con tres CTAs (Aceptar / Rechazar / Configurar)
   - Modal con switches granulares por categoría
   - Persistencia en localStorage con versión
   - API pública: window.DjcCookies
   - Evento "djc:consent" para que otros scripts (GA, Pixel, etc.)
     reaccionen al estado actual
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORAGE_KEY = 'djc_cookie_consent_v1';
  var VERSION = 1;

  var defaults = {
    version: VERSION,
    necessary: true,
    analytics: false,
    marketing: false,
    ts: null
  };

  function loadConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(partial) {
    var payload = Object.assign({}, defaults, partial, {
      version: VERSION,
      ts: new Date().toISOString()
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { /* storage no disponible — silenciamos */ }
    document.dispatchEvent(new CustomEvent('djc:consent', { detail: payload }));
    return payload;
  }

  function clearConsent() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function show(el) {
    if (!el) return;
    el.removeAttribute('hidden');
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    el.setAttribute('aria-hidden', 'false');
  }

  function hide(el) {
    if (!el) return;
    el.classList.remove('is-visible');
    el.setAttribute('aria-hidden', 'true');
    setTimeout(function () { el.setAttribute('hidden', ''); }, 480);
  }

  function syncModal(modal) {
    if (!modal) return;
    var c = loadConsent() || defaults;
    var toggles = modal.querySelectorAll('[data-cookie-toggle]');
    Array.prototype.forEach.call(toggles, function (t) {
      var key = t.getAttribute('data-cookie-toggle');
      if (key === 'necessary') {
        t.checked = true;
        t.disabled = true;
      } else {
        t.checked = !!c[key];
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.getElementById('cookieBanner');
    var modal = document.getElementById('cookieModal');

    if (banner) {
      var consent = loadConsent();
      if (!consent) show(banner);

      var btnAcceptAll = banner.querySelector('[data-cookie-accept-all]');
      var btnReject = banner.querySelector('[data-cookie-reject]');
      var btnConfig = banner.querySelector('[data-cookie-config]');

      if (btnAcceptAll) {
        btnAcceptAll.addEventListener('click', function () {
          saveConsent({ necessary: true, analytics: true, marketing: true });
          hide(banner);
        });
      }
      if (btnReject) {
        btnReject.addEventListener('click', function () {
          saveConsent({ necessary: true, analytics: false, marketing: false });
          hide(banner);
        });
      }
      if (btnConfig) {
        btnConfig.addEventListener('click', function () {
          hide(banner);
          if (modal) {
            syncModal(modal);
            show(modal);
          }
        });
      }
    }

    if (modal) {
      var btnSave = modal.querySelector('[data-cookie-save]');
      var btnAcceptAllModal = modal.querySelector('[data-cookie-accept-all-modal]');
      var btnClose = modal.querySelector('[data-cookie-close]');
      var backdrop = modal.querySelector('.cookie-modal__backdrop');

      if (btnSave) {
        btnSave.addEventListener('click', function () {
          var out = { necessary: true, analytics: false, marketing: false };
          var toggles = modal.querySelectorAll('[data-cookie-toggle]');
          Array.prototype.forEach.call(toggles, function (t) {
            out[t.getAttribute('data-cookie-toggle')] = !!t.checked;
          });
          saveConsent(out);
          hide(modal);
        });
      }
      if (btnAcceptAllModal) {
        btnAcceptAllModal.addEventListener('click', function () {
          saveConsent({ necessary: true, analytics: true, marketing: true });
          hide(modal);
        });
      }
      if (btnClose) {
        btnClose.addEventListener('click', function () { hide(modal); });
      }
      if (backdrop) {
        backdrop.addEventListener('click', function () { hide(modal); });
      }
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('is-visible')) hide(modal);
      });
    }

    // Cualquier link/botón con data-cookie-open re-abre el modal de configuración
    var openers = document.querySelectorAll('[data-cookie-open]');
    Array.prototype.forEach.call(openers, function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        if (modal) {
          syncModal(modal);
          show(modal);
        }
      });
    });
  });

  window.DjcCookies = {
    load: loadConsent,
    save: saveConsent,
    clear: clearConsent,
    VERSION: VERSION
  };
})();
