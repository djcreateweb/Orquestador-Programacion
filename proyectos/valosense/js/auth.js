// =====================================================
// ValoSense · auth.js
// Lógica de la página de login y registro
// Maneja las pestañas y la validación cliente de ambos formularios
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------
    // Sistema de pestañas: login / registro
    // Los botones tienen data-tab="login" o data-tab="registro"
    // Los paneles tienen id="tab-login" o id="tab-registro"
    // -----------------------------------------------
    const tabs = document.querySelectorAll('.auth-tab');
    const panels = document.querySelectorAll('.auth-form-wrapper');

    function activarTab(nombre) {
        tabs.forEach(tab => {
            const esActiva = tab.dataset.tab === nombre;
            tab.classList.toggle('active', esActiva);
            tab.setAttribute('aria-selected', String(esActiva));
        });
        panels.forEach(panel => {
            const esObjetivo = panel.id === 'tab-' + nombre;
            panel.classList.toggle('hidden', !esObjetivo);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activarTab(tab.dataset.tab));
    });

    // Enlaces "¿No tienes cuenta?" / "¿Ya tienes cuenta?" que cambian de pestaña
    document.querySelectorAll('[data-swap-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activarTab(link.dataset.swapTab);
        });
    });

    // -----------------------------------------------
    // Validación del formulario de login
    // -----------------------------------------------
    const formLogin = document.querySelector('#tab-login form');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            const nombre = formLogin.querySelector('input[name="nombre"]').value.trim();
            const pswd   = formLogin.querySelector('input[name="pswd"]').value;

            if (nombre === '' || pswd === '') {
                e.preventDefault();
                mostrarMensaje(formLogin, 'Rellena el usuario y la contraseña');
            }
        });
    }

    // -----------------------------------------------
    // Validación del formulario de registro
    // Usuario >= 3 caracteres, contraseña >= 6
    // -----------------------------------------------
    const formRegistro = document.querySelector('#tab-registro form');
    if (formRegistro) {
        formRegistro.addEventListener('submit', (e) => {
            const nombre = formRegistro.querySelector('input[name="nombre"]').value.trim();
            const pswd   = formRegistro.querySelector('input[name="pswd"]').value;

            if (nombre.length < 3) {
                e.preventDefault();
                mostrarMensaje(formRegistro, 'El usuario debe tener al menos 3 caracteres');
                return;
            }
            if (pswd.length < 8) {
                e.preventDefault();
                mostrarMensaje(formRegistro, 'La contraseña debe tener al menos 8 caracteres');
                return;
            }
        });
    }

    // -----------------------------------------------
    // Muestra un mensaje de error dentro del form actual
    // Usa el elemento .auth-message que ya existe en el HTML
    // -----------------------------------------------
    function mostrarMensaje(form, texto) {
        let msgEl = form.querySelector('.auth-message');
        if (!msgEl) {
            msgEl = document.createElement('p');
            msgEl.classList.add('auth-message');
            form.appendChild(msgEl);
        }
        msgEl.textContent = texto;
        msgEl.style.opacity = '1';
    }

});
