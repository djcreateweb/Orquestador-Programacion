window.addEventListener('load', iniciarTraining);

// categorías de entrenamiento disponibles
let CATEGORIAS = ['aim', 'movilidad', 'disparo', 'utilidad', 'game_sense'];

// rangos disponibles para el selector
let RANGOS = ['iron','bronze','silver','gold','platinum','diamond','ascendant','immortal','radiant'];

function iniciarTraining() {
    activarDropdownCategorias();
    activarContadorCategorias();
    activarSincronizarRango();
    activarSeleccionAgentes();
    activarSeleccionMapas();
    scrollAlResultado();
    mostrarRachaUsuario();
}

// dropdown de categorías de entrenamiento
function activarDropdownCategorias() {
    let dropdown = document.querySelector('[data-cat-dropdown]');
    if (!dropdown) return;

    let botonToggle = dropdown.querySelector('.cat-dropdown-toggle');
    if (!botonToggle) return;

    botonToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        let estaAbierto = dropdown.classList.contains('is-open');
        if (estaAbierto) {
            cerrarDropdownCat(dropdown, botonToggle);
        } else {
            abrirDropdownCat(dropdown, botonToggle);
        }
    });

    // Cierra al pulsar fuera
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            cerrarDropdownCat(dropdown, botonToggle);
        }
    });

    // Cierra con Escape
    dropdown.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarDropdownCat(dropdown, botonToggle);
            botonToggle.focus();
        }
    });
}

function abrirDropdownCat(dropdown, boton) {
    dropdown.classList.add('is-open');
    boton.setAttribute('aria-expanded', 'true');
}

function cerrarDropdownCat(dropdown, boton) {
    dropdown.classList.remove('is-open');
    boton.setAttribute('aria-expanded', 'false');
}

// actualiza el contador de categorías
function activarContadorCategorias() {
    let form = document.getElementById('videos-form');
    if (!form) return;

    let checkboxes = form.querySelectorAll('input[name="categorias[]"]');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('change', actualizarContadorCat);
    }
    actualizarContadorCat();
}

function actualizarContadorCat() {
    let form = document.getElementById('videos-form');
    if (!form) return;

    let checkboxes = form.querySelectorAll('input[name="categorias[]"]');
    let marcadas = 0;

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) marcadas++;
    }

    // actualiza contadores del panel de progreso
    let contCat = document.getElementById('cat-count');
    let contVid = document.getElementById('video-count');
    if (contCat) contCat.textContent = String(marcadas);
    if (contVid) contVid.textContent = marcadas + ' / 5';

    // guarda categorías elegidas en sessionStorage
    sessionStorage.setItem('vsCategoriasElegidas', String(marcadas));

    // actualiza texto del resumen del dropdown
    actualizarResumenDropdown(form, marcadas);
}

function actualizarResumenDropdown(form, numMarcadas) {
    let resumen = form.querySelector('.cat-dropdown-summary');
    if (!resumen) return;

    if (numMarcadas === 0) {
        resumen.textContent = 'Selecciona categorías';
    } else if (numMarcadas === 1) {
        resumen.textContent = '1 categoría seleccionada';
    } else {
        resumen.textContent = numMarcadas + ' categorías seleccionadas';
    }
}

// sincroniza el color del selector de rango
function activarSincronizarRango() {
    let form = document.getElementById('videos-form');
    if (!form) return;

    let selectRango = form.querySelector('.rank-select');
    if (!selectRango) return;

    sincronizarColorRango(selectRango);
    selectRango.addEventListener('change', function() {
        sincronizarColorRango(this);
        // guarda el rango en localStorage
        localStorage.setItem('vsTrainingRango', this.value);
    });

    // restaura el último rango usado
    let rangoGuardado = localStorage.getItem('vsTrainingRango');
    if (rangoGuardado && !selectRango.value) {
        selectRango.value = rangoGuardado;
        sincronizarColorRango(selectRango);
    }
}

function sincronizarColorRango(select) {
    for (let i = 0; i < RANGOS.length; i++) {
        select.classList.remove('rank-' + RANGOS[i]);
    }
    // extrae nombre base del rango para evitar clase con espacio
    let valorRaw = select.value.toLowerCase();
    let partesRango = valorRaw.split(' ');
    let valor = partesRango[0];
    if (valor) select.classList.add('rank-' + valor);

    // sincroniza también el badge del hero
    let badge = document.getElementById('rank-badge-active');
    if (badge) {
        for (let i = 0; i < RANGOS.length; i++) {
            badge.classList.remove('rank-' + RANGOS[i]);
        }
        if (valor) badge.classList.add('rank-' + valor);
    }
}

// selección de agentes en el recomendador
function activarSeleccionAgentes() {
    let checkboxes = document.querySelectorAll('.agent-btn input[type="checkbox"]');
    for (let i = 0; i < checkboxes.length; i++) {
        let boton = checkboxes[i].closest('.agent-btn');
        if (!boton) continue;

        // marca el estado visual inicial
        if (checkboxes[i].checked) {
            boton.classList.add('is-selected');
        }
        checkboxes[i].addEventListener('change', cambioAgente);
    }
    actualizarEstadoComp();
}

function cambioAgente() {
    let boton = this.closest('.agent-btn');
    if (boton) {
        if (this.checked) {
            boton.classList.add('is-selected');
        } else {
            boton.classList.remove('is-selected');
        }
    }
    actualizarEstadoComp();
}

function actualizarEstadoComp() {
    let checkboxes = document.querySelectorAll('.agent-btn input[type="checkbox"]');
    let statusEl = document.getElementById('comp-status');
    let MAX_AGENTES = 5;
    let marcados = 0;
    let rolesCubiertos = [];

    for (let i = 0; i < checkboxes.length; i++) {
        if (!checkboxes[i].checked) continue;
        marcados++;
        let boton = checkboxes[i].closest('.agent-btn');
        if (boton && boton.getAttribute('data-rol')) {
            let rol = boton.getAttribute('data-rol');
            if (rolesCubiertos.indexOf(rol) === -1) {
                rolesCubiertos.push(rol);
            }
        }
    }

    // bloquea el resto si ya hay 5 agentes
    for (let i = 0; i < checkboxes.length; i++) {
        let boton = checkboxes[i].closest('.agent-btn');
        if (!checkboxes[i].checked && marcados >= MAX_AGENTES) {
            checkboxes[i].disabled = true;
            if (boton) boton.classList.add('is-disabled');
        } else {
            checkboxes[i].disabled = false;
            if (boton) boton.classList.remove('is-disabled');
        }
    }

    // actualiza las píldoras de roles
    actualizarRolePills(rolesCubiertos);

    // actualiza el texto de estado
    if (statusEl) {
        if (marcados === 0) {
            statusEl.textContent = 'Marca los agentes que ya tenéis y pulsa "Recomendar".';
        } else if (marcados >= MAX_AGENTES) {
            statusEl.textContent = marcados + ' / ' + MAX_AGENTES + ' agentes · equipo completo.';
        } else {
            statusEl.textContent = marcados + ' / ' + MAX_AGENTES + ' agentes · faltan ' + (MAX_AGENTES - marcados);
        }
    }
}

function actualizarRolePills(rolesCubiertos) {
    let pills = document.querySelectorAll('#role-pills .role-pill');
    for (let i = 0; i < pills.length; i++) {
        let rol = pills[i].getAttribute('data-role');
        if (rolesCubiertos.indexOf(rol) !== -1) {
            pills[i].classList.add('is-covered');
        } else {
            pills[i].classList.remove('is-covered');
        }
    }
}

// marca el mapa seleccionado visualmente
function activarSeleccionMapas() {
    let botones = document.querySelectorAll('.map-btn');
    for (let i = 0; i < botones.length; i++) {
        botones[i].addEventListener('click', function() {
            // quita la selección de todos los mapas
            for (let j = 0; j < botones.length; j++) {
                botones[j].classList.remove('is-selected');
            }
            this.classList.add('is-selected');

            // guarda el mapa elegido en sessionStorage
            let nombreMapa = this.getAttribute('data-map') || '';
            sessionStorage.setItem('vsMapaElegido', nombreMapa);
        });
    }
}

// desplaza al resultado de composición
function scrollAlResultado() {
    let resultado = document.getElementById('recommendation-result');
    if (!resultado) return;

    setTimeout(function() {
        let posicion = resultado.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: posicion - 20, behavior: 'smooth' });
    }, 200);
}

// muestra la racha de días del usuario
function mostrarRachaUsuario() {
    let rachaEl = document.querySelector('.progress-value');
    if (!rachaEl) return;

    // obtiene o inicializa la racha guardada
    let rachaStr = localStorage.getItem('vsRachaEntrenamiento');
    let racha = parseInt(rachaStr) || 0;
    let hoy = new Date();
    let diaActual = hoy.getFullYear() + '-' + (hoy.getMonth() + 1) + '-' + hoy.getDate();
    let ultimoDia = localStorage.getItem('vsUltimoDiaEntrenado');

    // solo cuenta si es un día nuevo
    if (ultimoDia !== diaActual) {
        racha++;
        localStorage.setItem('vsRachaEntrenamiento', String(racha));
        localStorage.setItem('vsUltimoDiaEntrenado', diaActual);
    }

    // actualiza el número de racha en pantalla
    rachaEl.textContent = racha + ' días';
}
