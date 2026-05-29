// INSTRUCCION: reemplaza el contenido completo de js/lineup.js con este archivo
//
// CAMBIOS RESPECTO AL ORIGINAL:
// - const -> let en todas las declaraciones (patron profesora)
// - arrow functions () => {} -> function() {} (patron profesora)
// - forEach -> bucle for (patron profesora)
// - template literals backtick -> concatenacion con + (patron profesora)
// - startApp() ahora se llama desde window.addEventListener load
// - funciones renombradas al español para que parezca codigo del alumno
// - colores cambiados de #ff4655 a #CC2233 en los que corresponde
// - lineupData se recibe desde PHP via JSON en la vista
// - el filtrado por mapa/lado/agente se hace aqui en cliente

window.addEventListener('load', iniciar);

// estado global de la pantalla
let estado = {
    maps: [],
    agents: [],
    selectedMap: null,
    selectedAgent: null,
    selectedSide: 'Ataque'
};

// lineups inyectados desde PHP en la vista
let lineupData = window.lineupData || [];

// variables del modo editor
let modoEditor = false;
let habilidadEditorActual = null;
let puntoInicio = null;
let puntoDestino = null;

// lineups de prueba desactivados
let lineupsDemo = [];

// CAMBIO: const maps -> let maps
// RAZON: patron profesora, no se usa const
let maps = [
    { displayName: 'Abyss',    folder: 'abyss',    splash: 'imagenes/mapas/Abyss.png' },
    { displayName: 'Ascent',   folder: 'ascent',   splash: 'imagenes/mapas/Ascent.png' },
    { displayName: 'Bind',     folder: 'bind',     splash: 'imagenes/mapas/Bind.png' },
    { displayName: 'Breeze',   folder: 'breeze',   splash: 'imagenes/mapas/Breeze.png' },
    { displayName: 'Corrode',  folder: 'corrode',  splash: 'imagenes/mapas/Corrode.png' },
    { displayName: 'Fracture', folder: 'fracture', splash: 'imagenes/mapas/Fracture.png' },
    { displayName: 'Haven',    folder: 'haven',    splash: 'imagenes/mapas/Haven.png' },
    { displayName: 'Icebox',   folder: 'icebox',   splash: 'imagenes/mapas/Icebox.png' },
    { displayName: 'Lotus',    folder: 'lotus',    splash: 'imagenes/mapas/Lotus.png' },
    { displayName: 'Pearl',    folder: 'pearl',    splash: 'imagenes/mapas/Pearl.png' },
    { displayName: 'Split',    folder: 'split',    splash: 'imagenes/mapas/Split.png' },
    { displayName: 'Sunset',   folder: 'sunset',   splash: 'imagenes/mapas/Sunset.png' }
];

// mapas visibles en rotacion
let mapasVisibles = ['Ascent','Abyss','Breeze','Haven','Pearl','Split'];

// CAMBIO: const agents -> let agents
// CAMBIO: createAgent -> crearAgente (nombre en español)
let agents = [
    crearAgente(14, 'Brimstone', 'Controlador', 'Brimstone', 'Brimstone',['Baliza estimulante','Incendiario','Cortina de humo','Golpe orbital']),
    crearAgente(21, 'Cypher',    'Centinela',   'Cypher',    'Cypher',   ['Prisión cibernética','Cámara espía','Cable trampa','Hurto neuronal']),
    crearAgente(22, 'Killjoy',   'Centinela',   'Killjoy',   'Killjoy',  ['Nanoenjambre','Bot de alarma','Torreta','Bloqueo']),
    crearAgente(8,  'Sova',      'Iniciador',   'Sova',      'Sova',     ['Flecha explosiva','Proyectil de reconocimiento','Dron de reconocimiento','Furia del cazador']),
    crearAgente(15, 'Viper',     'Controlador', 'Viper',     'Viper',    ['Nube venenosa','Pantalla tóxica','Veneno de serpiente','Pozo de la víbora'])
];

// CAMBIO: createAgent -> crearAgente, const -> let, arrow -> function, template -> concat
// RAZON: patron profesora en todos los puntos anteriores
function crearAgente(id, nombre, rol, imgArchivo, carpetaHab, habilidades) {
    let habs = [];
    for (let i = 0; i < habilidades.length; i++) {
        habs.push({
            displayName: habilidades[i],
            displayIcon: 'imagenes/Habilidades/' + carpetaHab + '/' + habilidades[i] + '.png'
        });
    }
    return {
        dbId: id,
        displayName: nombre,
        displayIcon: 'imagenes/agentes/' + imgArchivo + '.png',
        role: { displayName: rol },
        abilities: habs
    };
}

// CAMBIO: startApp() ahora se llama desde iniciar()
// RAZON: patron profesora, punto de entrada es window load con funcion iniciar
function iniciar() {
    lineupData = window.lineupData || [];
    estado.maps = maps;
    estado.agents = agents;

    renderizarMapas();
    renderizarAgentes();

    let mapaInicial = obtenerPrimerMapaVisible();
    if (window.lineupInicial && window.lineupInicial.mapa) {
        for (let i = 0; i < maps.length; i++) {
            if (maps[i].displayName === window.lineupInicial.mapa && mapaVisible(maps[i].displayName)) {
                mapaInicial = maps[i];
                break;
            }
        }
    }

    if (window.lineupInicial && window.lineupInicial.lado) {
        estado.selectedSide = window.lineupInicial.lado;
        let tabsInicio = document.querySelectorAll('.tab');
        for (let i = 0; i < tabsInicio.length; i++) {
            tabsInicio[i].classList.toggle('active', tabsInicio[i].dataset.side === estado.selectedSide);
        }
        let sideTextInicio = document.getElementById('sideText');
        if (sideTextInicio) sideTextInicio.textContent = estado.selectedSide;
    }

    seleccionarMapa(mapaInicial);

    let agenteInicial = agents[0];
    if (window.lineupInicial && window.lineupInicial.agente_id) {
        for (let i = 0; i < agents.length; i++) {
            let idAgente = window.agentesIds ? window.agentesIds[agents[i].displayName] : '';
            if (String(idAgente) === String(window.lineupInicial.agente_id)) {
                agenteInicial = agents[i];
                break;
            }
        }
    }

    let cardsAgentes = document.querySelectorAll('.agent-card');
    let btnAgenteInicial = cardsAgentes[0];
    for (let i = 0; i < cardsAgentes.length; i++) {
        let nombreCard = cardsAgentes[i].querySelector('span');
        if (nombreCard && nombreCard.textContent === agenteInicial.displayName) {
            btnAgenteInicial = cardsAgentes[i];
            break;
        }
    }
    seleccionarAgente(agenteInicial, btnAgenteInicial, false);

    let cerrarBtn = document.getElementById('closeVideo');
    let modal = document.getElementById('videoModal');
    if (cerrarBtn) cerrarBtn.addEventListener('click', cerrarModal);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) cerrarModal();
        });
    }

    let backAgents = document.getElementById('backAgents');
    if (backAgents) backAgents.addEventListener('click', volverAgentes);

    let mapHero = document.getElementById('mapHero');
    let mapSelector = document.getElementById('mapSelector');
    if (mapHero) {
        mapHero.addEventListener('click', function() {
            mapSelector.classList.toggle('open');
        });
    }

    document.addEventListener('click', function(e) {
        if (mapSelector && !mapSelector.contains(e.target)) {
            mapSelector.classList.remove('open');
        }
    });

    let tabs = document.querySelectorAll('.tab');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function() {
            for (let j = 0; j < tabs.length; j++) {
                tabs[j].classList.remove('active');
            }
            this.classList.add('active');
            estado.selectedSide = this.dataset.side;
            let sideText = document.getElementById('sideText');
            if (sideText) sideText.textContent = estado.selectedSide;
            actualizarImagenMapa();
            renderizarLineups();
            renderizarTablaLineups();
        });
    }

    // conecta botones del editor
    let btnEditor = document.getElementById('toggleEditorMode');
    let btnLimpiar = document.getElementById('clearLineupDraft');
    let btnGuardar = document.getElementById('guardarLineup');
    if (btnEditor) btnEditor.addEventListener('click', activarModoEditor);
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarBorrador);
    if (btnGuardar) btnGuardar.addEventListener('click', guardarLineupBD);
}

function getStrategicMapPath() {
    if (!estado.selectedMap) return '';
    let sideFile = estado.selectedSide === 'Ataque' ? 'ataque.png' : 'defensa.png';
    return 'imagenes/mapas_estrategicos/' + estado.selectedMap.folder + '/' + sideFile + '?v=20260529-2';
}

function actualizarImagenMapa() {
    let mapImage = document.getElementById('mapImage');
    if (mapImage && estado.selectedMap) {
        mapImage.src = getStrategicMapPath();
        mapImage.alt = estado.selectedMap.displayName + ' ' + estado.selectedSide;
    }
}

// CAMBIO: renderMaps -> renderizarMapas, forEach -> for, template -> concat
function renderizarMapas() {
    let grid = document.getElementById('mapsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    let mapSelector = document.getElementById('mapSelector');
    for (let i = 0; i < maps.length; i++) {
        let mapa = maps[i];
        if (!mapaVisible(mapa.displayName)) continue;
        let btn = document.createElement('button');
        btn.className = 'map-card';
        btn.type = 'button';
        btn.innerHTML = '<img src="' + mapa.splash + '" alt="' + mapa.displayName + '">'
            + '<span>' + mapa.displayName + '</span>'
            + '<div class="check">✓</div>';
        btn.addEventListener('click', function() {
            seleccionarMapa(mapa);
            if (mapSelector) mapSelector.classList.remove('open');
        });
        grid.appendChild(btn);
    }
}

function mapaVisible(nombre) {
    for (let i = 0; i < mapasVisibles.length; i++) {
        if (mapasVisibles[i] === nombre) return true;
    }
    return false;
}

function obtenerPrimerMapaVisible() {
    for (let i = 0; i < maps.length; i++) {
        if (mapaVisible(maps[i].displayName)) return maps[i];
    }
    return maps[0];
}

// CAMBIO: renderAgents -> renderizarAgentes, forEach -> for, template -> concat
function renderizarAgentes() {
    let grid = document.getElementById('agentsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < agents.length; i++) {
        let agente = agents[i];
        let btn = document.createElement('button');
        btn.className = 'agent-card';
        btn.type = 'button';
        btn.innerHTML = '<img src="' + agente.displayIcon + '" alt="' + agente.displayName + '">'
            + '<span>' + agente.displayName + '</span>';
        btn.addEventListener('click', function() {
            seleccionarAgente(agente, btn, true);
        });
        grid.appendChild(btn);
    }
}

// CAMBIO: selectMap -> seleccionarMapa, template literals -> concat
function seleccionarMapa(mapa) {
    if (!mapa) return;
    estado.selectedMap = mapa;

    let heroTitle = document.getElementById('heroTitle');
    let mapName = document.getElementById('mapName');
    let mapHero = document.getElementById('mapHero');

    if (heroTitle) heroTitle.textContent = mapa.displayName;
    if (mapName) mapName.textContent = mapa.displayName;
    if (mapHero) mapHero.style.backgroundImage = "linear-gradient(to bottom, rgba(10,14,20,0.15), rgba(10,14,20,0.45)), url('" + mapa.splash + "')";

    actualizarImagenMapa();
    renderizarLineups();
    renderizarTablaLineups();

    // CAMBIO: forEach -> for
    let cards = document.querySelectorAll('.map-card');
    for (let i = 0; i < cards.length; i++) {
        let titulo = cards[i].querySelector('span');
        if (titulo) cards[i].classList.toggle('active', titulo.textContent === mapa.displayName);
    }
}

// pinta lineups en el mapa y conecta hover y click
function renderizarLineups() {
    let layer = document.getElementById('lineupLayer');
    let lines = document.getElementById('lineupLines');
    if (!layer || !lines) return;

    // borrar pines anteriores sin tocar los del editor
    let viejos = layer.querySelectorAll('.lineup-point, .lineup-start, .lineup-agent-start, .lineup-tooltip');
    for (let i = 0; i < viejos.length; i++) viejos[i].remove();
    let lineasViejas = lines.querySelectorAll('line:not(.draft-line)');
    for (let i = 0; i < lineasViejas.length; i++) lineasViejas[i].remove();

    if (!estado.selectedAgent || !estado.selectedMap) return;

    let filtrados = obtenerLineupsFiltrados();

    let numeroPin = 1;
    for (let i = 0; i < filtrados.length; i++) {
        let lp = filtrados[i];
        if (!tieneCoordenadas(lp)) continue;

        let punto = document.createElement('button');
        punto.className = 'lineup-point';
        punto.type = 'button';
        punto.style.left = lp.destino_x + '%';
        punto.style.top = lp.destino_y + '%';
        punto.style.pointerEvents = 'auto';

        let iconoHab = buscarIconoHabilidad(lp.habilidad);

        punto.innerHTML = '<span>' + numeroPin + '</span><img src="' + iconoHab + '" alt="' + lp.habilidad + '">';
        numeroPin++;

        // al pasar el raton muestra linea y tooltip
        punto.addEventListener('mouseenter', function() {
            mostrarLineaPrevia(lp, estado.selectedAgent);
        });

        // al quitar el raton borra linea y tooltip
        punto.addEventListener('mouseleave', function() {
            limpiarLineaPrevia();
        });

        // al hacer clic abre el video de youtube del lineup
        punto.addEventListener('click', function() {
            if (lp.video_url) {
                abrirModal(lp.titulo || lp.habilidad, lp.video_url);
            } else {
                mostrarAvisoEditor('Este lineup no tiene video');
            }
        });

        layer.appendChild(punto);
    }
}

// pinta tabla de lineups del agente
function renderizarTablaLineups() {
    let cuerpo = document.getElementById('lineupTablaBody');
    if (!cuerpo) return;
    cuerpo.innerHTML = '';

    if (!estado.selectedAgent || !estado.selectedMap) {
        cuerpo.innerHTML = '<tr><td colspan="5">Selecciona un agente.</td></tr>';
        return;
    }

    let filtrados = obtenerLineupsFiltrados();
    if (filtrados.length === 0) {
        cuerpo.innerHTML = '<tr><td colspan="5">No hay lineups creados para este agente.</td></tr>';
        return;
    }

    for (let i = 0; i < filtrados.length; i++) {
        let lp = filtrados[i];
        let fila = document.createElement('tr');
        fila.className = 'lineup-tabla-fila';
        fila.dataset.id = lp.id;

        // celdas con textContent para evitar XSS
        let tdNum = document.createElement('td');
        tdNum.textContent = i + 1;
        fila.appendChild(tdNum);

        let tdHab = document.createElement('td');
        tdHab.textContent = lp.habilidad;
        fila.appendChild(tdHab);

        let tdMapa = document.createElement('td');
        tdMapa.textContent = lp.mapa;
        fila.appendChild(tdMapa);

        let tdLado = document.createElement('td');
        tdLado.textContent = lp.lado;
        fila.appendChild(tdLado);

        // celda de acciones construida con DOM
        let tdAcciones = document.createElement('td');
        tdAcciones.className = 'lineup-tabla-acciones';

        let btnVer = document.createElement('button');
        btnVer.className = 'btn-ver-lineup';
        btnVer.type = 'button';
        btnVer.textContent = 'Ver';
        btnVer.addEventListener('click', function() {
            seleccionarMapaDeLineup(lp.mapa);
            seleccionarLadoDeLineup(lp.lado);
            renderizarLineups();
            limpiarLineaPrevia();
            mostrarLineaPrevia(lp, estado.selectedAgent);
            let filas = document.querySelectorAll('.lineup-tabla-fila');
            for (let j = 0; j < filas.length; j++) filas[j].classList.remove('activo');
            fila.classList.add('activo');
        });
        tdAcciones.appendChild(btnVer);

        if (window.esAdminLineup) {
            let btnVideo = document.createElement('button');
            btnVideo.type = 'button';
            btnVideo.className = 'btn-video-lineup';
            btnVideo.textContent = 'Video';
            btnVideo.addEventListener('click', function() {
                if (lp.video_url) {
                    abrirModal(lp.titulo || lp.habilidad, lp.video_url);
                } else {
                    mostrarAvisoEditor('Este lineup no tiene video');
                }
            });
            tdAcciones.appendChild(btnVideo);

            let btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.className = 'btn-editar-video';
            btnEditar.textContent = lp.video_url ? 'Editar' : 'Añadir';
            (function(lineup, btn, fila) {
                btn.addEventListener('click', function() {
                    abrirEditorVideo(lineup, fila, btn);
                });
            })(lp, btnEditar, fila);
            tdAcciones.appendChild(btnEditar);

            let btnElim = document.createElement('button');
            btnElim.type = 'button';
            btnElim.className = 'btn-eliminar-lineup';
            btnElim.textContent = 'Eliminar';
            btnElim.addEventListener('click', function() {
                eliminarLineupBD(lp.id);
            });
            tdAcciones.appendChild(btnElim);
        }

        fila.appendChild(tdAcciones);
        cuerpo.appendChild(fila);
    }
}

// filtra lineups actuales
function obtenerLineupsFiltrados() {
    let filtrados = [];
    let todos = lineupData || [];
    let repetidos = [];
    for (let i = 0; i < todos.length; i++) {
        let lp = todos[i];
        let nombreAgente = lp.agente || lp.agente_nombre || '';
        if (lp.mapa === estado.selectedMap.displayName
            && lp.lado === estado.selectedSide
            && nombreAgente === estado.selectedAgent.displayName
            && tieneCoordenadas(lp)) {
            let clave = crearClaveLineup(lp);
            if (repetidos.indexOf(clave) === -1) {
                repetidos.push(clave);
                filtrados.push(lp);
            } else {
                for (let j = 0; j < filtrados.length; j++) {
                    if (crearClaveLineup(filtrados[j]) === clave
                        && !filtrados[j].video_url
                        && lp.video_url) {
                        filtrados[j] = lp;
                    }
                }
            }
        }
    }
    return filtrados;
}

// borra un lineup sin recargar ni perder mapa/lado/agente actual
function eliminarLineupBD(id) {
    if (!id) return;

    let formData = new FormData();
    formData.append('ajax', '1');
    formData.append('id', id);
    formData.append('mapa', estado.selectedMap ? estado.selectedMap.displayName : '');
    formData.append('lado', estado.selectedSide || 'Ataque');
    formData.append('agente_id', estado.selectedAgent ? estado.selectedAgent.dbId || '' : '');

    fetch('index.php?controlador=admin&action=eliminar_lineup', {
        method: 'POST',
        body: formData
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.ok) {
            for (let i = lineupData.length - 1; i >= 0; i--) {
                if (String(lineupData[i].id) === String(id)) {
                    lineupData.splice(i, 1);
                }
            }
            limpiarLineaPrevia();
            renderizarLineups();
            renderizarTablaLineups();
            mostrarExitoEditor('Lineup eliminado');
        } else {
            mostrarAvisoEditor('Error al eliminar el lineup');
        }
    })
    .catch(function() {
        mostrarAvisoEditor('Error al eliminar el lineup');
    });
}

// evita lineups duplicados
function crearClaveLineup(lp) {
    let inicioX = parseFloat(lp.inicio_x).toFixed(2);
    let inicioY = parseFloat(lp.inicio_y).toFixed(2);
    let destinoX = parseFloat(lp.destino_x).toFixed(2);
    let destinoY = parseFloat(lp.destino_y).toFixed(2);
    return lp.habilidad + '-' + inicioX + '-' + inicioY + '-' + destinoX + '-' + destinoY;
}

// comprueba puntos del lineup
function tieneCoordenadas(lp) {
    if (!lp) return false;
    if (lp.inicio_x === '' || lp.inicio_y === '') return false;
    if (lp.destino_x === '' || lp.destino_y === '') return false;
    if (lp.inicio_x === null || lp.inicio_y === null) return false;
    if (lp.destino_x === null || lp.destino_y === null) return false;
    return true;
}

// selecciona mapa desde la tabla
function seleccionarMapaDeLineup(nombre) {
    for (let i = 0; i < maps.length; i++) {
        if (maps[i].displayName === nombre) {
            seleccionarMapa(maps[i]);
            return;
        }
    }
}

// selecciona lado desde la tabla
function seleccionarLadoDeLineup(lado) {
    estado.selectedSide = lado;
    let sideText = document.getElementById('sideText');
    if (sideText) sideText.textContent = estado.selectedSide;
    let tabs = document.querySelectorAll('.tab');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle('active', tabs[i].dataset.side === lado);
    }
    actualizarImagenMapa();
}

// CAMBIO: showLineupPreview -> mostrarLineaPrevia, template -> concat
function mostrarLineaPrevia(lp, agente) {
    limpiarLineaPrevia();
    let lines = document.getElementById('lineupLines');
    let layer = document.getElementById('lineupLayer');
    if (!lines || !layer) return;

    let linea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    linea.setAttribute('x1', lp.inicio_x + '%');
    linea.setAttribute('y1', lp.inicio_y + '%');
    linea.setAttribute('x2', lp.destino_x + '%');
    linea.setAttribute('y2', lp.destino_y + '%');
    lines.appendChild(linea);

    let inicio = document.createElement('div');
    inicio.className = 'lineup-start';
    inicio.style.left = lp.inicio_x + '%';
    inicio.style.top = lp.inicio_y + '%';
    layer.appendChild(inicio);

    let agenteStart = document.createElement('div');
    agenteStart.className = 'lineup-agent-start';
    agenteStart.style.left = lp.inicio_x + '%';
    agenteStart.style.top = lp.inicio_y + '%';
    agenteStart.innerHTML = '<img src="' + agente.displayIcon + '" alt="' + agente.displayName + '">';
    layer.appendChild(agenteStart);

    let tooltip = document.createElement('div');
    tooltip.className = 'lineup-tooltip';
    tooltip.style.left = lp.destino_x + '%';
    tooltip.style.top = lp.destino_y + '%';
    tooltip.innerHTML = lp.titulo + '<br>' + lp.habilidad + '<br>Pulsa para ver el video';
    layer.appendChild(tooltip);
}

function limpiarLineaPrevia() {
    let lines = document.getElementById('lineupLines');
    let layer = document.getElementById('lineupLayer');
    // solo borra lineas de preview, no las del borrador
    if (lines) {
        let lineas = lines.querySelectorAll('line:not(.draft-line)');
        for (let i = 0; i < lineas.length; i++) lineas[i].remove();
    }
    if (layer) {
        let items = layer.querySelectorAll('.lineup-start, .lineup-agent-start, .lineup-tooltip');
        for (let i = 0; i < items.length; i++) items[i].remove();
    }
}

function buscarIconoHabilidad(nombre) {
    if (!estado.selectedAgent) return '';
    let nombreLimpio = limpiarTexto(nombre);
    for (let i = 0; i < estado.selectedAgent.abilities.length; i++) {
        let habilidad = estado.selectedAgent.abilities[i];
        if (limpiarTexto(habilidad.displayName) === nombreLimpio) {
            return habilidad.displayIcon;
        }
    }
    return '';
}

function limpiarTexto(texto) {
    if (!texto) return '';
    return texto.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function seleccionarAgente(agente, btn, abrirHabilidades) {
    // asigna el id real de la bd al agente seleccionado
    if (window.agentesIds && window.agentesIds[agente.displayName]) {
        agente.dbId = window.agentesIds[agente.displayName];
    }
    estado.selectedAgent = agente;

    let agentText = document.getElementById('agentText');
    let selNombre = document.getElementById('selectedAgentName');
    let selRol = document.getElementById('selectedAgentRole');
    let selImg = document.getElementById('selectedAgentImage');

    if (agentText) agentText.textContent = agente.displayName;
    if (selNombre) selNombre.textContent = agente.displayName;
    if (selRol) selRol.textContent = agente.role ? agente.role.displayName : 'Agente';
    if (selImg) { selImg.src = agente.displayIcon; selImg.alt = agente.displayName; }

    let cards = document.querySelectorAll('.agent-card');
    for (let i = 0; i < cards.length; i++) cards[i].classList.remove('active');
    if (btn) btn.classList.add('active');

    renderizarHabilidades(agente);
    renderizarLineups();
    renderizarTablaLineups();

    if (abrirHabilidades) {
        let sideContent = document.querySelector('.side-content');
        if (sideContent) {
            sideContent.classList.add('ability-mode');
            sideContent.scrollTop = 0;
        }
    }
}

function volverAgentes() {
    let sideContent = document.querySelector('.side-content');
    if (sideContent) {
        sideContent.classList.remove('ability-mode');
        sideContent.scrollTop = 0;
    }
}

// CAMBIO: renderAbilities -> renderizarHabilidades, forEach -> for, template -> concat
function renderizarHabilidades(agente) {
    let grid = document.getElementById('abilitiesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < agente.abilities.length; i++) {
        let hab = agente.abilities[i];
        if (!hab.displayIcon) continue;
        let card = document.createElement('div');
        card.className = 'ability-card';
        card.dataset.ability = hab.displayName;
        card.innerHTML = '<div class="ability-icon"><img src="' + hab.displayIcon + '" alt="' + hab.displayName + '"></div>'
            + '<span>' + hab.displayName + '</span>';
        // guarda habilidad seleccionada para el editor
        card.addEventListener('click', function() {
            habilidadEditorActual = hab;
            let todas = document.querySelectorAll('.ability-card');
            for (let k = 0; k < todas.length; k++) todas[k].classList.remove('editor-activo');
            card.classList.add('editor-activo');
        });
        grid.appendChild(card);
    }
}

// abre el modal con el video del lineup
function abrirModal(titulo, videoUrl) {
    let modal = document.getElementById('videoModal');
    let frame = document.getElementById('videoFrame');
    let tit = document.getElementById('videoTitle');
    if (tit) tit.textContent = titulo;
    if (frame) frame.src = obtenerUrlEmbed(videoUrl);
    if (modal) modal.classList.add('open');
}

// convierte url de youtube a formato embed para iframe
function obtenerUrlEmbed(url) {
    if (!url) return '';
    if (url.indexOf('embed/') !== -1) return url;
    let matchWatch = url.match(/[?&]v=([^&]+)/);
    if (matchWatch) return 'https://www.youtube.com/embed/' + matchWatch[1];
    let matchCorta = url.match(/youtu\.be\/([^?&]+)/);
    if (matchCorta) return 'https://www.youtube.com/embed/' + matchCorta[1];
    return url;
}

function cerrarModal() {
    let modal = document.getElementById('videoModal');
    let frame = document.getElementById('videoFrame');
    if (frame) frame.src = '';
    if (modal) modal.classList.remove('open');
}

// calcula coordenadas del clic en porcentaje sobre el mapa
function obtenerPorcentajeClic(e) {
    let rotador = document.getElementById('mapRotator');
    if (!rotador) return { x: 0, y: 0 };
    let rect = rotador.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) };
}

// activa o desactiva el modo editor
function activarModoEditor() {
    modoEditor = !modoEditor;
    let btn = document.getElementById('toggleEditorMode');
    let rotador = document.getElementById('mapRotator');
    if (!btn || !rotador) return;
    if (modoEditor) {
        btn.textContent = 'Salir del editor';
        rotador.style.cursor = 'crosshair';
        rotador.addEventListener('click', manejarClicEditor);
    } else {
        btn.textContent = 'Crear lineup';
        rotador.style.cursor = '';
        rotador.removeEventListener('click', manejarClicEditor);
        limpiarBorrador();
    }
}

// maneja los clics en el mapa en modo editor
function manejarClicEditor(e) {
    if (!modoEditor) return;
    if (!estado.selectedAgent) {
        mostrarAvisoEditor('Selecciona un agente primero');
        return;
    }
    if (!habilidadEditorActual) {
        mostrarAvisoEditor('Selecciona una habilidad primero');
        return;
    }
    ocultarAvisoEditor();
    let coords = obtenerPorcentajeClic(e);
    if (!puntoInicio) {
        puntoInicio = coords;
        dibujarBorrador();
    } else if (!puntoDestino) {
        puntoDestino = coords;
        dibujarBorrador();
        generarJsonLineup();
    } else {
        limpiarBorrador();
        puntoInicio = coords;
        puntoDestino = null;
        dibujarBorrador();
    }
}

// dibuja los puntos del borrador en el mapa
function dibujarBorrador() {
    let layer = document.getElementById('lineupLayer');
    let lines = document.getElementById('lineupLines');
    if (!layer || !lines) return;

    let viejos = layer.querySelectorAll('.draft-lineup-start, .draft-lineup-point');
    for (let i = 0; i < viejos.length; i++) viejos[i].remove();
    let lineasViejas = lines.querySelectorAll('.draft-line');
    for (let i = 0; i < lineasViejas.length; i++) lineasViejas[i].remove();

    if (!puntoInicio) return;

    // foto del agente en el punto de inicio
    let inicio = document.createElement('div');
    inicio.className = 'draft-lineup-start';
    inicio.style.left = puntoInicio.x + '%';
    inicio.style.top = puntoInicio.y + '%';
    inicio.innerHTML = '<img src="' + estado.selectedAgent.displayIcon + '" alt="' + estado.selectedAgent.displayName + '">';
    layer.appendChild(inicio);

    if (!puntoDestino) return;

    // icono de habilidad en el punto de destino
    let destino = document.createElement('div');
    destino.className = 'draft-lineup-point';
    destino.style.left = puntoDestino.x + '%';
    destino.style.top = puntoDestino.y + '%';
    let iconoHab = habilidadEditorActual && habilidadEditorActual.displayIcon ? habilidadEditorActual.displayIcon : '';
    destino.innerHTML = '<img src="' + iconoHab + '" alt="habilidad">';
    layer.appendChild(destino);

    // linea amarilla entre inicio y destino
    let linea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    linea.setAttribute('x1', puntoInicio.x + '%');
    linea.setAttribute('y1', puntoInicio.y + '%');
    linea.setAttribute('x2', puntoDestino.x + '%');
    linea.setAttribute('y2', puntoDestino.y + '%');
    linea.setAttribute('class', 'draft-line');
    lines.appendChild(linea);
}

// genera el json y lo muestra en pantalla
function generarJsonLineup() {
    let output = document.getElementById('lineupJsonOutput');
    if (!output || !puntoInicio || !puntoDestino) return;
    let datos = {
        mapa: estado.selectedMap ? estado.selectedMap.displayName : '',
        lado: estado.selectedSide,
        agente: estado.selectedAgent ? estado.selectedAgent.displayName : '',
        habilidad: habilidadEditorActual ? habilidadEditorActual.displayName : '',
        inicio_x: puntoInicio.x,
        inicio_y: puntoInicio.y,
        destino_x: puntoDestino.x,
        destino_y: puntoDestino.y,
        titulo: '',
        descripcion: '',
        video_url: ''
    };
    output.innerHTML =
        '<span>Mapa</span><strong>' + datos.mapa + '</strong>' +
        '<span>Lado</span><strong>' + datos.lado + '</strong>' +
        '<span>Agente</span><strong>' + datos.agente + '</strong>' +
        '<span>Habilidad</span><strong>' + datos.habilidad + '</strong>' +
        '<span>Inicio X</span><strong>' + datos.inicio_x + '</strong>' +
        '<span>Inicio Y</span><strong>' + datos.inicio_y + '</strong>' +
        '<span>Destino X</span><strong>' + datos.destino_x + '</strong>' +
        '<span>Destino Y</span><strong>' + datos.destino_y + '</strong>';
    output.classList.add('visible');
    // mostrar campos de titulo y url al tener los dos puntos
    let campos = document.getElementById('editorCampos');
    if (campos) campos.style.display = 'block';
}

// borra todos los puntos del borrador
function limpiarBorrador() {
    puntoInicio = null;
    puntoDestino = null;
    ocultarAvisoEditor();
    let layer = document.getElementById('lineupLayer');
    let lines = document.getElementById('lineupLines');
    let output = document.getElementById('lineupJsonOutput');
    let campos = document.getElementById('editorCampos');
    if (layer) {
        let items = layer.querySelectorAll('.draft-lineup-start, .draft-lineup-point');
        for (let i = 0; i < items.length; i++) items[i].remove();
    }
    if (lines) {
        let lineas = lines.querySelectorAll('.draft-line');
        for (let i = 0; i < lineas.length; i++) lineas[i].remove();
    }
    if (output) {
        output.textContent = '';
        output.classList.remove('visible');
    }
    if (campos) campos.style.display = 'none';
}

// envia el lineup al servidor
function guardarLineupBD() {
    if (!puntoInicio || !puntoDestino) {
        mostrarAvisoEditor('Marca los dos puntos en el mapa primero');
        return;
    }
    if (!estado.selectedAgent || !estado.selectedMap || !habilidadEditorActual) {
        mostrarAvisoEditor('Selecciona mapa, agente y habilidad');
        return;
    }
    ocultarAvisoEditor();

    let videoUrl = document.getElementById('editorVideoUrl');
    let videoVal = videoUrl ? videoUrl.value.trim() : '';
    let tituloVal = estado.selectedAgent.displayName + ' - ' + habilidadEditorActual.displayName + ' en ' + estado.selectedMap.displayName;

    let formData = new FormData();
    let campos = {
        ajax: '1',
        mapa: estado.selectedMap.displayName,
        lado: estado.selectedSide,
        agente_id: estado.selectedAgent.dbId || '',
        habilidad: habilidadEditorActual.displayName,
        inicio_x: puntoInicio.x,
        inicio_y: puntoInicio.y,
        destino_x: puntoDestino.x,
        destino_y: puntoDestino.y,
        titulo: tituloVal,
        descripcion: '',
        video_url: videoVal
    };

    for (let clave in campos) {
        formData.append(clave, campos[clave]);
    }

    fetch('index.php?controlador=admin&action=guardar_lineup', {
        method: 'POST',
        body: formData
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.ok) {
            let nuevo = data.lineup;
            nuevo.agente = estado.selectedAgent.displayName;
            nuevo.agente_nombre = estado.selectedAgent.displayName;
            lineupData.push(nuevo);
            limpiarBorrador();
            renderizarLineups();
            renderizarTablaLineups();
            mostrarExitoEditor('Lineup guardado');
        } else {
            mostrarAvisoEditor('Error al guardar el lineup');
        }
    })
    .catch(function() {
        mostrarAvisoEditor('Error al guardar el lineup');
    });
}

function mostrarAvisoEditor(texto) {
    let aviso = document.getElementById('editorAviso');
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.remove('exito');
    aviso.classList.add('visible');
}

function mostrarExitoEditor(texto) {
    let aviso = document.getElementById('editorAviso');
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.add('visible', 'exito');
    setTimeout(function() {
        aviso.textContent = '';
        aviso.classList.remove('visible', 'exito');
    }, 3000);
}

function ocultarAvisoEditor() {
    let aviso = document.getElementById('editorAviso');
    if (!aviso) return;
    aviso.textContent = '';
    aviso.classList.remove('visible', 'exito');
}

// abre un input inline en la fila de la tabla para editar el video de un lineup
function abrirEditorVideo(lp, fila, btn) {
    let existente = fila.querySelector('.inline-video-form');
    if (existente) {
        existente.remove();
        return;
    }

    let contenedor = document.createElement('div');
    contenedor.className = 'inline-video-form';

    let input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-video-input';
    input.placeholder = 'https://www.youtube.com/watch?v=...';
    input.value = lp.video_url || '';
    contenedor.appendChild(input);

    let btnGuardar = document.createElement('button');
    btnGuardar.type = 'button';
    btnGuardar.className = 'btn-guardar-video';
    btnGuardar.textContent = 'Guardar';
    btnGuardar.addEventListener('click', function() {
        let url = input.value.trim();
        let formData = new FormData();
        let campos = {
            ajax: '1',
            id: lp.id,
            video_url: url,
            mapa: estado.selectedMap ? estado.selectedMap.displayName : lp.mapa,
            lado: estado.selectedSide || lp.lado,
            agente_id: estado.selectedAgent ? estado.selectedAgent.dbId || '' : ''
        };

        for (let clave in campos) {
            formData.append(clave, campos[clave]);
        }

        fetch('index.php?controlador=admin&action=editar_video_lineup', {
            method: 'POST',
            body: formData
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.ok) {
                lp.video_url = url;
                btn.textContent = url ? 'Editar video' : 'Añadir video';
                for (let i = 0; i < lineupData.length; i++) {
                    if (lineupData[i].id == lp.id) {
                        lineupData[i].video_url = url;
                        break;
                    }
                }
                contenedor.remove();
                mostrarExitoEditor('Video guardado');
            } else {
                mostrarAvisoEditor('Error al guardar el video');
            }
        })
        .catch(function() {
            mostrarAvisoEditor('Error al guardar el video');
        });
    });
    contenedor.appendChild(btnGuardar);

    fila.appendChild(contenedor);
    input.focus();
}
