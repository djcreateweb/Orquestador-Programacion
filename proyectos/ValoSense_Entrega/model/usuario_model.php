<?php
class Usuario_model {
    private $db;
    private $datos;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = [];
    }

    // comprueba credenciales y retorna datos
    public function login($user, $pass){
        try {
            $stmt = $this->db->prepare(
                "SELECT id, username, email, password_hash, rango, region, es_admin,
                        tipo_usuario, perfil_completo,
                        riot_id, riot_tag, riot_region, riot_id_visible,
                        creado_en, estado_presencia
                   FROM usuario WHERE username = ? OR email = ? LIMIT 1"
            );
            $stmt->bind_param("ss", $user, $user);
            $stmt->execute();
            $registro = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if ($registro && password_verify($pass, $registro['password_hash'])) {
                unset($registro['password_hash']);
                return $registro;
            }
            return [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // registra un usuario nuevo
    public function registro($username, $email, $pass, $rango, $region){
        try {
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            $stmt = $this->db->prepare(
                "INSERT INTO usuario (username, email, password_hash, rango, rango_rr, region, tipo_usuario, perfil_completo, creado_en)
                 VALUES (?, ?, ?, 'Sin clasificar', 0, ?, 'real', 'no', NOW())"
            );
            $stmt->bind_param("ssss", $username, $email, $hash, $region);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // obtiene usuarios para el panel admin
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

    public function get_por_id($id){
        try {
            $stmt = $this->db->prepare(
                "SELECT id, username, email, rango, rango_rr, region, es_admin,
                        tipo_usuario, perfil_completo,
                        riot_id, riot_tag, riot_region, riot_id_visible,
                        creado_en, ultima_actividad, estado_presencia
                   FROM usuario WHERE id = ? LIMIT 1"
            );
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $registro = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $registro ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    public function get_por_username($username){
        try {
            $stmt = $this->db->prepare(
                "SELECT id, username, email, rango, region, es_admin, creado_en
                   FROM usuario WHERE username = ? LIMIT 1"
            );
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $registro = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $registro ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    public function borrar($id){
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

    public function update($username, $email, $rango, $region, $perfil_completo, $id){
        try {
            $stmt = $this->db->prepare(
                "UPDATE usuario
                    SET username = ?, email = ?, rango = ?, region = ?, perfil_completo = ?
                  WHERE id = ?"
            );
            $stmt->bind_param("sssssi", $username, $email, $rango, $region, $perfil_completo, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // vincula el riot id al usuario sin validación de api
    // actualiza estado de presencia
    public function actualizar_estado_presencia($id, $estado){
        try {
            $stmt = $this->db->prepare(
                "UPDATE usuario SET estado_presencia = ? WHERE id = ?"
            );
            $stmt->bind_param("si", $estado, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // actualiza visibilidad del riot id
    // cambia contraseña verificando la actual
    public function cambiar_password($id, $actual, $nueva){
        try {
            $stmt = $this->db->prepare(
                "SELECT password_hash FROM usuario WHERE id = ? LIMIT 1"
            );
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $fila = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if (!$fila) return false;
            if (!password_verify($actual, $fila['password_hash'])) return false;
            $nuevo_hash = password_hash($nueva, PASSWORD_DEFAULT);
            $stmt = $this->db->prepare(
                "UPDATE usuario SET password_hash = ? WHERE id = ?"
            );
            $stmt->bind_param("si", $nuevo_hash, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // elimina cuenta tras verificar contraseña
    public function eliminar_cuenta($id, $pass){
        try {
            $stmt = $this->db->prepare(
                "SELECT password_hash FROM usuario WHERE id = ? LIMIT 1"
            );
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $fila = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if (!$fila) return false;
            if (!password_verify($pass, $fila['password_hash'])) return false;
            $stmt = $this->db->prepare("DELETE FROM usuario WHERE id = ?");
            $stmt->bind_param("i", $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // stats desactivadas, la api fue retirada
    public function get_stats($usuario_id) {
        return null;
    }

    // obtiene amigos aceptados
    public function get_amigos($id){
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id AS relacion_id, u.id, u.username, u.rango, u.region, u.estado_presencia
                   FROM amistad a
                   INNER JOIN usuario u
                     ON u.id = IF(a.emisor_id = ?, a.receptor_id, a.emisor_id)
                  WHERE (a.emisor_id = ? OR a.receptor_id = ?) AND a.estado = 'aceptada'
                  ORDER BY u.username ASC"
            );
            $stmt->bind_param("iii", $id, $id, $id);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    // guarda perfil competitivo del usuario
    public function completar_perfil($id, $riot_id, $riot_tag, $riot_region, $rango, $rango_rr) {
        try {
            $stmt = $this->db->prepare(
                "UPDATE usuario SET riot_id=?, riot_tag=?, riot_region=?, rango=?, rango_rr=?, perfil_completo='si' WHERE id=?"
            );
            $stmt->bind_param("ssssii", $riot_id, $riot_tag, $riot_region, $rango, $rango_rr, $id);
            $this->datos = $stmt->execute();
            $stmt->close();
            return $this->datos;
        } catch (mysqli_sql_exception $e) {
            $this->datos = false;
            return $this->datos;
        }
    }

}
?>
