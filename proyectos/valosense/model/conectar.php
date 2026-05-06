<?php
class Conectar {
    public static function conexion(){
        // Activar excepciones reales de mysqli para que los try/catch funcionen.
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        try {
            $host     = 'localhost';
            $user     = 'root';
            $pass     = '';
            $database = 'valosense';
            $port     = 3307;
            $db = new mysqli($host, $user, $pass, $database, $port);
            $db->set_charset('utf8mb4');
            return $db;
        } catch (mysqli_sql_exception $e) {
            error_log('Conectar — ' . $e->getMessage());
            throw new RuntimeException("Error de conexión con la base de datos.", 0, $e);
        }
    }
}
?>
