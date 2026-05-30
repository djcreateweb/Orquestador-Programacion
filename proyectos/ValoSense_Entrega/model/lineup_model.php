<?php
class Lineup_model {
    private $db;
    private $datos;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = [];
    }

    // devuelve agentes para el filtro
    public function get_agentes(){
        try {
            $stmt = $this->db->prepare("SELECT id, nombre, rol FROM agente ORDER BY rol, nombre");
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // obtiene lineups de un agente en un mapa y lado
    public function get_por_agente_mapa($agente_id, $mapa, $lado) {
        try {
            $stmt = $this->db->prepare(
                "SELECT l.id, l.titulo, l.habilidad, l.video_url,
                 l.inicio_x, l.inicio_y, l.destino_x, l.destino_y
                 FROM lineup l
                 WHERE l.agente_id = ? AND l.mapa = ? AND l.lado = ? AND l.aprobado = 1
                 ORDER BY l.id DESC"
            );
            $stmt->bind_param("iss", $agente_id, $mapa, $lado);
            $stmt->execute();
            $this->datos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $this->datos;
        } catch (mysqli_sql_exception $e) {
            return array();
        }
    }

    // devuelve todos los lineups aprobados con coordenadas para el JS
    public function get_todos_aprobados(){
        try {
            $stmt = $this->db->prepare(
                "SELECT l.id, l.agente_id, l.mapa, l.lado, l.habilidad,
                        l.inicio_x, l.inicio_y, l.destino_x, l.destino_y,
                        l.titulo, l.descripcion, l.video_url, l.creado_en,
                        a.nombre as agente_nombre
                   FROM lineup l
                   JOIN agente a ON l.agente_id = a.id
                  WHERE l.aprobado = 1 AND l.inicio_x IS NOT NULL
                  ORDER BY l.creado_en ASC, l.id ASC"
            );
            $stmt->execute();
            $this->datos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            return $this->datos;
        } catch (mysqli_sql_exception $e) {
            return array();
        }
    }

    // lineups que ha enviado un usuario, con su estado (pendiente/aprobado)
    public function get_envios_usuario($usuario_id){
        try {
            $stmt = $this->db->prepare(
                "SELECT l.id, l.agente_id, l.titulo, l.descripcion, l.mapa, l.lado,
                        l.habilidad, l.video_url, l.inicio_x, l.inicio_y,
                        l.destino_x, l.destino_y, l.aprobado, l.creado_en,
                        a.nombre AS agente, a.nombre AS agente_nombre
                   FROM lineup l
                   JOIN agente a ON a.id = l.agente_id
                  WHERE l.usuario_id = ?
                  ORDER BY l.creado_en DESC, l.id DESC"
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

    // guarda un lineup enviado por usuario para revisión del admin
    public function guardar_envio_usuario($usuario_id, $agente_id, $mapa, $lado, $habilidad,
        $inicio_x, $inicio_y, $destino_x, $destino_y, $titulo, $descripcion, $video_url) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO lineup (usuario_id, agente_id, mapa, lado, habilidad,
                 inicio_x, inicio_y, destino_x, destino_y,
                 titulo, descripcion, video_url, aprobado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)"
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

    public function actualizar_video_envio_usuario($id, $usuario_id, $video_url) {
        try {
            $check = $this->db->prepare("SELECT id FROM lineup WHERE id = ? AND usuario_id = ? LIMIT 1");
            $check->bind_param("ii", $id, $usuario_id);
            $check->execute();
            $existe = $check->get_result()->num_rows > 0;
            $check->close();
            if (!$existe) return false;

            $stmt = $this->db->prepare("UPDATE lineup SET video_url = ? WHERE id = ? AND usuario_id = ?");
            $stmt->bind_param("sii", $video_url, $id, $usuario_id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function borrar_envio_usuario($id, $usuario_id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM lineup WHERE id = ? AND usuario_id = ?");
            $stmt->bind_param("ii", $id, $usuario_id);
            $ok = $stmt->execute();
            $afectadas = $stmt->affected_rows;
            $stmt->close();
            return $ok && $afectadas > 0;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }
}
?>
