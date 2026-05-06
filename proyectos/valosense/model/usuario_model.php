<?php
class Usuario_model {
    private $db;

    public function __construct(){
        require_once("model/conectar.php");
        $this->db = Conectar::conexion();
    }

    public function login($user, $pass){
        try {
            $stmt = $this->db->prepare("SELECT id, username, display_name, email, password_hash, rango, region, es_admin, riot_id, riot_tag, riot_region, riot_id_visible, google_id, creado_en, estado_presencia FROM usuario WHERE username = ? OR email = ? LIMIT 1");
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
            error_log('Usuario_model::login — ' . $e->getMessage());
            throw new RuntimeException("Error interno. Vuelve a intentarlo.", 0, $e);
        }
    }

    public function registro($username, $email, $pass, $rango, $region){
        try {
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            $stmt = $this->db->prepare("INSERT INTO usuario (username, email, password_hash, rango, region, creado_en) VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt->bind_param("sssss", $username, $email, $hash, $rango, $region);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function get_usuarios(){
        try {
            $stmt = $this->db->prepare("SELECT id, username, email, rango, region, es_admin, creado_en FROM usuario ORDER BY creado_en DESC");
            $stmt->execute();
            $registros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $registros ?: [];
        } catch (mysqli_sql_exception $e) {
            error_log('Usuario_model — ' . $e->getMessage());
            throw new RuntimeException("Error interno consultando usuarios.", 0, $e);
        }
    }

    public function get_por_id($id){
        try {
            $stmt = $this->db->prepare(
                "SELECT id, username, display_name, email, rango, region, es_admin,
                        riot_id, riot_tag, riot_region, riot_id_visible, creado_en,
                        ultima_actividad, estado_presencia, google_id
                   FROM usuario WHERE id = ? LIMIT 1"
            );
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $registro = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $registro ?: [];
        } catch (mysqli_sql_exception $e) {
            error_log('Usuario_model — ' . $e->getMessage());
            throw new RuntimeException("Error interno consultando usuarios.", 0, $e);
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

    public function vincular_riot($id, $riot_id, $riot_tag, $riot_region){
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET riot_id = ?, riot_tag = ?, riot_region = ? WHERE id = ?");
            $stmt->bind_param("sssi", $riot_id, $riot_tag, $riot_region, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    /**
     * Vincula la cuenta Riot guardando también el PUUID devuelto por HenrikDev
     * y el timestamp de validación. Usa NOW() si $validado_en viene vacío.
     */
    public function vincular_riot_validado($id, $riot_id, $riot_tag, $riot_region, $puuid, $validado_en = null){
        try {
            if ($validado_en === null || $validado_en === '') {
                $stmt = $this->db->prepare(
                    "UPDATE usuario
                        SET riot_id = ?, riot_tag = ?, riot_region = ?,
                            riot_puuid = ?, riot_validado_en = NOW()
                      WHERE id = ?"
                );
                $stmt->bind_param("ssssi", $riot_id, $riot_tag, $riot_region, $puuid, $id);
            } else {
                $stmt = $this->db->prepare(
                    "UPDATE usuario
                        SET riot_id = ?, riot_tag = ?, riot_region = ?,
                            riot_puuid = ?, riot_validado_en = ?
                      WHERE id = ?"
                );
                $stmt->bind_param("sssssi", $riot_id, $riot_tag, $riot_region, $puuid, $validado_en, $id);
            }
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            error_log('Usuario_model::vincular_riot_validado — ' . $e->getMessage());
            return false;
        }
    }

    public function desvincular_riot($id){
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET riot_id = NULL, riot_tag = NULL, riot_region = NULL, riot_puuid = NULL, riot_validado_en = NULL WHERE id = ?");
            $stmt->bind_param("i", $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    public function get_por_username($username){
        try {
            $stmt = $this->db->prepare(
                "SELECT id, username, email, rango, region, es_admin, creado_en FROM usuario WHERE username = ? LIMIT 1"
            );
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $registro = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $registro ?: [];
        } catch (mysqli_sql_exception $e) { return []; }
    }

    // Registra actividad (se llama en menu.php en cada carga autenticada)
    public function ping($id){
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET ultima_actividad = NOW() WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();
            return true;
        } catch (mysqli_sql_exception $e) { return false; }
    }

    public function update($username, $email, $rango, $region, $id){
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET username = ?, email = ?, rango = ?, region = ? WHERE id = ?");
            $stmt->bind_param("ssssi", $username, $email, $rango, $region, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // Actualiza el estado de presencia del usuario (en_linea / ausente / invisible)
    public function actualizar_estado_presencia(int $id, string $estado): bool {
        $estados_validos = ['en_linea', 'ausente', 'invisible'];
        if (!in_array($estado, $estados_validos, true)) {
            return false;
        }
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET estado_presencia = ? WHERE id = ?");
            $stmt->bind_param("si", $estado, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            return false;
        }
    }

    // Cambia la contraseña verificando primero la actual
    // Retorna ['ok' => bool, 'error' => string]
    public function cambiar_password(int $id, string $password_actual_plano, string $password_nuevo_plano): array {
        try {
            // 1. Obtener el hash actual
            $stmt = $this->db->prepare("SELECT password_hash FROM usuario WHERE id = ? LIMIT 1");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $fila = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$fila) {
                return ['ok' => false, 'error' => 'Usuario no encontrado.'];
            }

            // 2. Verificar la contraseña actual
            if (!password_verify($password_actual_plano, $fila['password_hash'])) {
                return ['ok' => false, 'error' => 'La contraseña actual no es correcta.'];
            }

            // 3. Validar nueva contraseña: mínimo 8 caracteres y diferente de la actual
            if (strlen($password_nuevo_plano) < 8) {
                return ['ok' => false, 'error' => 'La nueva contraseña debe tener al menos 8 caracteres.'];
            }
            if (password_verify($password_nuevo_plano, $fila['password_hash'])) {
                return ['ok' => false, 'error' => 'La nueva contraseña debe ser diferente a la actual.'];
            }

            // 4. Actualizar con el nuevo hash
            $nuevo_hash = password_hash($password_nuevo_plano, PASSWORD_DEFAULT);
            $stmt = $this->db->prepare("UPDATE usuario SET password_hash = ? WHERE id = ?");
            $stmt->bind_param("si", $nuevo_hash, $id);
            $ok = $stmt->execute();
            $stmt->close();

            return $ok
                ? ['ok' => true,  'error' => '']
                : ['ok' => false, 'error' => 'No se pudo guardar la contraseña. Inténtalo de nuevo.'];
        } catch (mysqli_sql_exception $e) {
            return ['ok' => false, 'error' => 'Error interno al cambiar contraseña.'];
        }
    }

    // Elimina la cuenta del usuario previa verificación de contraseña
    // Retorna ['ok' => bool, 'error' => string]
    // Nota: amistad y mensaje tienen ON DELETE CASCADE, lineup tiene ON DELETE SET NULL,
    //       agente_favorito, solicitud_equipo y rutina tienen ON DELETE CASCADE.
    public function eliminar_cuenta(int $id, string $password_plano): array {
        try {
            // 1. Verificar contraseña
            $stmt = $this->db->prepare("SELECT password_hash FROM usuario WHERE id = ? LIMIT 1");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $fila = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$fila) {
                return ['ok' => false, 'error' => 'Usuario no encontrado.'];
            }
            if (!password_verify($password_plano, $fila['password_hash'])) {
                return ['ok' => false, 'error' => 'Contraseña incorrecta. No se puede eliminar la cuenta.'];
            }

            // 2. Eliminar el usuario (las FKs CASCADE se encargan de amistad, mensaje,
            //    agente_favorito, solicitud_equipo, rutina; lineup queda con usuario_id=NULL)
            $stmt = $this->db->prepare("DELETE FROM usuario WHERE id = ?");
            $stmt->bind_param("i", $id);
            $ok = $stmt->execute();
            $stmt->close();

            return $ok
                ? ['ok' => true,  'error' => '']
                : ['ok' => false, 'error' => 'No se pudo eliminar la cuenta. Inténtalo de nuevo.'];
        } catch (mysqli_sql_exception $e) {
            return ['ok' => false, 'error' => 'Error interno al eliminar la cuenta.'];
        }
    }

    // Devuelve la lista de amigos aceptados con datos de presencia
    public function get_amigos(int $id): array {
        try {
            $stmt = $this->db->prepare(
                "SELECT a.id AS relacion_id,
                        u.id, u.username, u.rango, u.region,
                        u.estado_presencia, u.ultima_actividad
                   FROM amistad a
                   INNER JOIN usuario u ON u.id = CASE
                       WHEN a.emisor_id = ? THEN a.receptor_id
                       ELSE a.emisor_id
                   END
                  WHERE (a.emisor_id = ? OR a.receptor_id = ?)
                    AND a.estado = 'aceptada'
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

    /**
     * Indica si el Riot ID del target debe ser visible para el viewer.
     * Reglas: viewer logueado, relación de amistad aceptada, target tiene riot vinculado,
     * target permite visibilidad.
     */
    public function puede_ver_riot(int $viewer_id, int $target_id): bool {
        if ($viewer_id <= 0 || $target_id <= 0) return false;
        if ($viewer_id === $target_id) return true; // el dueño siempre ve lo suyo
        $sql = "SELECT u.riot_id, u.riot_id_visible,
                       EXISTS(
                           SELECT 1 FROM amistad a
                           WHERE a.estado='aceptada'
                             AND ((a.emisor_id=? AND a.receptor_id=?)
                               OR (a.emisor_id=? AND a.receptor_id=?))
                       ) AS son_amigos
                FROM usuario u WHERE u.id=?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("iiiii", $viewer_id, $target_id, $target_id, $viewer_id, $target_id);
        $stmt->execute();
        $r = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$r) return false;
        if (empty($r['riot_id'])) return false;
        if ((int)$r['riot_id_visible'] !== 1) return false;
        if ((int)$r['son_amigos'] !== 1) return false;
        return true;
    }

    /**
     * Actualiza la preferencia de visibilidad del Riot ID del usuario.
     */
    public function actualizar_visibilidad_riot(int $id, int $visible): bool {
        $v = ($visible === 1) ? 1 : 0;
        $sql = "UPDATE usuario SET riot_id_visible = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ii", $v, $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    /**
     * Comprueba si dos usuarios tienen una amistad aceptada entre ellos.
     */
    public function son_amigos(int $a, int $b): bool {
        $sql = "SELECT EXISTS(
                    SELECT 1 FROM amistad
                    WHERE estado = 'aceptada'
                      AND ((emisor_id = ? AND receptor_id = ?)
                        OR (emisor_id = ? AND receptor_id = ?))
                ) AS resultado";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("iiii", $a, $b, $b, $a);
        $stmt->execute();
        $fila = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return isset($fila['resultado']) && (int)$fila['resultado'] === 1;
    }

    /**
     * Busca, o crea un usuario local a partir de datos de Google OAuth.
     * Dos ramas (la vinculación automática por email fue eliminada por seguridad):
     *   1. google_id ya existe → devuelve la fila.
     *   2. usuario nuevo       → inserta con username derivado del email y devuelve la fila.
     *
     * Nota: si el email ya existe sin google_id, el controller debe haber cortado antes
     * llamando a buscar_por_email() para evitar la vinculación silenciosa.
     *
     * @param string $google_sub  Identificador único de Google (campo "sub" del id_token).
     * @param string $email       Email verificado de Google.
     * @param string $name        Nombre de perfil de Google (se guarda en display_name).
     * @return array|null         Fila del usuario sin password_hash, o null en error.
     */
    public function login_por_google(string $google_sub, string $email, string $name): ?array {
        try {
            // Rama 1: ya vinculado por google_id
            $stmt = $this->db->prepare(
                "SELECT id, username, display_name, email, rango, region, es_admin,
                        riot_id, riot_tag, riot_region, riot_id_visible,
                        google_id, estado_presencia, ultima_actividad, creado_en
                   FROM usuario WHERE google_id = ? LIMIT 1"
            );
            $stmt->bind_param("s", $google_sub);
            $stmt->execute();
            $fila = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if ($fila) return $fila;

            // Rama 2: usuario nuevo — username con formato nombre_base#N
            // N proviene de un contador persistente que nunca decrementa.

            // Derivar nombre_base del local-part del email.
            // Conservamos letras, numeros, punto, guion y guion bajo.
            $local       = strtolower(explode('@', $email)[0]);
            $nombre_base = preg_replace('/[^a-z0-9._\-]/', '', $local);
            // Colapsar repeticiones de separadores y limpiar bordes
            $nombre_base = preg_replace('/[._\-]{2,}/', '.', $nombre_base);
            $nombre_base = trim($nombre_base, '._-');
            if (strlen($nombre_base) < 2) $nombre_base = 'user';
            $nombre_base = substr($nombre_base, 0, 25);

            // display_name: nombre real de Google, truncado a 80 chars
            $display_name = substr(trim($name), 0, 80);

            // Contraseña aleatoria: el usuario Google nunca la usará
            $pass_placeholder = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
            $rango_default    = 'Iron';
            $region_default   = 'EU';

            // Obtener N atómicamente e intentar insertar (máx. 5 reintentos ante colisión manual)
            $new_id  = 0;
            $intento = 0;
            while ($intento < 5) {
                // Garantiza fila existente en el contador
                $stmt = $this->db->prepare(
                    "INSERT IGNORE INTO contador_username (nombre_base, siguiente) VALUES (?, 1)"
                );
                $stmt->bind_param("s", $nombre_base);
                $stmt->execute();
                $stmt->close();

                // Incremento atómico: LAST_INSERT_ID(siguiente) devuelve el valor previo
                // y siguiente+1 queda guardado para el próximo registro con este nombre_base
                $stmt = $this->db->prepare(
                    "UPDATE contador_username SET siguiente = LAST_INSERT_ID(siguiente) + 1 WHERE nombre_base = ?"
                );
                $stmt->bind_param("s", $nombre_base);
                $stmt->execute();
                $N = (int)$this->db->insert_id; // LAST_INSERT_ID(siguiente) expone el valor previo
                $stmt->close();

                if ($N < 1) $N = 1; // defensa (no debería ocurrir)

                $final_username = $nombre_base . '#' . $N;

                // Insertar usuario con el username generado y display_name de Google
                $stmt = $this->db->prepare(
                    "INSERT INTO usuario (username, display_name, email, password_hash, rango, region, google_id, creado_en)
                          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())"
                );
                $stmt->bind_param(
                    "sssssss",
                    $final_username, $display_name, $email, $pass_placeholder,
                    $rango_default, $region_default, $google_sub
                );
                $ok     = $stmt->execute();
                $new_id = (int)$this->db->insert_id;
                $stmt->close();

                if ($ok && $new_id > 0) break; // inserción exitosa

                // Colisión de username (alguien creó ese nombre manualmente): reintentar
                $intento++;
            }

            if ($new_id <= 0) return null;
            return $this->get_por_id($new_id) ?: null;

        } catch (mysqli_sql_exception $e) {
            error_log('Usuario_model::login_por_google — ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Devuelve la fila del usuario por email (incluye google_id para comprobar conflictos).
     * Usado en google_callback para detectar email ya registrado sin google_id.
     */
    public function buscar_por_email(string $email): ?array {
        try {
            $stmt = $this->db->prepare(
                "SELECT id, username, email, google_id FROM usuario WHERE email = ? LIMIT 1"
            );
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $fila = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $fila ?: null;
        } catch (mysqli_sql_exception $e) {
            error_log('Usuario_model::buscar_por_email — ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Devuelve la fila del usuario cuyo google_id coincide con $sub.
     * Usado en vincular_google para detectar si el sub ya pertenece a otra cuenta.
     */
    public function buscar_por_google_id(string $sub): ?array {
        try {
            $stmt = $this->db->prepare(
                "SELECT id, username, email, google_id FROM usuario WHERE google_id = ? LIMIT 1"
            );
            $stmt->bind_param("s", $sub);
            $stmt->execute();
            $fila = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $fila ?: null;
        } catch (mysqli_sql_exception $e) {
            error_log('Usuario_model::buscar_por_google_id — ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Vincula una cuenta Google a un usuario local existente.
     * Guarda google_id y, si display_name está vacío, lo rellena con el nombre de Google.
     */
    public function vincular_google_id(int $id, string $google_sub, string $display_name): bool {
        try {
            $dn = substr(trim($display_name), 0, 80);
            $stmt = $this->db->prepare(
                "UPDATE usuario SET google_id = ?, display_name = COALESCE(display_name, ?) WHERE id = ?"
            );
            $stmt->bind_param("ssi", $google_sub, $dn, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            error_log('Usuario_model::vincular_google_id — ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Actualiza el display_name del usuario.
     * Disponible para que el frontend pueda permitir edición futura.
     */
    public function actualizar_display_name(int $id, string $name): bool {
        try {
            $dn   = substr(trim($name), 0, 80);
            $stmt = $this->db->prepare("UPDATE usuario SET display_name = ? WHERE id = ?");
            $stmt->bind_param("si", $dn, $id);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        } catch (mysqli_sql_exception $e) {
            error_log('Usuario_model::actualizar_display_name — ' . $e->getMessage());
            return false;
        }
    }

    // Alias explícito para recuperar un usuario por id con todos los campos de ajustes
    // (get_por_id ya existe y devuelve el mismo resultado; este alias mantiene el contrato)
    public function get_by_id(int $id): ?array {
        $fila = $this->get_por_id($id);
        return !empty($fila) ? $fila : null;
    }

    /**
     * Comprueba si username o email ya están en uso por otro usuario.
     * Devuelve ['campo' => 'username'|'email'] si hay duplicado, false si no.
     */
    public function comprobar_unicidad(string $username, string $email, int $excluir_id): array|false {
        try {
            $stmt = $this->db->prepare(
                "SELECT
                    MAX(username = ?) AS dup_user,
                    MAX(email    = ?) AS dup_mail
                   FROM usuario
                  WHERE (username = ? OR email = ?) AND id != ?"
            );
            $stmt->bind_param("ssssi", $username, $email, $username, $email, $excluir_id);
            $stmt->execute();
            $fila = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            if (!empty($fila['dup_user'])) return ['campo' => 'username'];
            if (!empty($fila['dup_mail'])) return ['campo' => 'email'];
            return false;
        } catch (mysqli_sql_exception $e) {
            // En caso de error, bloqueamos la actualización por seguridad
            return ['campo' => 'username'];
        }
    }
}
?>
