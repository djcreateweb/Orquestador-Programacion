<?php
class Chat_model {
    private $db;
    private $datos;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = array();
    }

    // envía un mensaje entre dos usuarios
    public function enviar_mensaje($emisor_id, $receptor_id, $contenido){
        $contenido = trim((string)$contenido);
        if ($contenido === '') return false;
        $tipo = $this->detectar_tipo_mensaje($contenido);

        try {
            $stmt = $this->db->prepare(
                "INSERT INTO mensaje (emisor_id, receptor_id, contenido, tipo, leido)
                 VALUES (?, ?, ?, ?, 0)"
            );
            $stmt->bind_param("iiss", $emisor_id, $receptor_id, $contenido, $tipo);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    private function detectar_tipo_mensaje($contenido){
        $c = trim((string)$contenido);
        if ($c === '') return 'text';

        if (preg_match('#^(https?://)?(www\.)?(discord\.gg|discord(app)?\.com)/[A-Za-z0-9_\-/?=&.]+$#i', $c)) {
            return 'discord_link';
        }
        if (preg_match('/^\d{17,19}$/', $c)) return 'discord_id';
        if (preg_match('/^[A-Za-z0-9 _.\-]{3,16}#[A-Za-z0-9]{2,5}$/u', $c)) return 'riot_id';
        if (preg_match('/^#[A-Za-z0-9]{4,12}$/', $c)) return 'valorant_code';
        if (preg_match('/^code:\s*[A-Za-z0-9]{4,12}$/i', $c)) return 'valorant_code';
        if (preg_match('/^[A-Z0-9]{5,8}$/', $c) && preg_match('/[A-Z]/', $c) && preg_match('/\d/', $c)) {
            return 'valorant_code';
        }

        return 'text';
    }

    // obtiene la conversación completa entre dos usuarios
    public function get_conversacion($me, $otro){
        try {
            $stmt = $this->db->prepare(
                "SELECT id, emisor_id, receptor_id, contenido, tipo, leido, creado_en
                   FROM mensaje
                  WHERE (emisor_id=? AND receptor_id=?) OR (emisor_id=? AND receptor_id=?)
                  ORDER BY id ASC"
            );
            $stmt->bind_param("iiii", $me, $otro, $otro, $me);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // marca como leídos los mensajes recibidos de un usuario
    public function marcar_leidos($me, $otro){
        try {
            $stmt = $this->db->prepare(
                "UPDATE mensaje SET leido = 1
                  WHERE receptor_id = ? AND emisor_id = ? AND leido = 0"
            );
            $stmt->bind_param("ii", $me, $otro);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // obtiene resumen de amigos con últimos mensajes
    public function get_resumen_amigos($me){
        try {
            $stmt = $this->db->prepare(
                "SELECT u.id AS usuario_id, u.username, u.rango, u.region,
                        m.contenido AS ultimo_contenido, m.tipo AS ultimo_tipo,
                        m.emisor_id AS ultimo_emisor, m.creado_en AS ultimo_creado,
                        COALESCE(nr.unread, 0) AS unread
                   FROM amistad a
                   JOIN usuario u
                     ON u.id = IF(a.emisor_id = ?, a.receptor_id, a.emisor_id)
                   LEFT JOIN mensaje m
                     ON m.id = (
                         SELECT MAX(id) FROM mensaje
                          WHERE (emisor_id = u.id AND receptor_id = ?)
                             OR (emisor_id = ? AND receptor_id = u.id)
                     )
                   LEFT JOIN (
                         SELECT emisor_id, COUNT(*) AS unread
                           FROM mensaje
                          WHERE receptor_id = ? AND leido = 0
                          GROUP BY emisor_id
                   ) nr ON nr.emisor_id = u.id
                  WHERE (a.emisor_id = ? OR a.receptor_id = ?) AND a.estado = 'aceptada'
                  ORDER BY ultimo_creado DESC, u.username ASC"
            );
            $stmt->bind_param("iiiiii", $me, $me, $me, $me, $me, $me);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }
}
?>
