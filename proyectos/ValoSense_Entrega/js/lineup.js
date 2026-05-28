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

// lineups de prueba para ver sin base de datos
let lineupsDemo = [
    {
        id: 1,
        mapa: 'Ascent',
        lado: 'Ataque',
        agente: 'Brimstone',
        habilidad: 'Incendiario',
        titulo: 'Incendiario para B default',
        descripcion: 'Lineup de prueba para B.',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        inicio_x: 28.40,
        inicio_y: 76.20,
        destino_x: 35.10,
        destino_y: 22.80
    },
    {
        id: 2,
        mapa: 'Ascent',
        lado: 'Ataque',
        agente: 'Brimstone',
        habilidad: 'Cortina de humo',
        titulo: 'Humo en A main',
        descripcion: 'Ciega A main para entrar.',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        inicio_x: 22.00,
        inicio_y: 72.00,
        destino_x: 48.00,
        destino_y: 28.00
    }
];

let defaultVideo = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

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

    activarListaLineups();

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

    // combina lineups de prueba con los de la BD
    let todos = lineupsDemo.concat(lineupData || []);
    let filtrados = [];
    for (let i = 0; i < todos.length; i++) {
        let lp = todos[i];
        let nombreAgente = lp.agente || lp.agente_nombre || '';
        if (lp.mapa === estado.selectedMap.displayName
            && lp.lado === estado.selectedSide
            && nombreAgente === estado.selectedAgent.displayName) {
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
        punto.style.pointerEvents = 'auto';

        let iconoHab = buscarIconoHabilidad(lp.habilidad);

        punto.innerHTML = '<img src="' + iconoHab + '" alt="' + lp.habilidad + '">';

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
                abrirModal(lp.titulo, lp.video_url);
            }
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

// CAMBIO: markAbilityActive -> marcarHabilidadActiva, forEach -> for
function marcarHabilidadActiva(nombre) {
    let cards = document.querySelectorAll('.ability-card');
    for (let i = 0; i < cards.length; i++) {
        cards[i].classList.toggle('active', cards[i].dataset.ability === nombre);
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

// activa los botones ver de la lista de lineups
function activarListaLineups() {
    let items = document.querySelectorAll('.lineup-lista-item');
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let btnVer = item.querySelector('.btn-ver-lineup');
        if (!btnVer) continue;
        btnVer.addEventListener('click', function() {
            let lp = {
                inicio_x: parseFloat(item.dataset.inicioX),
                inicio_y: parseFloat(item.dataset.inicioY),
                destino_x: parseFloat(item.dataset.destinoX),
                destino_y: parseFloat(item.dataset.destinoY),
                habilidad: item.dataset.habilidad,
                titulo: item.dataset.titulo,
                video_url: item.dataset.video
            };
            limpiarLineaPrevia();
            mostrarLineaPrevia(lp, estado.selectedAgent);
            // marcar item activo
            let todos = document.querySelectorAll('.lineup-lista-item');
            for (let j = 0; j < todos.length; j++) todos[j].classList.remove('activo');
            item.classList.add('activo');
        });
    }
}

// envia el lineup al servidor para guardarlo en la bd
function guardarLineupBD() {
    if (!puntoInicio || !puntoDestino) {
        mostrarAvisoEditor('Marca los dos puntos en el mapa primero');
        return;
    }
    if (!estado.selectedAgent || !estado.selectedMap || !habilidadEditorActual) {
        mostrarAvisoEditor('Selecciona mapa, agente y habilidad');
        return;
    }
    let videoUrl = document.getElementById('editorVideoUrl');
    let videoVal = videoUrl ? videoUrl.value.trim() : '';
    if (!videoVal) {
        mostrarAvisoEditor('Añade la URL de YouTube');
        return;
    }
    ocultarAvisoEditor();
    let tituloVal = estado.selectedAgent.displayName + ' - ' + habilidadEditorActual.displayName + ' en ' + estado.selectedMap.displayName;

    // construir el form y enviarlo por POST
    let form = document.createElement('form');
    form.method = 'post';
    form.action = 'index.php?controlador=lineup&action=guardar';

    let campos = {
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
        let input = document.createElement('input');
        input.type = 'hidden';
        input.name = clave;
        input.value = campos[clave];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}

function mostrarAvisoEditor(texto) {
    let aviso = document.getElementById('editorAviso');
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.add('visible');
}

function ocultarAvisoEditor() {
    let aviso = document.getElementById('editorAviso');
    if (!aviso) return;
    aviso.textContent = '';
    aviso.classList.remove('visible');
}
