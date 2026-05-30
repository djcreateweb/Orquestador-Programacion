// validacion.js — validador propio para toda la web
// Sustituye los bocadillos nativos del navegador por un aviso estilizado.
// Se aplica a todos los formularios menos los de login/registro (.auth-form),
// que ya tienen su propia validacion en auth.js.

(function() {
    let pop = null;
    let campoActual = null;

    // crea (una sola vez) el popover reutilizable
    function obtenerPop() {
        if (pop) return pop;
        pop = document.createElement('div');
        pop.className = 'vs-valid-pop';
        pop.setAttribute('role', 'alert');
        let icono = document.createElement('span');
        icono.className = 'vs-valid-icon';
        icono.setAttribute('aria-hidden', 'true');
        icono.textContent = '!';
        let texto = document.createElement('span');
        texto.className = 'vs-valid-text';
        pop.appendChild(icono);
        pop.appendChild(texto);
        document.body.appendChild(pop);
        return pop;
    }

    // mensaje en español segun el tipo de error
    function mensajeDe(campo) {
        if (campo.dataset && campo.dataset.error) return campo.dataset.error;
        let v = campo.validity;
        if (v.valueMissing) {
            if (campo.type === 'checkbox' || campo.type === 'radio') return 'Marca esta casilla para continuar.';
            if (campo.tagName === 'SELECT') return 'Selecciona una opcion.';
            return 'Este campo es obligatorio.';
        }
        if (v.typeMismatch) {
            if (campo.type === 'email') return 'Introduce un email valido (ej: tu@correo.com).';
            if (campo.type === 'url') return 'Introduce una direccion web valida.';
            return 'El formato no es valido.';
        }
        if (v.tooShort) return 'Escribe al menos ' + campo.minLength + ' caracteres (ahora tienes ' + campo.value.length + ').';
        if (v.tooLong) return 'Como maximo ' + campo.maxLength + ' caracteres.';
        if (v.rangeUnderflow) return 'El valor minimo es ' + campo.min + '.';
        if (v.rangeOverflow) return 'El valor maximo es ' + campo.max + '.';
        if (v.stepMismatch) return 'Introduce un valor valido.';
        if (v.patternMismatch) return campo.title ? campo.title : 'El formato no es valido.';
        if (v.badInput) return 'Introduce un valor valido.';
        return campo.validationMessage || 'Revisa este campo.';
    }

    function mostrar(campo, mensaje) {
        let p = obtenerPop();
        p.querySelector('.vs-valid-text').textContent = mensaje;
        p.classList.add('visible');

        let r = campo.getBoundingClientRect();
        let arriba = window.scrollY + r.top - p.offsetHeight - 10;
        let abajo = window.scrollY + r.bottom + 10;
        let izquierda = window.scrollX + r.left;

        // si no cabe encima del campo, lo pinta debajo
        if (arriba < window.scrollY + 8) {
            p.classList.add('below');
            p.style.top = abajo + 'px';
        } else {
            p.classList.remove('below');
            p.style.top = arriba + 'px';
        }
        p.style.left = izquierda + 'px';
        campoActual = campo;
    }

    function ocultar() {
        if (pop) pop.classList.remove('visible');
        if (campoActual) {
            campoActual.classList.remove('vs-invalido');
            campoActual = null;
        }
    }

    function marcar(campo) {
        campo.classList.add('vs-invalido');
    }

    function manejarSubmit(e) {
        let form = e.currentTarget;
        let campos = form.elements;
        for (let i = 0; i < campos.length; i++) {
            let c = campos[i];
            if (!c.willValidate) continue;
            if (!c.validity.valid) {
                e.preventDefault();
                ocultar();
                marcar(c);
                c.focus();
                mostrar(c, mensajeDe(c));
                return;
            }
        }
        ocultar();
    }

    function iniciar() {
        let forms = document.querySelectorAll('form');
        for (let i = 0; i < forms.length; i++) {
            let f = forms[i];
            // los formularios de acceso ya validan por su cuenta
            if (f.classList.contains('auth-form')) continue;
            if (f.hasAttribute('data-sin-validacion')) continue;
            f.noValidate = true;
            f.addEventListener('submit', manejarSubmit);
        }

        // al escribir o cambiar un campo, se limpia su error y se oculta el aviso
        document.addEventListener('input', function(e) {
            if (e.target && e.target.classList) e.target.classList.remove('vs-invalido');
            ocultar();
        });
        document.addEventListener('change', function(e) {
            if (e.target && e.target.classList) e.target.classList.remove('vs-invalido');
        });

        // si el usuario hace scroll, el aviso deja de tener sentido
        window.addEventListener('scroll', ocultar, true);
        window.addEventListener('resize', ocultar);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
