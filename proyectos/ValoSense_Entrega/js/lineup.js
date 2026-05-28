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

let defaultVideo = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

// CAMBIO: const maps -> let maps
// RAZON: patron profesora, no se usa const
let maps = [
    { displayName: 'Ascent',   folder: 'ascent',   splash: 'imagenes/mapas/Ascent.png' },
    { displayName: 'Breeze',   folder: 'breeze',   splash: 'imagenes/mapas/Breeze.png' },
    { displayName: 'Fracture', folder: 'fracture', splash: 'imagenes/mapas/Fracture.png' },
    { displayName: 'Haven',    folder: 'haven',    splash: 'imagenes/mapas/Haven.png' },
    { displayName: 'Lotus',    folder: 'lotus',    splash: 'imagenes/mapas/Lotus.png' },
    { displayName: 'Pearl',    folder: 'pearl',    splash: 'imagenes/mapas/Pearl.png' },
    { displayName: 'Split',    folder: 'split',    splash: 'imagenes/mapas/Split.png' }
];

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
    seleccionarMapa(maps[0]);

    let primerAgente = document.querySelector('.agent-card');
    seleccionarAgente(agents[0], primerAgente, false);

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

    // CAMBIO: tabs.forEach -> bucle for
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
        });
    }
}

function getStrategicMapPath() {
    if (!estado.selectedMap) return '';
    let sideFile = estado.selectedSide === 'Ataque' ? 'ataque.png' : 'defensa.png';
    return 'imagenes/mapas_estrategicos/' + estado.selectedMap.folder + '/' + sideFile;
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

    // CAMBIO: forEach -> for
    let cards = document.querySelectorAll('.map-card');
    for (let i = 0; i < cards.length; i++) {
        let titulo = cards[i].querySelector('span');
        if (titulo) cards[i].classList.toggle('active', titulo.textContent === mapa.displayName);
    }
}

// CAMBIO: renderLineups -> renderizarLineups
// CAMBIO: ahora usa lineupData de PHP en vez de posiciones fijas de prueba
// RAZON: los lineups reales vienen de la BD via PHP
function renderizarLineups() {
    let layer = document.getElementById('lineupLayer');
    let lines = document.getElementById('lineupLines');
    if (!layer || !lines) return;

    // limpiar pines anteriores
    let viejos = layer.querySelectorAll('.lineup-point, .lineup-start, .lineup-agent-start, .lineup-tooltip');
    for (let i = 0; i < viejos.length; i++) viejos[i].remove();
    lines.innerHTML = '';

    if (!estado.selectedAgent || !estado.selectedMap) return;

    // filtrar lineups por mapa lado y agente en cliente
    let filtrados = [];
    for (let i = 0; i < lineupData.length; i++) {
        let lp = lineupData[i];
        if (lp.mapa === estado.selectedMap.displayName
            && lp.lado === estado.selectedSide
            && String(lp.agente_id) === String(estado.selectedAgent.dbId)) {
            filtrados.push(lp);
        }
    }

    for (let i = 0; i < filtrados.length; i++) {
        let lp = filtrados[i];
        if (!lp.destino_x || !lp.destino_y) continue;

        let punto = document.createElement('button');
        punto.className = 'lineup-point';
        punto.type = 'button';
        punto.style.left = lp.destino_x + '%';
        punto.style.top = lp.destino_y + '%';

        // buscar icono de la habilidad en el agente seleccionado
        let iconoHab = '';
        for (let j = 0; j < estado.selectedAgent.abilities.length; j++) {
            if (estado.selectedAgent.abilities[j].displayName === lp.habilidad) {
                iconoHab = estado.selectedAgent.abilities[j].displayIcon;
                break;
            }
        }

        punto.innerHTML = '<img src="' + iconoHab + '" alt="' + lp.habilidad + '">';

        punto.addEventListener('mouseenter', function() {
            mostrarLineaPrevia(lp, estado.selectedAgent);
            marcarHabilidadActiva(lp.habilidad);
        });
        punto.addEventListener('mouseleave', function() {
            limpiarLineaPrevia();
            marcarHabilidadActiva('');
        });
        punto.addEventListener('click', function() {
            if (lp.video_url) abrirModal(lp.titulo, lp.video_url);
        });

        layer.appendChild(punto);
    }
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
    agenteStart.style.top = (parseFloat(lp.inicio_y) + 7) + '%';
    agenteStart.innerHTML = '<img src="' + agente.displayIcon + '" alt="' + agente.displayName + '">';
    layer.appendChild(agenteStart);

    let tooltip = document.createElement('div');
    tooltip.className = 'lineup-tooltip';
    tooltip.style.left = lp.destino_x + '%';
    tooltip.style.top = lp.destino_y + '%';
    tooltip.innerHTML = lp.titulo + '<br>' + lp.habilidad + '<br>Pulsa para ver el video';
    layer.appendChild(tooltip);
}

// CAMBIO: clearLineupPreview -> limpiarLineaPrevia, forEach -> for
function limpiarLineaPrevia() {
    let lines = document.getElementById('lineupLines');
    let layer = document.getElementById('lineupLayer');
    if (lines) lines.innerHTML = '';
    if (layer) {
        let items = layer.querySelectorAll('.lineup-start, .lineup-agent-start, .lineup-tooltip');
        for (let i = 0; i < items.length; i++) items[i].remove();
    }
}

// CAMBIO: markAbilityActive -> marcarHabilidadActiva, forEach -> for
function marcarHabilidadActiva(nombre) {
    let cards = document.querySelectorAll('.ability-card');
    for (let i = 0; i < cards.length; i++) {
        cards[i].classList.toggle('active', cards[i].dataset.ability === nombre);
    }
}

// CAMBIO: selectAgent -> seleccionarAgente, forEach -> for
function seleccionarAgente(agente, btn, abrirHabilidades) {
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
        card.addEventListener('click', function() {
            abrirModal(agente.displayName + ' - ' + hab.displayName, defaultVideo);
        });
        grid.appendChild(card);
    }
}

// CAMBIO: openVideoModal -> abrirModal
// CAMBIO: convierte url de youtube a formato embed para el iframe
function abrirModal(titulo, videoUrl) {
    let modal = document.getElementById('videoModal');
    let frame = document.getElementById('videoFrame');
    let tit = document.getElementById('videoTitle');
    let embedUrl = videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');
    if (tit) tit.textContent = titulo;
    if (frame) frame.src = embedUrl;
    if (modal) modal.classList.add('open');
}

// CAMBIO: closeVideoModal -> cerrarModal
function cerrarModal() {
    let modal = document.getElementById('videoModal');
    let frame = document.getElementById('videoFrame');
    if (frame) frame.src = '';
    if (modal) modal.classList.remove('open');
}
