<?php
require_once("model/helpers.php");

function ver(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    $id = (int)($_GET['id'] ?? 0);
    if($id <= 0){
        header('Location: index.php?controlador=matchmaker&action=home');
        exit();
    }

    require_once("model/usuario_model.php");
    require_once("model/matchmaker_model.php");
    require_once("model/amistad_model.php");

    $usuario_model   = new Usuario_model();
    $matchmaker_model = new Matchmaker_model();
    $amistad_model   = new Amistad_model();

    $perfil = $usuario_model->get_por_id($id);
    if(empty($perfil)){
        $pronto_mensaje = "El jugador que buscas ya no existe.";
        require_once("view/pronto_view.php");
        return;
    }

    $me = (int)$_SESSION["usuario"]["id"];
    $es_propio = ($me === (int)$perfil['id']);

    // Estado de amistad entre yo y este perfil
    $estado = $es_propio ? 'yo_mismo' : $amistad_model->estado_entre($me, (int)$perfil['id']);

    // Si hay relación activa (pendiente o aceptada), buscamos el id para mostrar acciones
    $rel_id = 0;
    if($estado !== 'yo_mismo' && $estado !== 'ninguno'){
        // La consulta la hace el propio model pero no expone el id; relanzamos una query simple aquí
        require_once("model/conectar.php");
        $db = Conectar::conexion();
        $stmt = $db->prepare(
            "SELECT id FROM amistad
              WHERE ((emisor_id=? AND receptor_id=?) OR (emisor_id=? AND receptor_id=?))
                AND estado IN ('pendiente','aceptada')
              ORDER BY estado='aceptada' DESC LIMIT 1"
        );
        $stmt->bind_param("iiii", $me, $id, $id, $me);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if($row) $rel_id = (int)$row['id'];
    }

    // Agentes favoritos del perfil
    $favoritos = $matchmaker_model->get_agentes_by_usuario((int)$perfil['id']);

    // Stats reales de Valorant (con caché) + fallback a fake si no hay cuenta vinculada
    require_once("model/RiotStatsService.php");
    $stats_real = RiotStatsService::getForUser($perfil);
    if ($stats_real['source'] === 'none') {
        // Sin cuenta vinculada — usamos los fake como fallback visual
        $stats = fake_player_stats($perfil['username'], $perfil['region']);
        $stats['source'] = 'demo';
    } else {
        // Garantizamos todas las claves que la vista espera y conservamos estilo/disp/lang de los helpers
        $extra = fake_player_stats($perfil['username'], $perfil['region']);
        $stats = array_merge(
            ['kd'=>0,'wr'=>0,'hs'=>0,'games'=>0,'hours'=>0,'nivel'=>0,'rank'=>'','rr'=>0],
            [
                'estilo' => $extra['estilo'],
                'disp'   => $extra['disp'],
                'lang'   => $extra['lang'],
            ],
            $stats_real
        );
    }

    // ── Visibilidad del Riot ID ───────────────────────────────────────────────
    $viewer_id  = (int)$_SESSION['usuario']['id'];
    $target_id  = (int)$perfil['id'];

    $puede_ver_riot = false;
    $motivo_riot    = 'no_logueado'; // valor por defecto (nunca ocurre aquí pues exigimos sesión arriba)

    if ($viewer_id > 0) {
        $puede_ver_riot = $usuario_model->puede_ver_riot($viewer_id, $target_id);
        if (!$puede_ver_riot && $viewer_id !== $target_id) {
            // Determinar motivo concreto para la vista
            if (empty($perfil['riot_id'])) {
                $motivo_riot = 'sin_vincular';
            } elseif (!$usuario_model->son_amigos($viewer_id, $target_id)) {
                $motivo_riot = 'no_amigo';
            } elseif ((int)($perfil['riot_id_visible'] ?? 0) !== 1) {
                $motivo_riot = 'oculto';
            }
        }
    }

    // Si el viewer no puede ver el Riot ID, limpiamos los campos antes de exponer el array a la vista
    if (!$puede_ver_riot && $viewer_id !== $target_id) {
        $perfil['riot_id']     = null;
        $perfil['riot_tag']    = null;
        $perfil['riot_region'] = null;
    }
    // ─────────────────────────────────────────────────────────────────────────

    page_meta([
        'title'       => 'Perfil de ' . ($perfil['username'] ?? 'jugador') . ' · ValoSense',
        'description' => 'Perfil público de ' . ($perfil['username'] ?? 'jugador') . ' en ValoSense: rango, región y agentes favoritos.',
        'robots'      => 'noindex,follow', // PII sensible, no indexar
    ]);

    require_once("view/perfil_view.php");
}
?>
