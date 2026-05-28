<?php
class Matchmaker_model {
    private $db;
    private $datos;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = [];
    }

    // busca jugadores por rango y filtros
    public function get_jugadores($rango, $agente_id = "", $excluir_id = "", $rol = ""){
        try {
            if ($agente_id != "" && $rol != "") {
                $stmt = $this->db->prepare(
                    "SELECT DISTINCT u.id, u.username, u.rango, u.region, u.estado_presencia,
                            a.nombre AS agente, a.rol
                       FROM usuario u
                       INNER JOIN agente_favorito af ON af.usuario_id = u.id
                       INNER JOIN agente a ON a.id = af.agente_id
                      WHERE u.rango = ? AND a.id = ? AND a.rol = ? AND u.id != ?
                        AND u.perfil_completo = 'si'
                      ORDER BY u.username ASC"
                );
                $stmt->bind_param("sisi", $rango, $agente_id, $rol, $excluir_id);
            } elseif ($agente_id != "") {
                $stmt = $this->db->prepare(
                    "SELECT DISTINCT u.id, u.username, u.rango, u.region, u.estado_presencia,
                            a.nombre AS agente, a.rol
                       FROM usuario u
                       INNER JOIN agente_favorito af ON af.usuario_id = u.id
                       INNER JOIN agente a ON a.id = af.agente_id
                      WHERE u.rango = ? AND a.id = ? AND u.id != ?
                        AND u.perfil_completo = 'si'
                      ORDER BY u.username ASC"
                );
                $stmt->bind_param("sii", $rango, $agente_id, $excluir_id);
            } elseif ($rol != "") {
                $stmt = $this->db->prepare(
                    "SELECT DISTINCT u.id, u.username, u.rango, u.region, u.estado_presencia,
                            a.nombre AS agente, a.rol
                       FROM usuario u
                       INNER JOIN agente_favorito af ON af.usuario_id = u.id
                       INNER JOIN agente a ON a.id = af.agente_id
                      WHERE u.rango = ? AND a.rol = ? AND u.id != ?
                        AND u.perfil_completo = 'si'
                      ORDER BY u.username ASC"
                );
                $stmt->bind_param("ssi", $rango, $rol, $excluir_id);
            } else {
                $stmt = $this->db->prepare(
                    "SELECT DISTINCT u.id, u.username, u.rango, u.region, u.estado_presencia,
                            a.nombre AS agente, a.rol
                       FROM usuario u
                       INNER JOIN agente_favorito af ON af.usuario_id = u.id
                       INNER JOIN agente a ON a.id = af.agente_id
                      WHERE u.rango = ? AND u.id != ?
                        AND u.perfil_completo = 'si'
                      ORDER BY u.username ASC"
                );
                $stmt->bind_param("si", $rango, $excluir_id);
            }
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // devuelve catálogo de agentes
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

    // obtiene agentes favoritos de un usuario
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
            return [];
        }
    }

}
?>
