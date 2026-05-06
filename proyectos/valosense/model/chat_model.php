<?php
// =====================================================
// Chat_model
// Mensajes entre amigos: envío, conversación y no leídos.
// Usa prepared statements en todas las queries.
// =====================================================
class Chat_model {
    private $db;

    // Un amigo se considera online si tuvo actividad en los últimos N segundos
    const ONLINE_WINDOW_SECS = 300;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
    }

    // ---- Comprobar que dos usuarios son amigos (estado aceptada) ----
    public function son_amigos($me, $otro){
        $me = (int)$me; $otro = (int)$otro;
        if($me <= 0 || $otro <= 0 || $me === $otro) return false;
        try {
            $stmt = $this->db->prepare(
                "SELECT 1 FROM amistad
                  WHERE estado = 'aceptada'
                    AND ((emisor_id=? AND receptor_id=?) OR (emisor_id=? AND receptor_id=?))
                  LIMIT 1"
            );
            $stmt->bind_param("iiii", $me, $otro, $otro, $me);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_row();
            $stmt->close();
            return (bool)$row;
        } catch (mysqli_sql_exception $e) { return false; }
    }

    // ---- Enviar un mensaje ----
    public function enviar_mensaje($emisor_id, $receptor_id, $contenido, $tipo){
        $emisor_id   = (int)$emisor_id;
        $receptor_id = (int)$receptor_id;
        if($emisor_id <= 0 || $receptor_id <= 0 || $emisor_id === $receptor_id) return false;

        $tipos_validos = ['text','valorant_code','discord_link','discord_id','riot_id'];
        if(!in_array($tipo, $tipos_validos, true)) $tipo = 'text';

        $contenido = trim((string)$contenido);
        if($contenido === '' || mb_strlen($contenido) > 2000) return false;

        if(!$this->son_amigos($emisor_id, $receptor_id)) return false;

        try {
            $stmt = $this->db->prepare(
                "INSERT INTO mensaje (emisor_id, receptor_id, contenido, tipo, leido)
                 VALUES (?, ?, ?, ?, 0)"
            );
            $stmt->bind_param("iiss", $emisor_id, $receptor_id, $contenido, $tipo);
            $ok = $stmt->execute();
            $id = $stmt->insert_id;
            $stmt->close();
            return $ok ? (int)$id : false;
        } catch (mysqli_sql_exception $e) { return false; }
    }

    // ---- Conversación completa entre dos usuarios (más reciente abajo) ----
    public function get_conversacion($me, $otro, $limit = 200){
        $me = (int)$me; $otro = (int)$otro; $limit = max(1, (int)$limit);
        if(!$this->son_amigos($me, $otro)) return [];
        try {
            $stmt = $this->db->prepare(
                "SELECT id, emisor_id, receptor_id, contenido, tipo, leido, creado_en
                   FROM mensaje
                  WHERE (emisor_id=? AND receptor_id=?) OR (emisor_id=? AND receptor_id=?)
                  ORDER BY id ASC
                  LIMIT ?"
            );
            $stmt->bind_param("iiiii", $me, $otro, $otro, $me, $limit);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $rows ?: [];
        } catch (mysqli_sql_exception $e) { return []; }
    }

    // ---- Mensajes nuevos desde un id dado (para el polling) ----
    public function get_mensajes_desde($me, $otro, $last_id){
        $me = (int)$me; $otro = (int)$otro; $last_id = max(0, (int)$last_id);
        if(!$this->son_amigos($me, $otro)) return [];
        try {
            $stmt = $this->db->prepare(
                "SELECT id, emisor_id, receptor_id, contenido, tipo, leido, creado_en
                   FROM mensaje
                  WHERE id > ?
                    AND ((emisor_id=? AND receptor_id=?) OR (emisor_id=? AND receptor_id=?))
                  ORDER BY id ASC"
            );
            $stmt->bind_param("iiiii", $last_id, $me, $otro, $otro, $me);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $rows ?: [];
        } catch (mysqli_sql_exception $e) { return []; }
    }

    // ---- Marcar como leídos los mensajes que me envió $otro ----
    public function marcar_leidos($me, $otro){
        $me = (int)$me; $otro = (int)$otro;
        try {
            $stmt = $this->db->prepare(
                "UPDATE mensaje SET leido = 1
                  WHERE receptor_id = ? AND emisor_id = ? AND leido = 0"
            );
            $stmt->bind_param("ii", $me, $otro);
            $ok = $stmt->execute();
            $n = $stmt->affected_rows;
            $stmt->close();
            return $ok ? $n : 0;
        } catch (mysqli_sql_exception $e) { return 0; }
    }

    // ---- Resumen de amigos con último mensaje, no leídos y online ----
    // Antes: 5 subqueries correlacionadas por amigo (contenido/tipo/emisor/creado + unread).
    // Ahora: 1 JOIN a subconsulta derivada que da MAX(id) por par + 1 agregado para unread.
    public function get_resumen_amigos($me){
        $me = (int)$me;
        try {
            $stmt = $this->db->prepare(
                "SELECT u.id AS usuario_id, u.username, u.rango, u.region, u.ultima_actividad,
                        ult.contenido AS ultimo_contenido,
                        ult.tipo      AS ultimo_tipo,
                        ult.emisor_id AS ultimo_emisor,
                        ult.creado_en AS ultimo_creado,
                        COALESCE(un.unread, 0) AS unread
                   FROM amistad a
                   JOIN usuario u
                     ON u.id = IF(a.emisor_id = ?, a.receptor_id, a.emisor_id)
                   LEFT JOIN (
                        SELECT MAX(id) AS max_id,
                               IF(emisor_id = ?, receptor_id, emisor_id) AS otro_id
                          FROM mensaje
                         WHERE emisor_id = ? OR receptor_id = ?
                         GROUP BY otro_id
                   ) lx ON lx.otro_id = u.id
                   LEFT JOIN mensaje ult ON ult.id = lx.max_id
                   LEFT JOIN (
                        SELECT emisor_id, COUNT(*) AS unread
                          FROM mensaje
                         WHERE receptor_id = ? AND leido = 0
                         GROUP BY emisor_id
                   ) un ON un.emisor_id = u.id
                  WHERE (a.emisor_id = ? OR a.receptor_id = ?) AND a.estado = 'aceptada'
                  ORDER BY (ult.creado_en IS NULL) ASC, ult.creado_en DESC, u.username ASC"
            );
            $stmt->bind_param("iiiiiii", $me, $me, $me, $me, $me, $me, $me);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            foreach($rows as &$r){
                $r['online'] = false;
                if(!empty($r['ultima_actividad'])){
                    $diff = time() - strtotime($r['ultima_actividad']);
                    $r['online'] = ($diff >= 0 && $diff < self::ONLINE_WINDOW_SECS);
                }
            }
            unset($r);
            return $rows ?: [];
        } catch (mysqli_sql_exception $e) {
            error_log('Chat_model::get_resumen_amigos — ' . $e->getMessage());
            return [];
        }
    }

    // ---- Total de mensajes no leídos (para el badge del navbar) ----
    public function count_no_leidos_total($me){
        $me = (int)$me;
        try {
            $stmt = $this->db->prepare(
                "SELECT COUNT(*) AS n FROM mensaje WHERE receptor_id = ? AND leido = 0"
            );
            $stmt->bind_param("i", $me);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $row ? (int)$row['n'] : 0;
        } catch (mysqli_sql_exception $e) { return 0; }
    }
}
?>
