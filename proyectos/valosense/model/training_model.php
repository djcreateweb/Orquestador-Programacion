<?php
class Training_model {
    private $db;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
    }

    public function get_opciones($rango, array $categorias = []){
        $sql = "SELECT id, rango, categoria, titulo, contenido, video_url
                FROM entrenamiento_opcion
                WHERE rango = ?";
        $types  = "s";
        $params = [$rango];

        if(!empty($categorias)){
            $placeholders = implode(",", array_fill(0, count($categorias), "?"));
            $sql   .= " AND categoria IN ($placeholders)";
            $types .= str_repeat("s", count($categorias));
            $params = array_merge($params, $categorias);
        }
        $sql .= " ORDER BY categoria, id";

        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows ?: [];
    }

    public function get_rangos(){
        return ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'];
    }

    public function get_categorias(){
        return [
            'aim'        => 'Aim / Puntería',
            'movilidad'  => 'Movilidad',
            'disparo'    => 'Disparo y armas',
            'utilidad'   => 'Uso de utilidad',
            'game_sense' => 'Game sense',
        ];
    }

    // === Videos de entrenamiento por rango ==========================
    // Devuelve un array indexado por categoría con el video de ese rango.
    // Cargamos los 5 videos siempre (uno por categoría) para que el JS
    // pueda mostrar/ocultar tarjetas sin recargar la página al togglear
    // checkboxes; la BD garantiza unicidad con UNIQUE(rango, categoria).
    public function get_videos_por_rango($rango){
        $sql = "SELECT id, rango, categoria, titulo, video_url, descripcion
                FROM entrenamiento_video
                WHERE rango = ?
                ORDER BY FIELD(categoria,
                    'aim','movilidad','disparo','utilidad','game_sense')";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("s", $rango);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        // Re-indexar por categoría para que la vista pueda hacer
        // $videos['aim'] sin recorrer el array.
        $por_cat = [];
        foreach($rows as $r){
            $por_cat[$r['categoria']] = $r;
        }
        return $por_cat;
    }
}
?>
