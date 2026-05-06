// =====================================================
// ValoSense · explorar.js
// Lógica de la página Explorar (resumen de herramientas)
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------
    // Scroll suave al pulsar un ítem del índice superior
    // -----------------------------------------------
    document.querySelectorAll('.explorar-toc-link, a[href^="#tool-"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href.length <= 1) return;

            const destino = document.querySelector(href);
            if (destino) {
                e.preventDefault();
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Resaltamos la sección durante un momento
                resaltarSeccion(destino);
            }
        });
    });

    // -----------------------------------------------
    // Animación de entrada de cada sección al aparecer en pantalla
    // -----------------------------------------------
    const secciones = document.querySelectorAll('.tool-section');

    if (secciones.length > 0 && 'IntersectionObserver' in window) {
        // Estado inicial: ocultas y desplazadas un poco hacia abajo
        secciones.forEach(sec => {
            sec.style.opacity   = '0';
            sec.style.transform = 'translateY(16px)';
            sec.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity   = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        secciones.forEach(sec => observer.observe(sec));
    }

    // -----------------------------------------------
    // Si la URL trae #tool-<algo>, hacemos scroll al cargar
    // Soporta enlaces directos tipo ...&action=home#tool-training
    // -----------------------------------------------
    if (window.location.hash && window.location.hash.startsWith('#tool-')) {
        const destino = document.querySelector(window.location.hash);
        if (destino) {
            setTimeout(() => {
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
                resaltarSeccion(destino);
            }, 250);
        }
    }

    // -----------------------------------------------
    // Índice sticky: marcar la sección actualmente visible
    // Cambia la clase is-active en el enlace del TOC que corresponde
    // -----------------------------------------------
    const tocLinks = document.querySelectorAll('.explorar-toc-link');

    if (tocLinks.length > 0 && secciones.length > 0 && 'IntersectionObserver' in window) {
        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;                // "tool-matchmaker"
                    // Desactivamos todos y activamos el actual
                    tocLinks.forEach(l => l.classList.remove('is-active'));
                    const activo = document.querySelector(`.explorar-toc-link[href="#${id}"]`);
                    if (activo) activo.classList.add('is-active');
                }
            });
        }, {
            // Disparamos cuando la sección ocupa la franja central del viewport
            rootMargin: '-40% 0px -55% 0px',
            threshold: 0,
        });

        secciones.forEach(sec => spyObserver.observe(sec));
    }

    // Resalta una sección añadiendo una clase temporal
    function resaltarSeccion(seccion) {
        seccion.classList.add('is-highlighted');
        setTimeout(() => {
            seccion.classList.remove('is-highlighted');
        }, 1800);
    }

});
