window.addEventListener('load', iniciarTeam);

function iniciarTeam() {
    activarSelectorMapaTeam();
    activarCheckboxAgentes();
    activarGuardarScrollMapa();
    actualizarEstadoComposicion();
    restaurarScrollTeam();
}

function activarSelectorMapaTeam() {
    let selector = document.getElementById('teamMapSelector');
    let hero = document.getElementById('teamMapHero');
    if (!selector || !hero) return;
    hero.addEventListener('click', function() {
        selector.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
        if (!selector.contains(e.target)) selector.classList.remove('open');
    });
}

// toggle visual de is-selected al marcar agente
function activarCheckboxAgentes() {
    let checkboxes = document.querySelectorAll('.agent-btn input[type="checkbox"]');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('change', toggleSeleccionado);
    }
}

function toggleSeleccionado() {
    let label = this.parentNode;
    if (!label) return;
    let seleccionados = document.querySelectorAll('.agent-btn input[type="checkbox"]:checked');
    if (this.checked && seleccionados.length > 5) {
        this.checked = false;
        if (window.VS && typeof window.VS.toast === 'function') {
            window.VS.toast('La composicion maxima es de 5 agentes.', 'warning');
        } else {
            alert('La composicion maxima es de 5 agentes.');
        }
        return;
    }
    if (this.checked) {
        label.classList.add('is-selected');
    } else {
        label.classList.remove('is-selected');
    }
    actualizarEstadoComposicion();
}

function actualizarEstadoComposicion() {
    let seleccionados = document.querySelectorAll('.agent-btn input[type="checkbox"]:checked');
    let status = document.getElementById('comp-status');
    if (status) {
        status.textContent = seleccionados.length + ' / 5 agentes seleccionados.';
    }

    let roles = {};
    for (let i = 0; i < seleccionados.length; i++) {
        let label = seleccionados[i].parentNode;
        if (label && label.dataset.rol) roles[label.dataset.rol] = true;
    }

    let pills = document.querySelectorAll('.team-role-pill');
    for (let j = 0; j < pills.length; j++) {
        pills[j].classList.toggle('is-covered', !!roles[pills[j].dataset.role]);
    }
}

// guarda scroll antes de enviar el formulario
function activarGuardarScrollMapa() {
    let botonesMapas = document.querySelectorAll('.team-map-card');
    for (let i = 0; i < botonesMapas.length; i++) {
        botonesMapas[i].addEventListener('click', guardarScrollTeam);
    }
    let form = document.getElementById('comp-form');
    if (form) {
        form.addEventListener('submit', guardarScrollTeam);
    }
}

function guardarScrollTeam() {
    sessionStorage.setItem('vsTeamScroll', String(window.scrollY));
}

function restaurarScrollTeam() {
    let posicion = sessionStorage.getItem('vsTeamScroll');
    if (!posicion) return;
    sessionStorage.removeItem('vsTeamScroll');
    let resultado = document.getElementById('recommendation-result');
    if (resultado) {
        resultado.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.scrollTo(0, parseInt(posicion, 10));
    }
}
