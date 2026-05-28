<?php
class Team_model {
    private $db;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
    }

    public function get_mapas(){
        return ['Ascent','Bind','Breeze','Fracture','Haven','Icebox','Lotus','Pearl','Split','Sunset','Abyss'];
    }

    // Agentes + tier + nota del meta para un mapa
    public function get_agentes_con_meta($mapa){
        $sql = "SELECT a.id, a.nombre, a.rol, m.tier, m.nota
                FROM agente a
                LEFT JOIN agente_mapa_meta m ON m.agente_id = a.id AND m.mapa = ?
                ORDER BY a.rol, a.nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("s", $mapa);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows ?: [];
    }

    // =====================================================
    // Recomendador puro por mapa (sin reglas fijas)
    //
    // Produce EXACTAMENTE (5 − seleccionados) secciones, cada una con:
    //   - un rol elegido por el meta del mapa combinado con lo que
    //     el usuario ya tiene (más débil → prioridad más alta)
    //   - top agentes de ese rol en ese mapa (excluyendo ya seleccionados)
    // =====================================================
    public function recomendar($mapa, array $agentes_seleccionados){
        $TEAM_SIZE   = 5;
        $todos_roles = ['Duelist','Initiator','Controller','Sentinel'];
        $tier_score  = ['S' => 3, 'A' => 2, 'B' => 1, '' => 0];

        $todos = $this->get_agentes_con_meta($mapa);
        $por_id = [];
        foreach($todos as $a){ $por_id[(int)$a['id']] = $a; }

        $ids_sel = array_map('intval', $agentes_seleccionados);

        // Seleccionados + conteo por rol
        $seleccionados = [];
        $conteos = ['Duelist'=>0,'Initiator'=>0,'Controller'=>0,'Sentinel'=>0];
        foreach($ids_sel as $sid){
            if(isset($por_id[$sid])){
                $seleccionados[] = $por_id[$sid];
                $rol = $por_id[$sid]['rol'];
                if(isset($conteos[$rol])) $conteos[$rol]++;
            }
        }
        $total_sel = count($seleccionados);

        // Fuerza de cada rol en ESTE mapa según meta (suma de tiers)
        $fuerza_rol = ['Duelist'=>0,'Initiator'=>0,'Controller'=>0,'Sentinel'=>0];
        foreach($todos as $a){
            if(!isset($fuerza_rol[$a['rol']])) continue;
            $fuerza_rol[$a['rol']] += $tier_score[$a['tier'] ?? ''] ?? 0;
        }

        // Ordena agentes por rol/tier (mejor primero) para los tops
        $por_rol_sorted = ['Duelist'=>[],'Initiator'=>[],'Controller'=>[],'Sentinel'=>[]];
        foreach($todos as $a){
            if(!isset($por_rol_sorted[$a['rol']])) continue;
            if(in_array((int)$a['id'], $ids_sel, true)) continue;
            $por_rol_sorted[$a['rol']][] = $a;
        }
        foreach($por_rol_sorted as &$lista){ usort($lista, [$this, 'cmp_tier']); }
        unset($lista);

        // Asignar (5 − seleccionados) slots. Para cada slot elegimos el rol
        // con mayor "score" = fuerza_en_mapa / (1 + 2·cobertura_ya_asignada).
        // Multiplicamos por 2 la cobertura para que los roles aún sin cubrir
        // ganen con holgura aunque sean un poco menos fuertes en el mapa.
        $slots_restantes = max(0, $TEAM_SIZE - $total_sel);
        $cobertura_tmp = $conteos; // copia mutable
        $slots = []; // cada slot: ['rol' => X]

        for($i = 0; $i < $slots_restantes; $i++){
            $mejor_rol = null;
            $mejor_score = -INF;
            foreach($todos_roles as $rol){
                // Si no hay ningún agente libre de ese rol → no se puede asignar
                if(empty($por_rol_sorted[$rol])) continue;
                $score = $fuerza_rol[$rol] / (1 + 2 * $cobertura_tmp[$rol]);
                if($score > $mejor_score){
                    $mejor_score = $score;
                    $mejor_rol = $rol;
                }
            }
            if($mejor_rol === null) break; // no hay agentes libres en ningún rol
            $slots[] = ['rol' => $mejor_rol];
            $cobertura_tmp[$mejor_rol]++;
        }

        // Construir las secciones a partir de slots (agrupando si 2 slots
        // del mismo rol aparecen seguidos; de momento mostramos UNA sección
        // por cada slot para cumplir la regla "una sección por slot").
        //
        // Si una sección repite rol, mostraremos los MISMOS top agents del
        // rol (el usuario eligirá 2 distintos de esa lista).
        $secciones = [];
        $ocurrencia_por_rol = [];
        $slot_inicial = $total_sel + 1;
        foreach($slots as $idx => $slot){
            $rol = $slot['rol'];
            $ocurrencia_por_rol[$rol] = ($ocurrencia_por_rol[$rol] ?? 0) + 1;
            $opciones = array_slice($por_rol_sorted[$rol], 0, 6);
            $secciones[] = [
                'rol'         => $rol,
                'occurrence'  => $ocurrencia_por_rol[$rol], // 1, 2, 3…
                'slot_num'    => $slot_inicial + $idx,
                'opciones'    => $opciones,
            ];
        }

        // Rating del equipo completo (solo cuando ya hay 5 seleccionados)
        $team_rating = null;
        if($total_sel >= $TEAM_SIZE){
            $sum = 0;
            foreach($seleccionados as $s){
                $sum += $tier_score[$s['tier'] ?? ''] ?? 0;
            }
            $avg = $total_sel > 0 ? $sum / $total_sel : 0;
            $label = $avg >= 2.5 ? 'S'
                   : ($avg >= 1.75 ? 'A'
                   : ($avg >= 1    ? 'B' : 'C'));
            $team_rating = [
                'score_avg'  => number_format($avg, 2),
                'score_max'  => 3,
                'label'      => $label,
                'balance_ok' => true,
                'conteos'    => $conteos,
            ];
        }

        return [
            'mapa'            => $mapa,
            'team_size'       => $TEAM_SIZE,
            'seleccionados'   => $seleccionados,
            'secciones'       => $secciones,      // ← nueva forma: 1 sección por slot
            'slots_restantes' => $slots_restantes,
            'conteos'         => $conteos,
            'fuerza_rol'      => $fuerza_rol,
            'team_rating'     => $team_rating,
        ];
    }

    private function cmp_tier($a, $b){
        $peso = ['S' => 0, 'A' => 1, 'B' => 2, '' => 3];
        $pa = $peso[$a['tier'] ?? ''] ?? 3;
        $pb = $peso[$b['tier'] ?? ''] ?? 3;
        if($pa !== $pb) return $pa <=> $pb;
        return strcmp($a['nombre'], $b['nombre']);
    }
}
?>
