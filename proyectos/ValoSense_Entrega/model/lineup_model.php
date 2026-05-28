<?php
class Lineup_model {
    private $db;
    private $datos;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = [];
    }

    // obtiene lineups aprobados con filtros
    public function get_aprobados($agente_id = "", $mapa = ""){
        try {
            if ($agente_id != "" && $mapa != "") {
                $stmt = $this->db->prepare(
                    "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                            a.nombre AS agente, a.rol, u.username AS autor
                       FROM lineup l
                       JOIN agente a ON a.id = l.agente_id
                       LEFT JOIN usuario u ON u.id = l.usuario_id
                      WHERE l.aprobado = 1 AND l.agente_id = ? AND l.mapa = ?
                      ORDER BY l.creado_en DESC"
                );
                $stmt->bind_param("is", $agente_id, $mapa);
            } elseif ($agente_id != "") {
                $stmt = $this->db->prepare(
                    "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                            a.nombre AS agente, a.rol, u.username AS autor
                       FROM lineup l
                       JOIN agente a ON a.id = l.agente_id
                       LEFT JOIN usuario u ON u.id = l.usuario_id
                      WHERE l.aprobado = 1 AND l.agente_id = ?
                      ORDER BY l.creado_en DESC"
                );
                $stmt->bind_param("i", $agente_id);
            } elseif ($mapa != "") {
                $stmt = $this->db->prepare(
                    "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                            a.nombre AS agente, a.rol, u.username AS autor
                       FROM lineup l
                       JOIN agente a ON a.id = l.agente_id
                       LEFT JOIN usuario u ON u.id = l.usuario_id
                      WHERE l.aprobado = 1 AND l.mapa = ?
                      ORDER BY l.creado_en DESC"
                );
                $stmt->bind_param("s", $mapa);
            } else {
                // sin filtros muestra selección reducida
                $stmt = $this->db->prepare(
                    "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                            a.nombre AS agente, a.rol, u.username AS autor
                       FROM lineup l
                       JOIN agente a ON a.id = l.agente_id
                       LEFT JOIN usuario u ON u.id = l.usuario_id
                      WHERE l.aprobado = 1
                      ORDER BY l.creado_en DESC
                      LIMIT 6"
                );
            }
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // obtiene lineups pendientes de revisión
    public function get_pendientes(){
        try {
            $stmt = $this->db->prepare(
                "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                        a.nombre AS agente, u.username AS autor
                   FROM lineup l
                   JOIN agente a ON a.id = l.agente_id
                   LEFT JOIN usuario u ON u.id = l.usuario_id
                  WHERE l.aprobado = 0
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

    // inserta lineup pendiente de aprobación
    public function insertar_pendiente($usuario_id, $agente_id, $mapa, $titulo, $descripcion, $video_url){
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO lineup (usuario_id, agente_id, mapa, titulo, descripcion, video_url, aprobado)
                 VALUES (?, ?, ?, ?, ?, ?, 0)"
            );
            $stmt->bind_param("iissss", $usuario_id, $agente_id, $mapa, $titulo, $descripcion, $video_url);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // aprueba un lineup
    public function aprobar($id){
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

    public function borrar($id){
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

    public function get_mapas(){
        return ['Ascent','Bind','Breeze','Fracture','Haven','Icebox','Lotus','Pearl','Split','Sunset','Abyss','Corrode'];
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

    // elimina un lineup por id
    public function eliminar_lineup($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM lineup WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $this->datos = $stmt->affected_rows > 0;
            $stmt->close();
            return $this->datos;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // guarda un lineup nuevo aprobado directo desde el admin
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
            $stmt->execute();
            $this->datos = $stmt->affected_rows > 0;
            $stmt->close();
            return $this->datos;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // devuelve todos los lineups aprobados con coordenadas para el JS
    public function get_todos_aprobados(){
        try {
            $stmt = $this->db->prepare(
                "SELECT l.id, l.agente_id, l.mapa, l.lado, l.habilidad,
                        l.inicio_x, l.inicio_y, l.destino_x, l.destino_y,
                        l.titulo, l.descripcion, l.video_url,
                        a.nombre as agente_nombre
                   FROM lineup l
                   JOIN agente a ON l.agente_id = a.id
                  WHERE l.aprobado = 1 AND l.inicio_x IS NOT NULL"
            );
            $stmt->execute();
            $this->datos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            return $this->datos;
        } catch (mysqli_sql_exception $e) {
            return array();
        }
    }
}
?>
