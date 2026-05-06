// =====================================================
// ValoSense · home.js
// Lógica de la landing page (home_view.php)
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------
    // Animación de entrada del hero
    // Opacidad y ligero desplazamiento vertical
    // -----------------------------------------------
    const heroContent = document.querySelector('.hero-home .hero-content');
    if (heroContent) {
        heroContent.style.opacity   = '0';
        heroContent.style.transform = 'translateY(16px)';
        setTimeout(() => {
            heroContent.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            heroContent.style.opacity    = '1';
            heroContent.style.transform  = 'translateY(0)';
        }, 60);
    }

    // -----------------------------------------------
    // Contador animado en las stats del hero
    // Si el valor es numérico, cuenta desde 0 hasta su valor final
    // Si no (por ejemplo "12.4K"), lo deja tal cual
    // -----------------------------------------------
    const statValues = document.querySelectorAll('.hero-stat-value');
    statValues.forEach(el => {
        const textoOriginal = el.textContent.trim();
        const soloNumero = parseInt(textoOriginal, 10);

        // Solo animamos si es un número "limpio" (sin K, %, etc.)
        if (!isNaN(soloNumero) && String(soloNumero) === textoOriginal) {
            animarContador(el, soloNumero, 900);
        }
    });

    // Cuenta desde 0 hasta "final" en "duracion" ms usando requestAnimationFrame
    function animarContador(elemento, final, duracion) {
        const inicio = performance.now();
        function frame(ahora) {
            const progreso = Math.min((ahora - inicio) / duracion, 1);
            // Ease-out para que termine suavecito
            const eased = 1 - Math.pow(1 - progreso, 2);
            elemento.textContent = Math.floor(final * eased).toString();
            if (progreso < 1) requestAnimationFrame(frame);
            else elemento.textContent = final.toString();
        }
        requestAnimationFrame(frame);
    }

    // -----------------------------------------------
    // Animación en cascada de las tarjetas de features
    // Se activan cuando entran en el viewport
    // -----------------------------------------------
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length > 0) {
        // Estado inicial oculto
        featureCards.forEach(card => {
            card.style.opacity   = '0';
            card.style.transform = 'translateY(18px)';
            card.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        });

        // Observer para animar al entrar en viewport
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const indice = Array.from(featureCards).indexOf(entry.target);
                        setTimeout(() => {
                            entry.target.style.opacity   = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, indice * 90);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });

            featureCards.forEach(card => observer.observe(card));
        } else {
            // Fallback sin IntersectionObserver: mostrar todo directamente
            featureCards.forEach(card => {
                card.style.opacity   = '1';
                card.style.transform = 'translateY(0)';
            });
        }
    }

    // -----------------------------------------------
    // Mismo efecto de entrada para los pasos (cómo funciona)
    // -----------------------------------------------
    const stepCards = document.querySelectorAll('.how-section .step-card');
    if (stepCards.length > 0 && 'IntersectionObserver' in window) {
        stepCards.forEach(card => {
            card.style.opacity   = '0';
            card.style.transform = 'translateY(14px)';
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        });

        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const i = Array.from(stepCards).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.style.opacity   = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, i * 120);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        stepCards.forEach(card => obs.observe(card));
    }

    // -----------------------------------------------
    // Scroll suave al pulsar enlaces internos con ancla (#features, #how-it-works...)
    // Si el destino es una feature-card, la resaltamos un momento
    // -----------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.length <= 1) return;   // ignoramos "#" solo

            const destino = document.querySelector(href);
            if (destino) {
                e.preventDefault();
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Si es una tarjeta de feature, añadimos un resaltado breve
                if (destino.classList.contains('feature-card')) {
                    resaltarTarjeta(destino);
                }
            }
        });
    });

    // -----------------------------------------------
    // Al cargar, si la URL trae #feature-<algo>, hacemos scroll y resaltamos
    // Esto es lo que hace el dropdown "Explorar" para invitados:
    // pulsa "Encontrar equipo" y llega directamente al resumen de esa feature
    // -----------------------------------------------
    if (window.location.hash && window.location.hash.startsWith('#feature-')) {
        const destino = document.querySelector(window.location.hash);
        if (destino) {
            // Pequeño delay para que las animaciones del hero terminen primero
            setTimeout(() => {
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
                resaltarTarjeta(destino);
            }, 200);
        }
    }

    // Añade la clase de resaltado y la quita pasado 1.8s
    function resaltarTarjeta(tarjeta) {
        tarjeta.classList.add('is-highlighted');
        setTimeout(() => {
            tarjeta.classList.remove('is-highlighted');
        }, 1800);
    }

});
