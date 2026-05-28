window.addEventListener('load', iniciarMatchmaker);

// rangos disponibles
let RANGOS = ['iron','bronze','silver','gold','platinum','diamond','ascendant','immortal','radiant'];

function iniciarMatchmaker() {
    activarColorRango();
    guardarUltimosFiltros();
    scrollAlBot();
    activarChipsFiltros();
}

// sincroniza el color del select de rango
function activarColorRango() {
    let selectRango = document.querySelector('.rank-select');
    if (!selectRango) return;

    sincronizarColorRango(selectRango);
    selectRango.addEventListener('change', function() {
        sincronizarColorRango(this);
    });

    // resincroniza color tras limpiar el formulario
    let formulario = selectRango.closest('form');
    if (formulario) {
        formulario.addEventListener('reset', function() {
            setTimeout(function() {
                sincronizarColorRango(selectRango);
            }, 0);
        });
    }
}

function sincronizarColorRango(select) {
    // quita clases de rango anteriores
    for (let i = 0; i < RANGOS.length; i++) {
        select.classList.remove('rank-' + RANGOS[i]);
    }
    // añade clase del rango seleccionado
    let valor = select.value.toLowerCase();
    let partes = valor.split(' ');
    valor = partes[0];
    if (valor) {
        select.classList.add('rank-' + valor);
    }
}

// guarda filtros en localStorage al enviar
function guardarUltimosFiltros() {
    let formulario = document.querySelector('.search-form');
    if (!formulario) return;

    formulario.addEventListener('submit', function() {
        let rango = document.getElementById('rango');
        let region = document.getElementById('region');
        let rol = document.getElementById('rol');

        if (rango) localStorage.setItem('vsMMRango', rango.value);
        if (region) localStorage.setItem('vsMMRegion', region.value);
        if (rol) localStorage.setItem('vsMMRol', rol.value);
    });

    // restaura filtros guardados si los campos están vacíos
    restaurarFiltros();
}

function restaurarFiltros() {
    let selectRango = document.getElementById('rango');
    let selectRegion = document.getElementById('region');
    let selectRol = document.getElementById('rol');

    // solo restaura si no hay valor seleccionado
    if (selectRango && !selectRango.value) {
        let rangoGuardado = localStorage.getItem('vsMMRango');
        if (rangoGuardado) selectRango.value = rangoGuardado;
    }

    if (selectRegion && !selectRegion.value) {
        let regionGuardada = localStorage.getItem('vsMMRegion');
        if (regionGuardada) selectRegion.value = regionGuardada;
    }

    if (selectRol && !selectRol.value) {
        let rolGuardado = localStorage.getItem('vsMMRol');
        if (rolGuardado) selectRol.value = rolGuardado;
    }

    // sincroniza color después de restaurar
    let selectColorRango = document.querySelector('.rank-select');
    if (selectColorRango) {
        sincronizarColorRango(selectColorRango);
    }
}

// desplaza hasta la respuesta del bot
function scrollAlBot() {
    let respuestaBot = document.querySelector('.bot-response');
    if (!respuestaBot) return;

    setTimeout(function() {
        let posicion = respuestaBot.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: posicion - 20, behavior: 'smooth' });
    }, 300);
}

// activa chips de filtros para eliminarlos
function activarChipsFiltros() {
    let chips = document.querySelectorAll('.chip-remove');
    for (let i = 0; i < chips.length; i++) {
        chips[i].addEventListener('click', eliminarChip);
    }
}

function eliminarChip() {
    let chip = this.parentNode;
    if (chip) {
        chip.style.transition = 'opacity 0.2s ease';
        chip.style.opacity = '0';
        setTimeout(function() {
            if (chip.parentNode) chip.parentNode.removeChild(chip);
        }, 220);
    }
}
