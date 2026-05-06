<?php
require_once("model/helpers.php");

function home(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    require_once("model/chat_model.php");
    $chat = new Chat_model();
    $me = (int)$_SESSION["usuario"]["id"];

    $amigos = $chat->get_resumen_amigos($me);

    // Amigo activo (sidebar → panel derecho)
    $amigo_id = (int)($_GET['id'] ?? 0);
    $amigo_actual = null;
    $mensajes = [];
    if($amigo_id > 0){
        foreach($amigos as $a){
            if((int)$a['usuario_id'] === $amigo_id){ $amigo_actual = $a; break; }
        }
        if($amigo_actual){
            // Marca como leídos los que me envió
            $chat->marcar_leidos($me, $amigo_id);
            $mensajes = $chat->get_conversacion($me, $amigo_id, 200);
            // refrescar unread counts tras marcar
            $amigos = $chat->get_resumen_amigos($me);
        }
    }

    page_meta([
        'title'       => 'Mensajes · ValoSense',
        'description' => 'Chat privado con tus amigos de ValoSense.',
        'robots'      => 'noindex,nofollow',
    ]);

    require_once("view/chat_view.php");
}

function enviar(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    if($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_check()){
        header('Location: index.php?controlador=chat&action=home');
        exit();
    }

    $target_id = (int)($_POST['target_id'] ?? 0);
    $contenido = trim((string)($_POST['contenido'] ?? ''));
    $tipo      = $_POST['tipo'] ?? 'auto';
    $me        = (int)$_SESSION["usuario"]["id"];

    // Whitelist de tipos: cualquier cosa rara del cliente vuelve a 'auto'
    $tipos_ok = ['auto','text','valorant_code','discord_link','discord_id','riot_id'];
    if(!in_array($tipo, $tipos_ok, true)) $tipo = 'auto';

    // Detección automática si el usuario no fija tipo
    if($tipo === 'auto'){
        $tipo = detectar_tipo_mensaje($contenido);
    }

    if($target_id > 0 && $contenido !== ''){
        require_once("model/chat_model.php");
        $chat = new Chat_model();
        $chat->enviar_mensaje($me, $target_id, $contenido, $tipo);
        $_SESSION['nav_counters_dirty'] = true;
    }

    header('Location: index.php?controlador=chat&action=home&id=' . $target_id);
    exit();
}

// Endpoint JSON para polling (fetch cada pocos segundos desde chat.js)
function poll(){
    // Descartamos el buffer de index.php (que ya escribió <head><body>…)
    while(ob_get_level() > 0){ ob_end_clean(); }
    header('Content-Type: application/json; charset=utf-8');
    if(!isset($_SESSION["usuario"])){
        echo json_encode(['error' => 'auth']);
        exit();
    }

    require_once("model/chat_model.php");
    $chat = new Chat_model();
    $me = (int)$_SESSION["usuario"]["id"];

    $friend_id = (int)($_GET['friend_id'] ?? 0);
    $last_id   = (int)($_GET['last_id']   ?? 0);

    $nuevos = [];
    if($friend_id > 0){
        $nuevos = $chat->get_mensajes_desde($me, $friend_id, $last_id);
        if(!empty($nuevos)){
            $chat->marcar_leidos($me, $friend_id);
        }
    }

    // Resumen ligero de amigos (unread, ultimo, online) para refrescar sidebar
    $resumen = array_map(function($r){
        return [
            'usuario_id' => (int)$r['usuario_id'],
            'username'   => $r['username'],
            'online'     => (bool)$r['online'],
            'unread'     => (int)$r['unread'],
            'ultimo'     => $r['ultimo_contenido'],
            'ultimo_tipo'=> $r['ultimo_tipo'],
        ];
    }, $chat->get_resumen_amigos($me));

    echo json_encode([
        'messages'    => $nuevos,
        'total_unread'=> $chat->count_no_leidos_total($me),
        'friends'     => $resumen,
        'server_time' => date('c'),
    ]);
    exit();
}
?>
