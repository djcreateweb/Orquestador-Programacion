<?php
function home(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }

    require_once("model/matchmaker_model.php");

    $model   = new Matchmaker_model();
    $agentes = $model->get_agentes();

    // Rangos/roles permitidos (coinciden con ENUM en BD)
    $rangos_validos = ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'];
    $roles_validos  = ['Duelist','Initiator','Sentinel','Controller'];

    $message    = "";
    $jugadores  = array();
    $rango_sel  = "";
    $agente_sel = "";
    $rol_sel    = "";

    if(isset($_POST["buscar"])){
        $rango_sel  = trim($_POST["rango"] ?? "");
        $agente_sel = $_POST["agente_id"] ?? "";
        $rol_sel    = $_POST["rol"] ?? "";

        if(!in_array($rango_sel, $rangos_validos, true)){
            $message = "Selecciona un rango válido para buscar jugadores.";
        } else {
            $agente_id = ($agente_sel !== "" ? (int)$agente_sel : null);
            $rol_param = (in_array($rol_sel, $roles_validos, true) ? $rol_sel : null);

            $jugadores = $model->get_jugadores(
                $rango_sel,
                $agente_id,
                (int)$_SESSION["usuario"]["id"],
                $rol_param
            );

            // Enriquecer cada jugador con el estado de amistad respecto a mí.
            // Lote en 1 query (evita N+1 de llamar a get_relacion por jugador).
            if(!empty($jugadores)){
                require_once("model/amistad_model.php");
                $amistad = new Amistad_model();
                $me_id   = (int)$_SESSION["usuario"]["id"];
                $ids     = array_map(fn($j) => (int)$j['id'], $jugadores);
                $rels    = $amistad->get_relaciones_lote($me_id, $ids);
                foreach($jugadores as &$j){
                    $rel = $rels[(int)$j['id']] ?? ['estado' => 'ninguno', 'id' => 0];
                    $j['rel_estado'] = $rel['estado'];
                    $j['rel_id']     = $rel['id'];
                }
                unset($j);
            }

            if(empty($jugadores)){
                $message = "No hay jugadores con esos filtros todavía. Prueba a cambiar rango, agente o rol.";
            }
        }
    }

    // $respuesta_bot queda vacío hasta que integremos el módulo de IA
    $respuesta_bot = "";

    page_meta([
        'title'       => 'Matchmaker · Encuentra equipo de tu nivel · ValoSense',
        'description' => 'Busca compañeros de Valorant por rango, agente y rol. Matchmaking para partida sin tóxicos.',
        'robots'      => 'noindex,follow', // resultados de búsqueda dinámicos
    ]);

    require_once("view/matchmaker_view.php");
}

function gestionar(){
    if(!isset($_SESSION["usuario"])){
        header('Location: index.php?controlador=usuario&action=login');
        exit();
    }
    $pronto_mensaje = "La gestión de matches del matchmaker todavía no está implementada.";
    require_once("view/pronto_view.php");
}
?>
