window.addEventListener('load', iniciar);

function iniciar() {
    actualizarAnyoFooter();
    activarMenuMovil();
    activarDropdownsNav();
    activarRevealScroll();
    activarBotonSubir();
    activarTogglePassword();
    activarConfirmaciones();
    ocultarImagenesRotas();
    ocultarMensajesAuto();
    aplicarProteccionScrollFormularios();
    restaurarScrollGuardado();
    mostrarNotificacionGuardada();

    console.log('Navegador: ' + navigator.userAgent);
    console.log('Resolución: ' + window.innerWidth + ' x ' + window.innerHeight);
}

// actualiza el año del footer
function actualizarAnyoFooter() {
    let fecha = new Date();
    let anyoActual = fecha.getFullYear();
    let footerTextos = document.querySelectorAll('.footer-text');
    for (let i = 0; i < footerTextos.length; i++) {
        let texto = footerTextos[i].innerHTML;
        // Reemplaza el año hardcodeado si está presente
        footerTextos[i].innerHTML = texto.replace('2025', String(anyoActual));
    }
}

// activa el menú móvil
function activarMenuMovil() {
    let menuToggle = document.getElementById('menu-toggle');
    let navbarMenu = document.getElementById('navbar-menu');
    if (!menuToggle || !navbarMenu) return;

    menuToggle.addEventListener('click', alternarMenuMovil);

    // Cierra el menú al pulsar fuera
    document.addEventListener('click', cerrarMenuFuera);

    // Cierra el menú con Escape
    document.addEventListener('keydown', cerrarMenuEscape);
}

function alternarMenuMovil(e) {
    e.stopPropagation();
    let navbarMenu = document.getElementById('navbar-menu');
    let menuToggle = document.getElementById('menu-toggle');
    if (!navbarMenu || !menuToggle) return;

    let estaAbierto = navbarMenu.classList.contains('is-open');
    if (estaAbierto) {
        navbarMenu.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
    } else {
        navbarMenu.classList.add('is-open');
        menuToggle.setAttribute('aria-expanded', 'true');
    }
}

function cerrarMenuFuera(e) {
    let navbarMenu = document.getElementById('navbar-menu');
    let menuToggle = document.getElementById('menu-toggle');
    if (!navbarMenu || !menuToggle) return;

    if (!menuToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
        navbarMenu.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
    }
}

function cerrarMenuEscape(e) {
    if (e.key !== 'Escape') return;
    let navbarMenu = document.getElementById('navbar-menu');
    let menuToggle = document.getElementById('menu-toggle');
    if (!navbarMenu || !menuToggle) return;

    if (navbarMenu.classList.contains('is-open')) {
        navbarMenu.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
    }
}

// activa dropdowns del menú
function activarDropdownsNav() {
    let dropdowns = document.querySelectorAll('.nav-dropdown');
    for (let i = 0; i < dropdowns.length; i++) {
        let toggle = dropdowns[i].querySelector('.nav-dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', clicDropdown);
        }
    }
    // Cierra todos al pulsar fuera
    document.addEventListener('click', cerrarDropdownsFuera);
    document.addEventListener('keydown', cerrarDropdownsEscape);
}

function clicDropdown(e) {
    e.stopPropagation();
    let dropdown = this.parentNode;
    let estaAbierto = dropdown.classList.contains('is-open');

    // Cierra los demás dropdowns
    let todos = document.querySelectorAll('.nav-dropdown');
    for (let i = 0; i < todos.length; i++) {
        todos[i].classList.remove('is-open');
        let t = todos[i].querySelector('.nav-dropdown-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
    }

    if (!estaAbierto) {
        dropdown.classList.add('is-open');
        this.setAttribute('aria-expanded', 'true');
    }
}

function cerrarDropdownsFuera(e) {
    let dropdowns = document.querySelectorAll('.nav-dropdown');
    for (let i = 0; i < dropdowns.length; i++) {
        if (!dropdowns[i].contains(e.target)) {
            dropdowns[i].classList.remove('is-open');
            let t = dropdowns[i].querySelector('.nav-dropdown-toggle');
            if (t) t.setAttribute('aria-expanded', 'false');
        }
    }
}

function cerrarDropdownsEscape(e) {
    if (e.key !== 'Escape') return;
    let dropdowns = document.querySelectorAll('.nav-dropdown');
    for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].classList.contains('is-open')) {
            dropdowns[i].classList.remove('is-open');
            let t = dropdowns[i].querySelector('.nav-dropdown-toggle');
            if (t) { t.setAttribute('aria-expanded', 'false'); t.focus(); }
        }
    }
}

// animación de entrada al hacer scroll
function activarRevealScroll() {
    let elementos = document.querySelectorAll('.reveal, .reveal-zoom');
    for (let i = 0; i < elementos.length; i++) {
        elementos[i].style.opacity = '0';
        elementos[i].style.transform = 'translateY(14px)';
        elementos[i].style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    }
    comprobarReveal();
    window.addEventListener('scroll', comprobarReveal);
}

function comprobarReveal() {
    let elementos = document.querySelectorAll('.reveal, .reveal-zoom');
    let alturaVentana = window.innerHeight;

    for (let i = 0; i < elementos.length; i++) {
        let rect = elementos[i].getBoundingClientRect();
        if (rect.top < alturaVentana - 50) {
            elementos[i].style.opacity = '1';
            elementos[i].style.transform = 'translateY(0)';
            elementos[i].classList.add('is-visible');
        }
    }
}

// botón de volver arriba
function activarBotonSubir() {
    let boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'back-to-top';
    boton.setAttribute('aria-label', 'Volver arriba');
    boton.innerHTML = '<span aria-hidden="true">▲</span>';
    boton.addEventListener('click', subirArriba);
    document.body.appendChild(boton);

    // Guarda la posición al hacer clic en links internos
    window.addEventListener('scroll', controlarBotonSubir);
    controlarBotonSubir();
}

function controlarBotonSubir() {
    let boton = document.querySelector('.back-to-top');
    if (!boton) return;
    if (window.pageYOffset > 400) {
        boton.classList.add('is-visible');
    } else {
        boton.classList.remove('is-visible');
    }
}

function subirArriba() {
    // Guarda la posición actual en sessionStorage antes de subir
    sessionStorage.setItem('vsScrollAntes', String(window.pageYOffset));
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// alterna visibilidad de contraseña
function activarTogglePassword() {
    let botones = document.querySelectorAll('[data-toggle-password]');
    for (let i = 0; i < botones.length; i++) {
        botones[i].addEventListener('click', togglePassword);
    }
}

function togglePassword() {
    let id = this.getAttribute('data-toggle-password');
    let input = document.getElementById(id);
    if (!input) return;

    let mostrando = (input.type === 'text');
    input.type = mostrando ? 'password' : 'text';
    this.textContent = mostrando ? 'Ver' : 'Ocultar';
    this.setAttribute('aria-pressed', String(!mostrando));
}

// diálogo de confirmación
function activarConfirmaciones() {
    let formularios = document.querySelectorAll('form[data-confirm]');
    for (let i = 0; i < formularios.length; i++) {
        formularios[i].addEventListener('submit', pedirConfirmacion);
    }
}

function pedirConfirmacion(e) {
    let mensaje = this.getAttribute('data-confirm');
    if (!window.confirm(mensaje)) {
        e.preventDefault();
    }
}

// oculta imágenes que no cargaron
function ocultarImagenesRotas() {
    let imagenes = document.querySelectorAll('img');
    for (let i = 0; i < imagenes.length; i++) {
        imagenes[i].addEventListener('error', ocultarImagen);
    }
}

function ocultarImagen() {
    this.style.display = 'none';
}

// oculta mensajes de estado tras 6 segundos
function ocultarMensajesAuto() {
    let mensajes = document.querySelectorAll('.auth-message');
    for (let i = 0; i < mensajes.length; i++) {
        if (mensajes[i].innerHTML.trim() !== '') {
            setTimeout(function() {
                this.style.transition = 'opacity 0.4s ease';
                this.style.opacity = '0';
            }.bind(mensajes[i]), 6000);
        }
    }
}

// guarda scroll en formularios que recargan
function aplicarProteccionScrollFormularios() {
    let ids = ['contacto-form', 'form-presencia', 'form-datos', 'form-password'];
    for (let i = 0; i < ids.length; i++) {
        let form = document.getElementById(ids[i]);
        if (form) {
            form.addEventListener('submit', guardarScrollFormulario);
        }
    }
}

function guardarScrollFormulario() {
    sessionStorage.setItem('vsFormScroll', String(window.scrollY));
}

function restaurarScrollGuardado() {
    let posicion = sessionStorage.getItem('vsFormScroll');
    if (!posicion) return;
    sessionStorage.removeItem('vsFormScroll');
    window.scrollTo(0, parseInt(posicion, 10));
}

// muestra notificación flotante
function mostrarNotificacion(texto, tipo) {
    if (!tipo) tipo = 'ok';
    let notif = document.createElement('div');
    notif.className = 'vs-notificacion vs-notificacion--' + tipo;
    notif.textContent = texto;
    document.body.appendChild(notif);
    setTimeout(function() {
        notif.classList.add('is-visible');
    }, 50);
    setTimeout(function() {
        notif.classList.remove('is-visible');
        setTimeout(function() {
            if (notif.parentNode) notif.parentNode.removeChild(notif);
        }, 400);
    }, 3500);
}

// muestra notificación guardada en sesión
function mostrarNotificacionGuardada() {
    let texto = sessionStorage.getItem('vsNotificacion');
    if (!texto) return;
    sessionStorage.removeItem('vsNotificacion');
    mostrarNotificacion(texto);
}

