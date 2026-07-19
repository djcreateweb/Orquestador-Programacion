# SEGURIDAD

Modelo de amenaza, decisiones, qué mitiga cada una y riesgos residuales (§6 del encargo).

## Modelo de amenaza asumido
Atacante con **acceso físico** al mini-PC y a las tablets; acceso a la **red local**; **empleados curiosos** que quieren ver horas ajenas o entrar como admin; **robo** del equipo. Activos confidenciales: **PIN**, **contraseñas**, **registros horarios** y **acceso al Manager**.

## Controles implementados

### Credenciales (§6.1)
- El módulo **no almacena PIN ni contraseñas**: la verificación se delega al puerto `pin.verify` de Expira. Su BD no contiene secretos (test: *"una copia robada de la BD no revela credenciales"*).
- Fallback de hashing propio ([hash.js](../src/security/hash.js)): **scrypt** (memory-hard, sal de 16 B) con **comparación en tiempo constante** (`timingSafeEqual`). Argon2id si el host lo aporta.
- PIN de 4 dígitos compensado: **rechazo de PIN triviales** ([pin-policy.js](../src/security/pin-policy.js)), **límite de intentos + backoff exponencial + bloqueo** por empleado y dispositivo, e intentos fallidos **auditados** (sin el PIN). Recomendación documentada: 6 dígitos.

### Autenticación, sesiones y autorización (§6.2)
- **Cero login propio**: el rol y la identidad vienen del puerto `session` del host. Nunca se confía en el rol enviado por el cliente.
- **Autorización comprobada en el servidor en cada endpoint** ([authz.js](../src/http/authz.js), [handlers.js](../src/http/handlers.js)). Ocultar un botón no autoriza.
- **Anti-IDOR**: el empleado opera sólo sobre su propia identidad (tomada del servidor vía micro-sesión de kiosko); las solicitudes sobre marcas/jornadas ajenas se rechazan (test IDOR).
- **Kiosko ≠ Manager**: el canal kiosko no alcanza ninguna ruta de administración.
- **Micro-sesión de kiosko** ([kiosk-session.js](../src/http/kiosk-session.js)): token aleatorio ≥32 B, **almacenado sólo su hash**, caducidad corta (~90 s).
- **Rate limiting** en `entrar`/`fichar` + antirrebote en el botón. **Escalada de privilegios**: el técnico se identifica con su credencial; sin PIN maestro ni puertas traseras (test: no existen handlers de borrado ni backdoors).

### Datos en reposo y en tránsito (§6.3) — ver [INTEGRACION-EN-EXPIRA.md](INTEGRACION-EN-EXPIRA.md)
- La BD vive en la de Expira → **cifrado en reposo** (SQLCipher o cifrado de disco) y **backups cifrados**: se asumen del host; deben confirmarse (`TODO-INTEGRACIÓN`).
- Servidor local en **`127.0.0.1`**; si las tablets acceden por red, **TLS + autenticación de dispositivo**. El módulo **no envía datos personales al Hub**.

### Auditoría inalterable (§6.4)
- Log **append-only encadenado por hash** ([audit.service.js](../src/services/audit.service.js)): cada entrada guarda quién/qué/cuándo/desde/por qué y `hash = sha256(prev_hash + payload)`. `verificarIntegridad()` detecta cualquier alteración o borrado (test que rompe la cadena y se detecta).
- Los registros de jornada **no se borran ni se sobrescriben**: las correcciones son versiones nuevas que conservan el valor original ([repos.js](../src/services/repos.js) `versionarMarcaTs`).

### Superficie y código (§6.5)
- **Sin secretos en el repo** (`.env.example` sí, `.env` no; el módulo no requiere secretos propios).
- **Validación estricta** y **consultas parametrizadas** en todo el acceso a BD (cero SQL concatenado con entrada de usuario).
- **Errores genéricos** al usuario ("Credenciales incorrectas", sin distinguir usuario/PIN); detalle sólo en el log interno, **sin PII** (ni PIN, ni hashes, ni tokens — test que hace *grep* sobre respuestas y auditoría).
- **Cero dependencias nuevas**; **CSP/cabeceras** y **modo kiosko blindado** (Electron `contextIsolation:true`, `nodeIntegration:false`, `sandbox`) → responsabilidad del host, documentada.

## Riesgos residuales
1. **Cifrado en reposo y de backups**: dependen de Expira; hasta confirmarlos, un robo del mini-PC podría exponer la BD (aunque no revela credenciales, sí horarios). `TODO-INTEGRACIÓN`.
2. **PIN de 4 dígitos**: mitigado, pero se recomienda 6.
3. **Verificación de PIN del host**: se asume en tiempo constante; debe confirmarse en la implementación real del puerto.
4. **Endurecimiento del cliente** (CSP, kiosko Electron blindado): responsabilidad de integración; no verificable sin el host.
5. **Reloj del dispositivo**: los ts dependen del reloj; en el mini-PC debe sincronizarse (NTP) para la fiabilidad legal del registro.
