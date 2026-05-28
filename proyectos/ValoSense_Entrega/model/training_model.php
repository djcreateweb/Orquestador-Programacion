<?php
class Training_model {
    private $db;
    private $datos;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
        $this->datos = [];
    }

    public function get_rangos(){
        return [
            'Iron 1','Iron 2','Iron 3',
            'Bronze 1','Bronze 2','Bronze 3',
            'Silver 1','Silver 2','Silver 3',
            'Gold 1','Gold 2','Gold 3',
            'Platinum 1','Platinum 2','Platinum 3',
            'Diamond 1','Diamond 2','Diamond 3',
            'Ascendant 1','Ascendant 2','Ascendant 3',
            'Immortal 1','Immortal 2','Immortal 3',
            'Radiant',
        ];
    }

    public function get_categorias(){
        return [
            'aim' => 'Aim / Puntería',
            'movilidad' => 'Movilidad',
            'disparo' => 'Disparo y armas',
            'utilidad' => 'Uso de utilidad',
            'game_sense' => 'Game sense',
        ];
    }

    // obtiene videos para el rango
    public function get_videos_por_rango($rango){
        try {
            $stmt = $this->db->prepare(
                "SELECT id, rango, categoria, titulo, video_url, descripcion
                   FROM entrenamiento_video
                  WHERE rango = ?
                  ORDER BY categoria, id"
            );
            $stmt->bind_param("s", $rango);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            $por_categoria = [];
            foreach ($registros as $r) {
                $por_categoria[$r['categoria']] = $r;
            }
            return $por_categoria;
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }
}
?>
