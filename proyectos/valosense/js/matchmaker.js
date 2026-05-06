// =====================================================
// ValoSense · matchmaker.js
// Scroll al bot response si existe (el resto de la lógica
// ahora vive en formularios PHP: invitar, ver perfil, aceptar).
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const botResponse = document.querySelector('.bot-response');
    if (botResponse) {
        setTimeout(() => botResponse.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }

    // Sincroniza la clase .rank-{valor} del <select> con la opción elegida,
    // para que el color del rango cambie en vivo sin recargar la página.
    const rankSelect = document.querySelector('.rank-select');
    if (rankSelect) {
        const RANK_CLASSES = ['rank-iron','rank-bronze','rank-silver','rank-gold',
            'rank-platinum','rank-diamond','rank-ascendant','rank-immortal','rank-radiant'];
        const applyRankClass = () => {
            RANK_CLASSES.forEach(c => rankSelect.classList.remove(c));
            const v = (rankSelect.value || '').toLowerCase();
            if (v) rankSelect.classList.add('rank-' + v);
        };
        rankSelect.addEventListener('change', applyRankClass);
        applyRankClass();
    }
});
