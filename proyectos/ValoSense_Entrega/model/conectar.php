<?php
class Conectar {
    public static function conexion(){
        try {
            $host     = 'localhost';
            $user     = 'root';
            $pass     = '';
            $database = 'valosensebdd';
            $db = new mysqli($host, $user, $pass, $database, 3307);
            $db->set_charset('utf8mb4');
            return $db;
        } catch (mysqli_sql_exception $e) {
            throw new RuntimeException("Error de conexión con la base de datos.", 0, $e);
        }
    }
}
?>
