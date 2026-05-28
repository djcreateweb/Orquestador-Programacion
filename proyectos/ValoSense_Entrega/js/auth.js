window.addEventListener('load', iniciar);

function iniciar() {
    // pestañas de login y registro
    let botonesTabs = document.querySelectorAll('.auth-tab');
    for (let i = 0; i < botonesTabs.length; i++) {
        botonesTabs[i].addEventListener('click', clicTab);
    }

    // enlace de intercambio de pestaña
    let enlacesSwap = document.querySelectorAll('[data-swap-tab]');
    for (let i = 0; i < enlacesSwap.length; i++) {
        enlacesSwap[i].addEventListener('click', swapTab);
    }

    // formulario de login
    let formLogin = document.querySelector('#tab-login form');
    if (formLogin) {
        formLogin.addEventListener('submit', validarLogin);
    }

    // formulario de registro
    let formRegistro = document.querySelector('#tab-registro form');
    if (formRegistro) {
        formRegistro.addEventListener('submit', validarRegistro);
    }

    // resalta campos al enfocarlos
    let campos = document.querySelectorAll('.auth-form input, .auth-form select');
    for (let i = 0; i < campos.length; i++) {
        campos[i].addEventListener('focus', enfocarCampo);
        campos[i].addEventListener('blur', desenfocarCampo);
    }

    // limpia aviso legal
    let checks = document.querySelectorAll('#acepta_terminos, #acepta_cookies');
    for (let i = 0; i < checks.length; i++) {
        checks[i].addEventListener('change', limpiarErrorLegal);
    }

    // precarga el último usuario guardado
    let ultimoUsuario = localStorage.getItem('vsUltimoUsuario');
    let inputNombre = document.getElementById('nombre');
    if (ultimoUsuario && inputNombre) {
        inputNombre.value = ultimoUsuario;
    }
}

function clicTab() {
    activarTab(this.dataset.tab);
}

function swapTab(e) {
    e.preventDefault();
    activarTab(this.dataset.swapTab);
}

function activarTab(nombre) {
    let botones = document.querySelectorAll('.auth-tab');
    let paneles = document.querySelectorAll('.auth-form-wrapper');

    // activa el botón correcto
    for (let i = 0; i < botones.length; i++) {
        let esActivo = (botones[i].dataset.tab === nombre);
        if (esActivo) {
            botones[i].classList.add('active');
        } else {
            botones[i].classList.remove('active');
        }
        botones[i].setAttribute('aria-selected', String(esActivo));
    }

    // muestra el panel correcto
    for (let i = 0; i < paneles.length; i++) {
        if (paneles[i].id === 'tab-' + nombre) {
            paneles[i].classList.remove('hidden');
        } else {
            paneles[i].classList.add('hidden');
        }
    }
}

function validarLogin(e) {
    let nombre = document.getElementById('nombre').value.trim();
    let pswd = document.getElementById('pswd').value;
    let terminos = document.getElementById('acepta_terminos');
    let cookies = document.getElementById('acepta_cookies');

    // expresión regular para campos vacíos
    let regexVacio = /^\s*$/;

    if (regexVacio.test(nombre) || pswd.length === 0) {
        e.preventDefault();
        mostrarError('tab-login', 'Rellena el usuario y la contraseña');
        return;
    }

    if (terminos && !terminos.checked) {
        e.preventDefault();
        mostrarErrorLegal('Acepta los términos y condiciones para continuar');
        terminos.focus();
        return;
    }

    if (cookies && !cookies.checked) {
        e.preventDefault();
        mostrarErrorLegal('Acepta el uso de cookies para continuar');
        cookies.focus();
        return;
    }

    limpiarErrorLegal();

    // guarda último usuario en localStorage
    localStorage.setItem('vsUltimoUsuario', nombre);
}

function mostrarErrorLegal(texto) {
    let aviso = document.getElementById('avisoLoginLegal');
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.add('visible');
}

function limpiarErrorLegal() {
    let aviso = document.getElementById('avisoLoginLegal');
    if (!aviso) return;
    aviso.textContent = '';
    aviso.classList.remove('visible');
}

function validarRegistro(e) {
    let inputNombre = document.getElementById('reg-user') || document.getElementById('nombre_reg');
    let inputEmail = document.getElementById('reg-email') || document.getElementById('email_reg');
    let inputPswd = document.getElementById('reg-pass') || document.getElementById('pswd_reg');
    let nombre = inputNombre.value.trim();
    let email = inputEmail.value.trim();
    let pswd = inputPswd.value;

    // expresión regular para email
    let regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // expresión regular para nombre de usuario
    let regexNombre = /^[A-Za-z0-9_]{3,30}$/;

    if (!regexNombre.test(nombre)) {
        e.preventDefault();
        mostrarError('tab-registro', 'El usuario: solo letras, números y _ (3-30 caracteres)');
        return;
    }

    if (!regexEmail.test(email)) {
        e.preventDefault();
        mostrarError('tab-registro', 'Introduce un email con formato válido');
        return;
    }

    if (pswd.length < 8) {
        e.preventDefault();
        mostrarError('tab-registro', 'La contraseña debe tener al menos 8 caracteres');
        return;
    }
}

function mostrarError(panelId, texto) {
    let panel = document.getElementById(panelId);
    if (!panel) return;

    let msgEl = panel.querySelector('.auth-message');
    if (!msgEl) {
        // crea el párrafo si no existe
        msgEl = document.createElement('p');
        msgEl.className = 'auth-message';
        let form = panel.querySelector('form');
        let boton = panel.querySelector('button[type="submit"]');
        if (form && boton) {
            form.insertBefore(msgEl, boton);
        }
    }

    msgEl.innerHTML = texto;
    msgEl.style.display = 'block';
}

function enfocarCampo() {
    this.style.borderColor = 'rgba(255,70,85,0.8)';
}

function desenfocarCampo() {
    this.style.borderColor = '';
}
