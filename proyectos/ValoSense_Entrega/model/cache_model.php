<?php
class CacheModel {
    private $db;
    private $datos;

    public function __construct() {
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = array();
    }

    public function obtener($clave) {
        try {
            $stmt = $this->db->prepare(
                "SELECT datos FROM cache_consulta WHERE clave = ? AND expira_en > NOW()"
            );
            $stmt->bind_param("s", $clave);
            $stmt->execute();
            $resultado = $stmt->get_result()->fetch_assoc();
            if ($resultado) {
                $this->datos = json_decode($resultado['datos'], true);
                return $this->datos;
            }
            return null;
        } catch (mysqli_sql_exception $e) {
            return null;
        }
    }

    public function guardar($clave, $datos, $minutos = 60) {
        try {
            $json = json_encode($datos, JSON_UNESCAPED_UNICODE);
            $stmt = $this->db->prepare(
                "INSERT INTO cache_consulta (clave, datos, expira_en)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
                 ON DUPLICATE KEY UPDATE
                 datos = VALUES(datos),
                 creado_en = NOW(),
                 expira_en = VALUES(expira_en)"
            );
            $stmt->bind_param("ssi", $clave, $json, $minutos);
            $stmt->execute();
        } catch (mysqli_sql_exception $e) {
            // si falla la cache no interrumpe
        }
    }

    public function invalidar($clave) {
        try {
            $stmt = $this->db->prepare(
                "DELETE FROM cache_consulta WHERE clave = ?"
            );
            $stmt->bind_param("s", $clave);
            $stmt->execute();
        } catch (mysqli_sql_exception $e) {}
    }

    public function limpiar() {
        try {
            $stmt = $this->db->prepare(
                "DELETE FROM cache_consulta WHERE expira_en < NOW()"
            );
            $stmt->execute();
        } catch (mysqli_sql_exception $e) {}
    }
}
?>
