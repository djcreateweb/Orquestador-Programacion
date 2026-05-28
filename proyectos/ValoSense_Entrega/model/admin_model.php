<?php
class Admin_model {
    private $db;
    private $datos;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = [];
    }

    public function get_usuarios(){
        try {
            $stmt = $this->db->prepare(
                "SELECT id, username, email, rango, region, es_admin, creado_en
                   FROM usuario ORDER BY creado_en DESC"
            );
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    public function borrar_usuario($id){
        try {
            $stmt = $this->db->prepare("DELETE FROM usuario WHERE id = ?");
            $stmt->bind_param("i", $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function cambiar_rol_usuario($id, $es_admin){
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET es_admin = ? WHERE id = ?");
            $stmt->bind_param("ii", $es_admin, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function get_lineups_pendientes(){
        try {
            $stmt = $this->db->prepare(
                "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                        a.nombre AS agente, u.username AS autor
                   FROM lineup l
                   JOIN agente a ON a.id = l.agente_id
                   JOIN usuario u ON u.id = l.usuario_id
                  WHERE l.aprobado = 0 AND u.es_admin = 0
                  ORDER BY l.creado_en ASC"
            );
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    public function get_lineups_aprobados_usuarios(){
        try {
            $stmt = $this->db->prepare(
                "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                        a.nombre AS agente, a.rol, u.username AS autor
                   FROM lineup l
                   JOIN agente a ON a.id = l.agente_id
                   JOIN usuario u ON u.id = l.usuario_id
                  WHERE l.aprobado = 1 AND u.es_admin = 0
                  ORDER BY l.creado_en DESC"
            );
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    public function aprobar_lineup($id){
        try {
            $stmt = $this->db->prepare("UPDATE lineup SET aprobado = 1 WHERE id = ?");
            $stmt->bind_param("i", $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function borrar_lineup($id){
        try {
            $stmt = $this->db->prepare("DELETE FROM lineup WHERE id = ?");
            $stmt->bind_param("i", $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function guardar_lineup($usuario_id, $agente_id, $mapa, $lado, $habilidad,
        $inicio_x, $inicio_y, $destino_x, $destino_y, $titulo, $descripcion, $video_url) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO lineup (usuario_id, agente_id, mapa, lado, habilidad,
                 inicio_x, inicio_y, destino_x, destino_y,
                 titulo, descripcion, video_url, aprobado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
            );
            $stmt->bind_param(
                "iisssddddsss",
                $usuario_id, $agente_id, $mapa, $lado, $habilidad,
                $inicio_x, $inicio_y, $destino_x, $destino_y,
                $titulo, $descripcion, $video_url
            );
            $ok = $stmt->execute();
            $id = $ok ? $this->db->insert_id : false;
            $stmt->close();
            return $id;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function actualizar_video_lineup($id, $video_url) {
        try {
            $stmt = $this->db->prepare("UPDATE lineup SET video_url = ? WHERE id = ?");
            $stmt->bind_param("si", $video_url, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }
}
?>
