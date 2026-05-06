<?php
// =====================================================
// explorar_controller.php
// Página pública que resume las 4 herramientas de ValoSense
// Las herramientas en sí solo funcionan tras iniciar sesión
// =====================================================

function home(){
    $logeado = isset($_SESSION["usuario"]);

    // URL del login para los CTA bloqueados
    $href_login = 'index.php?controlador=usuario&action=home';

    // Datos completos de cada herramienta. Cada bloque tiene:
    //  - eyebrow, título, subtítulo
    //  - bullets: lista de capacidades
    //  - pasos: flujo resumido en 3 o 4 puntos
    //  - requiere_login: si bloqueamos la acción sin sesión
    $herramientas = [
        [
            'key'     => 'matchmaker',
            'numero'  => '01',
            'eyebrow' => '// MATCHMAKER',
            'titulo'  => 'Encuentra tu equipo ideal',
            'subtitulo' => 'Matchmaking inteligente por rango, región, agentes favoritos y estilo de juego.',
            'bullets' => [
                'Filtra por rango mínimo, máximo y región',
                'Selecciona agentes favoritos y rol preferido',
                'Lee estadísticas reales: K/D, winrate, HS %',
                'Recibe recomendaciones tácticas del bot ValoSense',
            ],
            'pasos' => [
                'Aplica los filtros que definen tu búsqueda',
                'Revisa las tarjetas de jugadores compatibles',
                'Envía una invitación directa al jugador que elijas',
                'Coordina partida por Discord o chat interno',
            ],
            'requiere_login' => true,
        ],
        [
            'key'     => 'lineup',
            'numero'  => '02',
            'eyebrow' => '// LINEUPS',
            'titulo'  => 'Biblioteca de lineups',
            'subtitulo' => 'Smokes, flashes y molotovs revisados por la comunidad y moderados por administradores.',
            'bullets' => [
                'Filtra la biblioteca por agente y por mapa',
                'Videos de YouTube integrados en cada tarjeta',
                'Publica tus propios lineups tras iniciar sesión',
                'Todos los lineups pasan revisión antes de publicarse',
            ],
            'pasos' => [
                'Elige el agente y el mapa que te interese',
                'Mira el video y lee la descripción táctica',
                'Si tienes uno nuevo, envíalo para revisión',
                'Un admin lo aprueba y queda público',
            ],
            // Ver lineups es público — enviar sí requiere login
            'requiere_login' => false,
            'nota_acceso' => 'Ver la biblioteca es libre. Para enviar tus propios lineups necesitas cuenta.',
        ],
        [
            'key'     => 'training',
            'numero'  => '03',
            'eyebrow' => '// ENTRENAMIENTO',
            'titulo'  => 'Rutinas según tu rango',
            'subtitulo' => 'Entrenamientos de aim, movilidad, disparo, utilidad y game sense adaptados a tu nivel.',
            'bullets' => [
                'Catálogo dividido por rango (Iron → Radiant)',
                'Cinco categorías: aim, movilidad, disparo, utilidad, game sense',
                'Cada rutina incluye descripción y video de referencia',
                'Filtro por categorías para centrarte en lo que necesitas',
            ],
            'pasos' => [
                'Selecciona tu rango actual',
                'Marca qué aspectos quieres mejorar',
                'Recibe rutinas agrupadas por categoría',
                'Sigue los videos integrados y repite los ejercicios',
            ],
            'requiere_login' => true,
        ],
        [
            'key'     => 'team',
            'numero'  => '04',
            'eyebrow' => '// COMPOSICIÓN',
            'titulo'  => 'Recomendador de composición',
            'subtitulo' => 'Elige el mapa, marca los agentes que ya tenéis y te decimos cómo completar el equipo.',
            'bullets' => [
                'Recomendaciones por mapa basadas en tier list S / A / B',
                'Sugerencias automáticas para los roles que falten',
                'Opciones flex cuando tu equipo ya cubre todos los roles',
                'Auto-actualiza las recomendaciones al cambiar la selección',
            ],
            'pasos' => [
                'Selecciona el mapa donde vais a jugar',
                'Marca hasta 4 agentes que ya tenéis',
                'Las recomendaciones aparecen al instante debajo',
                'Ajusta la selección y vuelve a ver qué encaja mejor',
            ],
            'requiere_login' => true,
        ],
    ];

    page_meta([
        'title'       => 'Explorar · Matchmaker, lineups, training y composición · ValoSense',
        'description' => 'Conoce las 4 herramientas de ValoSense: matchmaking por rango, biblioteca de lineups, rutinas de entrenamiento y recomendador de composición.',
    ]);

    require_once("view/explorar_view.php");
}
?>
