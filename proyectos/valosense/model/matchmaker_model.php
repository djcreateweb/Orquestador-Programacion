<?php
// =====================================================
// Matchmaker_model
// Tabla real: agente_favorito (usuario_id, agente_id)
// Se une con 'agente' para obtener nombre y rol
// =====================================================
class Matchmaker_model {
    private $db;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
    }

    // Busca jugadores por rango y (opcionalmente) por id de agente favorito y rol
    public function get_jugadores($rango, $agente_id = null, $excluir_usuario_id = null, $rol = null){
        try {
            $sql = "SELECT DISTINCT u.id, u.username, u.email, u.rango, u.region,
                           u.estado_presencia, u.ultima_actividad,
                           a.nombre AS agente, a.rol
                      FROM usuario u
                      INNER JOIN agente_favorito af ON af.usuario_id = u.id
                      INNER JOIN agente a ON a.id = af.agente_id
                     WHERE u.rango = ?";
            $tipos = "s";
            $params = [$rango];

            if(!empty($agente_id)){
                $sql .= " AND a.id = ?";
                $tipos .= "i";
                $params[] = (int)$agente_id;
            }

            if(!empty($rol)){
                $sql .= " AND a.rol = ?";
                $tipos .= "s";
                $params[] = $rol;
            }

            if(!empty($excluir_usuario_id)){
                $sql .= " AND u.id <> ?";
                $tipos .= "i";
                $params[] = (int)$excluir_usuario_id;
            }

            $sql .= " ORDER BY u.username ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->bind_param($tipos, ...$params);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            error_log('Matchmaker_model — ' . $e->getMessage());
            throw new RuntimeException("Error interno del matchmaker.", 0, $e);
        }
    }

    // Devuelve el catálogo de agentes (id, nombre, rol) para los filtros
    public function get_agentes(){
        try {
            $res = $this->db->query("SELECT id, nombre, rol FROM agente ORDER BY rol, nombre");
            return $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // Agentes favoritos del usuario actual
    public function get_agentes_by_usuario($usuario_id){
        try {
            $stmt = $this->db->prepare(
                "SELECT af.id, af.usuario_id, a.nombre AS agente, a.rol
                   FROM agente_favorito af
                   INNER JOIN agente a ON a.id = af.agente_id
                  WHERE af.usuario_id = ?
                  ORDER BY a.nombre ASC"
            );
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            error_log('Matchmaker_model — ' . $e->getMessage());
            throw new RuntimeException("Error interno del matchmaker.", 0, $e);
        }
    }

    public function insertar_agente_favorito($usuario_id, $agente_id){
        try {
            $stmt = $this->db->prepare(
                "INSERT IGNORE INTO agente_favorito (usuario_id, agente_id) VALUES (?, ?)"
            );
            $stmt->bind_param("ii", $usuario_id, $agente_id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function borrar_agente_favorito($id){
        try {
            $stmt = $this->db->prepare("DELETE FROM agente_favorito WHERE id = ?");
            $stmt->bind_param("i", $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }
}
?>
