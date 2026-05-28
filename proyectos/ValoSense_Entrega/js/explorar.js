window.addEventListener('load', iniciar);

// Tiempo en ms que dura el resaltado de sección
let DURACION_RESALTADO = 1800;

function iniciar() {
    // scroll suave en enlaces internos
    let enlacesToc = document.querySelectorAll('a[href^="#tool-"]');
    for (let i = 0; i < enlacesToc.length; i++) {
        enlacesToc[i].addEventListener('click', clicEnlaceIndice);
    }

    // Animación de entrada al hacer scroll
    aplicarAnimacionEntrada();

    window.addEventListener('scroll', comprobarSeccionesVisibles);

    // Si la URL trae un ancla a una sección, desplaza al cargar
    if (window.location.hash && window.location.hash.indexOf('#tool-') === 0) {
        setTimeout(desplazarAHash, 300);
    }
}

function clicEnlaceIndice(e) {
    let href = this.getAttribute('href');
    if (!href || href.length <= 1) return;

    let destino = document.querySelector(href);
    if (!destino) return;

    e.preventDefault();
    desplazarA(destino);
    resaltarSeccion(destino);
}

function desplazarA(elemento) {
    // obtiene posición del elemento
    let posicion = elemento.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: posicion - 20, behavior: 'smooth' });
}

function desplazarAHash() {
    let destino = document.querySelector(window.location.hash);
    if (destino) {
        desplazarA(destino);
        resaltarSeccion(destino);
    }
}

function aplicarAnimacionEntrada() {
    // oculta secciones para animar entrada
    let secciones = document.querySelectorAll('.tool-section');
    for (let i = 0; i < secciones.length; i++) {
        secciones[i].style.opacity = '0';
        secciones[i].style.transform = 'translateY(18px)';
        secciones[i].style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    }
    // comprueba secciones visibles al cargar
    comprobarSeccionesVisibles();
}

function comprobarSeccionesVisibles() {
    let secciones = document.querySelectorAll('.tool-section');
    let alturaVentana = window.innerHeight;

    for (let i = 0; i < secciones.length; i++) {
        let rect = secciones[i].getBoundingClientRect();

        // muestra sección si está en el viewport
        if (rect.top < alturaVentana - 60) {
            secciones[i].style.opacity = '1';
            secciones[i].style.transform = 'translateY(0)';
        }
    }
}

function resaltarSeccion(seccion) {
    // añade clase de resaltado temporal
    seccion.classList.add('is-highlighted');

    setTimeout(function() {
        seccion.classList.remove('is-highlighted');
    }, DURACION_RESALTADO);
}
