<?php
class Lineup_model {
    private $db;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
    }

    public function get_aprobados($agente_id = null, $mapa = null){
        $sql = "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                       a.nombre AS agente, a.rol AS rol,
                       u.username AS autor
                FROM lineup l
                JOIN agente a ON a.id = l.agente_id
                LEFT JOIN usuario u ON u.id = l.usuario_id
                WHERE l.aprobado = 1";
        $params = [];
        $types  = "";
        if(!empty($agente_id)){ $sql .= " AND l.agente_id = ?"; $params[] = (int)$agente_id; $types .= "i"; }
        if(!empty($mapa)){      $sql .= " AND l.mapa = ?";      $params[] = $mapa;           $types .= "s"; }
        $sql .= " ORDER BY l.creado_en DESC";
        // Sin filtros: mostrar solo una selección reducida para no cargar 275 iframes a la vez
        if(empty($agente_id) && empty($mapa)){
            $sql .= " LIMIT 6";
        }

        $stmt = $this->db->prepare($sql);
        if($params){ $stmt->bind_param($types, ...$params); }
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows ?: [];
    }

    public function contar_aprobados(){
        $res = $this->db->query("SELECT COUNT(*) AS n FROM lineup WHERE aprobado = 1");
        if(!$res) return 0;
        $row = $res->fetch_assoc();
        return (int)($row['n'] ?? 0);
    }

    public function get_pendientes(){
        $sql = "SELECT l.id, l.titulo, l.descripcion, l.video_url, l.mapa, l.creado_en,
                       a.nombre AS agente, u.username AS autor
                FROM lineup l
                JOIN agente a ON a.id = l.agente_id
                LEFT JOIN usuario u ON u.id = l.usuario_id
                WHERE l.aprobado = 0
                ORDER BY l.creado_en ASC";
        $res = $this->db->query($sql);
        return $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    }

    public function insertar_pendiente($usuario_id, $agente_id, $mapa, $titulo, $descripcion, $video_url){
        $stmt = $this->db->prepare(
            "INSERT INTO lineup (usuario_id, agente_id, mapa, titulo, descripcion, video_url, aprobado)
             VALUES (?, ?, ?, ?, ?, ?, 0)"
        );
        $stmt->bind_param("iissss", $usuario_id, $agente_id, $mapa, $titulo, $descripcion, $video_url);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function aprobar($id){
        $stmt = $this->db->prepare("UPDATE lineup SET aprobado = 1 WHERE id = ?");
        $stmt->bind_param("i", $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function borrar($id){
        $stmt = $this->db->prepare("DELETE FROM lineup WHERE id = ?");
        $stmt->bind_param("i", $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function get_agentes(){
        $res = $this->db->query("SELECT id, nombre, rol FROM agente ORDER BY rol, nombre");
        return $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    }

    public function get_mapas(){
        return ['Ascent','Bind','Breeze','Fracture','Haven','Icebox','Lotus','Pearl','Split','Sunset','Abyss'];
    }
}
?>
