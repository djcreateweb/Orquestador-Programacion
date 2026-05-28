window.addEventListener('load', iniciarHome);

function iniciarHome() {
    animarHero();
    animarContadores();
    activarScrollCards();
    activarScrollSuave();
    comprobarHash();
}

// anima la entrada del hero
function animarHero() {
    let heroContent = document.querySelector('.hero-home .hero-content');
    if (!heroContent) return;

    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(16px)';

    setTimeout(function() {
        heroContent.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
    }, 80);
}

// anima los contadores del hero
function animarContadores() {
    let estadisticas = document.querySelectorAll('.hero-stat-value');
    for (let i = 0; i < estadisticas.length; i++) {
        let texto  = estadisticas[i].textContent.trim();
        let numero = parseInt(texto);

        // solo anima si el texto es número limpio
        if (!isNaN(numero) && String(numero) === texto) {
            contarHasta(estadisticas[i], numero, 900);
        }
    }
}

function contarHasta(elemento, valorFinal, duracion) {
    let pasos = 40;
    let intervalo = Math.floor(duracion / pasos);
    let incremento = Math.ceil(valorFinal / pasos);
    let valorActual = 0;

    let timer = setInterval(function() {
        valorActual += incremento;
        if (valorActual >= valorFinal) {
            valorActual = valorFinal;
            clearInterval(timer);
        }
        elemento.textContent = String(valorActual);
    }, intervalo);
}

// animación de entrada de tarjetas al scroll
function activarScrollCards() {
    let tarjetas = document.querySelectorAll('.feature-card, .step-card');
    for (let i = 0; i < tarjetas.length; i++) {
        tarjetas[i].style.opacity = '0';
        tarjetas[i].style.transform = 'translateY(18px)';
        tarjetas[i].style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    }
    // comprueba visibilidad al cargar y al scroll
    mostrarCardsVisibles();
    window.addEventListener('scroll', mostrarCardsVisibles);
}

function mostrarCardsVisibles() {
    let tarjetas = document.querySelectorAll('.feature-card, .step-card');
    let alturaVentana = window.innerHeight;

    for (let i = 0; i < tarjetas.length; i++) {
        let rect = tarjetas[i].getBoundingClientRect();
        if (rect.top < alturaVentana - 60) {
            tarjetas[i].style.opacity = '1';
            tarjetas[i].style.transform = 'translateY(0)';
        }
    }
}

// scroll suave para enlaces internos
function activarScrollSuave() {
    let enlaces = document.querySelectorAll('a[href^="#"]');
    for (let i = 0; i < enlaces.length; i++) {
        enlaces[i].addEventListener('click', clicEnlaceInterno);
    }
}

function clicEnlaceInterno(e) {
    let href = this.getAttribute('href');
    if (!href || href.length <= 1) return;

    let destino = document.querySelector(href);
    if (!destino) return;

    e.preventDefault();
    let posicion = destino.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: posicion - 20, behavior: 'smooth' });

    // resalta la tarjeta si es el destino
    if (destino.classList.contains('feature-card')) {
        resaltarTarjeta(destino);
    }
}

// comprueba si la url trae un ancla
function comprobarHash() {
    let hash = window.location.hash;
    if (!hash || hash.indexOf('#feature-') !== 0) return;

    let destino = document.querySelector(hash);
    if (!destino) return;

    setTimeout(function() {
        let posicion = destino.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: posicion - 20, behavior: 'smooth' });
        resaltarTarjeta(destino);
    }, 220);
}

// resalta tarjeta con clase temporal
function resaltarTarjeta(tarjeta) {
    tarjeta.classList.add('is-highlighted');
    setTimeout(function() {
        tarjeta.classList.remove('is-highlighted');
    }, 1800);
}
