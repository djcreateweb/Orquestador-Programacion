<?php
// =====================================================
// Amistad_model
// Invitaciones + amistades aceptadas entre usuarios.
// Tabla `amistad` (emisor_id, receptor_id, estado).
// =====================================================
class Amistad_model {
    private $db;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
    }

    // ---- Relación entre dos usuarios (cualquier dirección) ----
    // Devuelve ['estado' => ..., 'id' => int, 'emisor_id' => int, 'receptor_id' => int]
    // Estados: 'amigo' | 'pendiente_enviada' | 'pendiente_recibida' | 'ninguno' | 'yo_mismo'
    public function get_relacion($me, $otro){
        $me = (int)$me; $otro = (int)$otro;
        if($me === $otro) return ['estado' => 'yo_mismo', 'id' => 0, 'emisor_id' => 0, 'receptor_id' => 0];
        try {
            $stmt = $this->db->prepare(
                "SELECT id, emisor_id, receptor_id, estado
                   FROM amistad
                  WHERE ((emisor_id=? AND receptor_id=?) OR (emisor_id=? AND receptor_id=?))
                    AND estado IN ('pendiente','aceptada')
                  ORDER BY estado='aceptada' DESC
                  LIMIT 1"
            );
            $stmt->bind_param("iiii", $me, $otro, $otro, $me);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if(!$row) return ['estado' => 'ninguno', 'id' => 0, 'emisor_id' => 0, 'receptor_id' => 0];
            $estado = ($row['estado'] === 'aceptada')
                ? 'amigo'
                : (((int)$row['emisor_id'] === $me) ? 'pendiente_enviada' : 'pendiente_recibida');
            return [
                'estado'     => $estado,
                'id'         => (int)$row['id'],
                'emisor_id'  => (int)$row['emisor_id'],
                'receptor_id'=> (int)$row['receptor_id'],
            ];
        } catch (mysqli_sql_exception $e) {
            return ['estado' => 'ninguno', 'id' => 0, 'emisor_id' => 0, 'receptor_id' => 0];
        }
    }

    // Alias legacy: devuelve solo el estado (string)
    public function estado_entre($me, $otro){
        return $this->get_relacion($me, $otro)['estado'];
    }

    // ---- Crear invitación ----
    public function crear_invitacion($emisor_id, $receptor_id){
        $emisor_id = (int)$emisor_id; $receptor_id = (int)$receptor_id;
        if($emisor_id <= 0 || $receptor_id <= 0 || $emisor_id === $receptor_id) return false;

        // No crear si ya hay una relación activa (pendiente o amigo en cualquier dirección)
        $estado = $this->estado_entre($emisor_id, $receptor_id);
        if(in_array($estado, ['amigo','pendiente_enviada','pendiente_recibida'], true)) return false;

        try {
            $stmt = $this->db->prepare(
                "INSERT INTO amistad (emisor_id, receptor_id, estado)
                 VALUES (?, ?, 'pendiente')
                 ON DUPLICATE KEY UPDATE estado='pendiente', creado_en=NOW(), resuelto_en=NULL"
            );
            $stmt->bind_param("ii", $emisor_id, $receptor_id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // ---- Listados ----
    public function get_recibidas($usuario_id){
        $usuario_id = (int)$usuario_id;
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id AS amistad_id, a.creado_en,
                        u.id AS usuario_id, u.username, u.rango, u.region
                   FROM amistad a
                   JOIN usuario u ON u.id = a.emisor_id
                  WHERE a.receptor_id = ? AND a.estado = 'pendiente'
                  ORDER BY a.creado_en DESC"
            );
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $rows ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    public function get_enviadas($usuario_id){
        $usuario_id = (int)$usuario_id;
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id AS amistad_id, a.creado_en,
                        u.id AS usuario_id, u.username, u.rango, u.region
                   FROM amistad a
                   JOIN usuario u ON u.id = a.receptor_id
                  WHERE a.emisor_id = ? AND a.estado = 'pendiente'
                  ORDER BY a.creado_en DESC"
            );
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $rows ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    public function get_amigos($usuario_id){
        $usuario_id = (int)$usuario_id;
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id AS amistad_id, a.resuelto_en,
                        u.id AS usuario_id, u.username, u.rango, u.region
                   FROM amistad a
                   JOIN usuario u
                     ON u.id = IF(a.emisor_id = ?, a.receptor_id, a.emisor_id)
                  WHERE (a.emisor_id = ? OR a.receptor_id = ?) AND a.estado = 'aceptada'
                  ORDER BY u.username ASC"
            );
            $stmt->bind_param("iii", $usuario_id, $usuario_id, $usuario_id);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $rows ?: [];
        } catch (mysqli_sql_exception $e) {
            return [];
        }
    }

    /**
     * Relación de $me con cada id en $otros_ids en UNA sola query (evita N+1).
     * Resultado: array[otro_id] => ['estado','id','emisor_id','receptor_id'].
     * Si no hay fila para un id, no aparece en el array (= relación "ninguna").
     */
    public function get_relaciones_lote(int $me, array $otros_ids): array {
        $me = (int)$me;
        $otros_ids = array_values(array_unique(array_map('intval', $otros_ids)));
        $otros_ids = array_values(array_filter($otros_ids, fn($x) => $x > 0 && $x !== $me));
        if (empty($otros_ids)) return [];

        $placeholders = implode(',', array_fill(0, count($otros_ids), '?'));
        $types  = 'i' . str_repeat('i', count($otros_ids)) . 'i' . str_repeat('i', count($otros_ids));
        $params = array_merge([$me], $otros_ids, [$me], $otros_ids);

        try {
            $stmt = $this->db->prepare(
                "SELECT id, emisor_id, receptor_id, estado
                   FROM amistad
                  WHERE estado IN ('pendiente','aceptada')
                    AND (
                         (emisor_id = ?   AND receptor_id IN ($placeholders))
                      OR (receptor_id = ? AND emisor_id   IN ($placeholders))
                    )"
            );
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            $out = [];
            foreach ($rows as $r) {
                $otro = ((int)$r['emisor_id'] === $me) ? (int)$r['receptor_id'] : (int)$r['emisor_id'];
                $estado = ($r['estado'] === 'aceptada')
                    ? 'amigo'
                    : (((int)$r['emisor_id'] === $me) ? 'pendiente_enviada' : 'pendiente_recibida');
                if (isset($out[$otro]) && $out[$otro]['estado'] === 'amigo') continue;
                $out[$otro] = [
                    'estado'      => $estado,
                    'id'          => (int)$r['id'],
                    'emisor_id'   => (int)$r['emisor_id'],
                    'receptor_id' => (int)$r['receptor_id'],
                ];
            }
            return $out;
        } catch (mysqli_sql_exception $e) {
            error_log('Amistad_model::get_relaciones_lote — ' . $e->getMessage());
            return [];
        }
    }

    public function count_pendientes_recibidas($usuario_id){
        $usuario_id = (int)$usuario_id;
        try {
            $stmt = $this->db->prepare(
                "SELECT COUNT(*) AS n FROM amistad WHERE receptor_id = ? AND estado = 'pendiente'"
            );
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $row ? (int)$row['n'] : 0;
        } catch (mysqli_sql_exception $e) {
            return 0;
        }
    }

    // ---- Mutaciones ----
    public function aceptar($id, $receptor_id){
        return $this->cambiar_estado_por_receptor((int)$id, (int)$receptor_id, 'aceptada');
    }
    public function rechazar($id, $receptor_id){
        return $this->cambiar_estado_por_receptor((int)$id, (int)$receptor_id, 'rechazada');
    }
    private function cambiar_estado_por_receptor($id, $receptor_id, $estado){
        try {
            $stmt = $this->db->prepare(
                "UPDATE amistad
                    SET estado = ?, resuelto_en = NOW()
                  WHERE id = ? AND receptor_id = ? AND estado = 'pendiente'"
            );
            $stmt->bind_param("sii", $estado, $id, $receptor_id);
            $ok = $stmt->execute();
            $affected = $stmt->affected_rows;
            $stmt->close();
            return $ok && $affected > 0;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // Eliminar: tanto cancelar una invitación enviada como quitar un amigo.
    public function eliminar($id, $usuario_id){
        $id = (int)$id; $usuario_id = (int)$usuario_id;
        try {
            $stmt = $this->db->prepare(
                "DELETE FROM amistad
                  WHERE id = ? AND (emisor_id = ? OR receptor_id = ?)"
            );
            $stmt->bind_param("iii", $id, $usuario_id, $usuario_id);
            $ok = $stmt->execute();
            $affected = $stmt->affected_rows;
            $stmt->close();
            return $ok && $affected > 0;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }
}
?>
