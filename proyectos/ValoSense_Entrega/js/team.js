window.addEventListener('load', iniciarTeam);

function iniciarTeam() {
    activarCheckboxAgentes();
    activarGuardarScrollMapa();
    restaurarScrollTeam();
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
}

// guarda scroll antes de enviar el formulario
function activarGuardarScrollMapa() {
    let botonesMapas = document.querySelectorAll('.map-btn');
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
