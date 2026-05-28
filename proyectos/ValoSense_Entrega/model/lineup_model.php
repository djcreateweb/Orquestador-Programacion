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
}
?>
