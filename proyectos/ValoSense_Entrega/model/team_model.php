<?php
class Team_model {
    private $db;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
    }

    public function get_mapas(){
        $todos = ['Ascent','Bind','Breeze','Fracture','Haven','Icebox','Lotus','Pearl','Split','Sunset','Abyss','Corrode'];
        $visibles = ['Ascent','Abyss','Breeze','Corrode','Haven','Pearl','Split'];
        $mapas = [];
        for ($i = 0; $i < count($todos); $i++) {
            if (in_array($todos[$i], $visibles, true)) {
                $mapas[] = $todos[$i];
            }
        }
        return $mapas;
    }

    public function get_agentes_con_meta($mapa){
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id, a.nombre, a.rol, m.tier, m.nota
                   FROM agente a
                   LEFT JOIN agente_mapa_meta m ON m.agente_id = a.id AND m.mapa = ?
                  ORDER BY a.rol, a.nombre"
            );
            $stmt->bind_param("s", $mapa);
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    public function recomendar($mapa, $seleccionados){
        try {
            $team_size = 5;
            $todos = $this->get_agentes_con_meta($mapa);
            $roles = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];
            $tier_score = ['S' => 3, 'A' => 2, 'B' => 1, '' => 0];

            $ids_sel = array_values(array_unique(array_map('intval', $seleccionados)));

            $agentes_sel = [];
            foreach ($todos as $agente) {
                if (in_array((int)$agente['id'], $ids_sel, true) && count($agentes_sel) < $team_size) {
                    $agentes_sel[] = $agente;
                }
            }

            $conteos = ['Duelist' => 0, 'Initiator' => 0, 'Controller' => 0, 'Sentinel' => 0];
            foreach ($agentes_sel as $agente) {
                if (isset($conteos[$agente['rol']])) {
                    $conteos[$agente['rol']]++;
                }
            }

            $fuerza_rol = ['Duelist' => 0, 'Initiator' => 0, 'Controller' => 0, 'Sentinel' => 0];
            foreach ($todos as $agente) {
                if (!isset($fuerza_rol[$agente['rol']])) continue;
                $tier = isset($agente['tier']) ? $agente['tier'] : '';
                $fuerza_rol[$agente['rol']] += isset($tier_score[$tier]) ? $tier_score[$tier] : 0;
            }

            $por_rol = ['Duelist' => [], 'Initiator' => [], 'Controller' => [], 'Sentinel' => []];
            foreach ($todos as $agente) {
                if (!isset($por_rol[$agente['rol']])) continue;
                if (in_array((int)$agente['id'], $ids_sel, true)) continue;
                $por_rol[$agente['rol']][] = $agente;
            }
            foreach ($por_rol as &$lista) {
                usort($lista, [$this, 'cmp_tier']);
            }
            unset($lista); // rompe la referencia del foreach

            $secciones = [];
            $ocurrencia_por_rol = [];
            $cobertura = $conteos;
            $slot_inicial = count($agentes_sel) + 1;
            $slots_restantes = max(0, $team_size - count($agentes_sel));

            for ($slot = 1; $slot <= $slots_restantes; $slot++) {
                $mejor_rol = null;
                $mejor_score = -INF;

                foreach ($roles as $rol) {
                    if (empty($por_rol[$rol])) continue;
                    // penaliza roles ya cubiertos: fuerza / (1 + 2*cobertura)
                    $score = $fuerza_rol[$rol] / (1 + 2 * $cobertura[$rol]);
                    if ($score > $mejor_score) {
                        $mejor_score = $score;
                        $mejor_rol = $rol;
                    }
                }

                if ($mejor_rol === null) break;

                $ocurrencia_por_rol[$mejor_rol] = isset($ocurrencia_por_rol[$mejor_rol])
                    ? $ocurrencia_por_rol[$mejor_rol] + 1
                    : 1;

                $secciones[] = [
                    'rol' => $mejor_rol,
                    'slot_num' => $slot_inicial + $slot - 1,
                    'occurrence' => $ocurrencia_por_rol[$mejor_rol],
                    'opciones' => array_slice($por_rol[$mejor_rol], 0, 6),
                ];
                $cobertura[$mejor_rol]++;
            }

            $team_rating = null;
            if (count($agentes_sel) >= $team_size) {
                $sum = 0;
                foreach ($agentes_sel as $agente) {
                    $tier = isset($agente['tier']) ? $agente['tier'] : '';
                    $sum += isset($tier_score[$tier]) ? $tier_score[$tier] : 0;
                }
                $avg = count($agentes_sel) > 0 ? $sum / count($agentes_sel) : 0;
                $label = $avg >= 2.5 ? 'S' : ($avg >= 1.75 ? 'A' : ($avg >= 1 ? 'B' : 'C'));
                $team_rating = [
                    'score_avg' => number_format($avg, 2),
                    'score_max' => 3,
                    'label' => $label,
                    'balance_ok' => true,
                    'conteos' => $conteos,
                ];
            }

            return [
                'seleccionados' => $agentes_sel,
                'secciones' => $secciones,
                'team_size' => $team_size,
                'team_rating' => $team_rating,
            ];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    private function cmp_tier($a, $b){
        $peso = ['S' => 0, 'A' => 1, 'B' => 2, '' => 3];
        $tier_a = isset($a['tier']) ? $a['tier'] : '';
        $tier_b = isset($b['tier']) ? $b['tier'] : '';
        $pa = isset($peso[$tier_a]) ? $peso[$tier_a] : 3;
        $pb = isset($peso[$tier_b]) ? $peso[$tier_b] : 3;
        if ($pa !== $pb) return $pa <=> $pb;
        return strcmp($a['nombre'], $b['nombre']);
    }
}
?>
