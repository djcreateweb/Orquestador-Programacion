<?php
// =====================================================
// home_controller.php
// Controlador de la página de inicio (landing pública)
// =====================================================

function home(){
    // ¿Está el usuario logueado? Los CTA y enlaces cambian según esto.
    $logeado = isset($_SESSION["usuario"]);

    // URL y texto que se usan para los invitados (llevan al login)
    $href_login = 'index.php?controlador=usuario&action=home';
    $cta_invitado = 'Iniciar sesión para usar';

    // Datos de las tarjetas de features
    $features = [
        [
            'key'     => 'matchmaker',
            'eyebrow' => '// MATCHMAKER',
            'titulo'  => 'Encuentra tu equipo ideal',
            'desc'    => 'Filtra por rango, agente y rol. Consigue compañeros de tu nivel sin tóxicos ni AFKs.',
            'bullets' => [
                'Filtros por rango, región y agentes favoritos',
                'Estadísticas reales de cada jugador',
                'Recomendaciones tácticas del bot',
            ],
            'href'    => $logeado ? 'index.php?controlador=matchmaker&action=home' : $href_login,
            'cta'     => $logeado ? 'Buscar equipo' : $cta_invitado,
            'requiere_login' => !$logeado,
        ],
        [
            'key'     => 'lineup',
            'eyebrow' => '// LINEUPS',
            'titulo'  => 'Biblioteca de lineups',
            'desc'    => 'Smokes, flashes y molotovs revisados por la comunidad. Filtra por agente y mapa.',
            'bullets' => [
                'Lineups moderados antes de publicarse',
                'Filtrado por agente y mapa',
                'Videos integrados desde YouTube',
            ],
            // La biblioteca de lineups se puede ver sin cuenta; enviar sí requiere login
            'href'    => 'index.php?controlador=lineup&action=home',
            'cta'     => 'Ver lineups',
            'requiere_login' => false,
        ],
        [
            'key'     => 'training',
            'eyebrow' => '// ENTRENAMIENTO',
            'titulo'  => 'Rutinas según tu rango',
            'desc'    => 'Entrenamientos de aim, utilidad y táctica adaptados a tu nivel actual.',
            'bullets' => [
                'Rutinas por categoría (aim, utilidad, economía…)',
                'Ejercicios adaptados a cada rango',
                'Videos de referencia integrados',
            ],
            'href'    => $logeado ? 'index.php?controlador=training&action=home' : $href_login,
            'cta'     => $logeado ? 'Empezar rutina' : $cta_invitado,
            'requiere_login' => !$logeado,
        ],
        [
            'key'     => 'team',
            'eyebrow' => '// COMPOSICIÓN',
            'titulo'  => 'Recomendador de comp',
            'desc'    => 'Elige mapa y dinos con qué agentes vais. Te sugerimos cómo completar el equipo.',
            'bullets' => [
                'Mapa + agentes ya elegidos',
                'Recomendaciones por rol faltante',
                'Sugerencias flex para el meta del mapa',
            ],
            'href'    => $logeado ? 'index.php?controlador=team&action=home' : $href_login,
            'cta'     => $logeado ? 'Probar recomendador' : $cta_invitado,
            'requiere_login' => !$logeado,
        ],
    ];

    // Cifras que muestra la tira de stats del hero
    $stats = [
        ['valor' => '12.4K', 'label' => 'Jugadores activos'],
        ['valor' => '847',   'label' => 'Online ahora'],
        ['valor' => '96%',   'label' => 'Match positivo'],
        ['valor' => '6',     'label' => 'Regiones'],
    ];

    page_meta([
        'title'       => 'ValoSense · Matchmaking y entrenamiento para Valorant',
        'description' => 'Encuentra equipo por rango, practica lineups verificados y entrena según tu nivel. Herramientas para subir de rango en Valorant.',
        // Canonical estable: evita que ?utm_source=… genere duplicados en Google.
        'canonical'   => 'index.php',
    ]);

    require_once("view/home_view.php");
}
?>
