<?php
class Amistad_model {
    private $db;
    private $datos;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = [];
    }

    // estado de relación entre dos usuarios
    public function estado_entre($me, $otro){
        if ($me == $otro) return ['estado' => 'yo_mismo', 'amistad_id' => 0];
        try {
            $stmt = $this->db->prepare(
                "SELECT id, emisor_id, estado
                   FROM amistad
                  WHERE ((emisor_id=? AND receptor_id=?) OR (emisor_id=? AND receptor_id=?))
                    AND estado IN ('pendiente','aceptada')
                  LIMIT 1"
            );
            $stmt->bind_param("iiii", $me, $otro, $otro, $me);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if (!$row) return ['estado' => 'ninguno', 'amistad_id' => 0];
            if ($row['estado'] == 'aceptada') return ['estado' => 'amigo', 'amistad_id' => $row['id']];
            $est = ($row['emisor_id'] == $me) ? 'pendiente_enviada' : 'pendiente_recibida';
            return ['estado' => $est, 'amistad_id' => $row['id']];
        } catch (mysqli_sql_exception $e) {
            return ['estado' => 'ninguno', 'amistad_id' => 0];
        }
    }

    // obtiene solicitudes recibidas
    public function get_recibidas($usuario_id){
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id AS amistad_id, a.creado_en,
                        u.id AS usuario_id, u.username, u.rango, u.region
                   FROM amistad a
                   JOIN usuario u ON u.id = a.emisor_id
                  WHERE a.receptor_id = ? AND a.estado = 'pendiente'
                  ORDER BY a.creado_en DESC"
            );
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // obtiene solicitudes enviadas
    public function get_enviadas($usuario_id){
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id AS amistad_id, a.creado_en,
                        u.id AS usuario_id, u.username, u.rango, u.region
                   FROM amistad a
                   JOIN usuario u ON u.id = a.receptor_id
                  WHERE a.emisor_id = ? AND a.estado = 'pendiente'
                  ORDER BY a.creado_en DESC"
            );
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // obtiene lista de amigos
    public function get_amigos($usuario_id){
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id AS amistad_id,
                        u.id AS usuario_id, u.username, u.rango, u.region
                   FROM amistad a
                   JOIN usuario u
                     ON u.id = IF(a.emisor_id = ?, a.receptor_id, a.emisor_id)
                  WHERE (a.emisor_id = ? OR a.receptor_id = ?) AND a.estado = 'aceptada'
                  ORDER BY u.username ASC"
            );
            $stmt->bind_param("iii", $usuario_id, $usuario_id, $usuario_id);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // crea invitación de amistad
    public function crear_invitacion($emisor_id, $receptor_id){
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO amistad (emisor_id, receptor_id, estado)
                 VALUES (?, ?, 'pendiente')"
            );
            $stmt->bind_param("ii", $emisor_id, $receptor_id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // acepta solicitud de amistad
    public function aceptar($id, $receptor_id){
        try {
            $stmt = $this->db->prepare(
                "UPDATE amistad SET estado = 'aceptada', resuelto_en = NOW()
                  WHERE id = ? AND receptor_id = ? AND estado = 'pendiente'"
            );
            $stmt->bind_param("ii", $id, $receptor_id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // rechaza solicitud de amistad
    public function rechazar($id, $receptor_id){
        try {
            $stmt = $this->db->prepare(
                "UPDATE amistad SET estado = 'rechazada', resuelto_en = NOW()
                  WHERE id = ? AND receptor_id = ? AND estado = 'pendiente'"
            );
            $stmt->bind_param("ii", $id, $receptor_id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // elimina amistad o cancela solicitud
    public function eliminar($id, $usuario_id){
        try {
            $stmt = $this->db->prepare(
                "DELETE FROM amistad
                  WHERE id = ? AND (emisor_id = ? OR receptor_id = ?)"
            );
            $stmt->bind_param("iii", $id, $usuario_id, $usuario_id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }
}
?>
