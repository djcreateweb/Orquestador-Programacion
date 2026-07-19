// schema.js — Esquema del módulo. TODAS las tablas con prefijo `presentia_` para
// no colisionar con Expira. Sólo CREATE ... IF NOT EXISTS ⇒ aditivo e idempotente
// (regla de oro §1.3: jamás DROP/reset/fresh; nada preexistente se toca).
//
// Modelo: una JORNADA (día del empleado) contiene MARCAS (entrada/salida); las
// pausas son pares adicionales dentro de la jornada. Las correcciones NO borran ni
// sobrescriben: registran una VERSIÓN nueva conservando el valor original
// (presentia_marca_versiones) y quedan en la auditoría encadenada por hash.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS presentia_ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS presentia_jornadas (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  empleado_id    TEXT    NOT NULL,
  fecha          TEXT    NOT NULL,               -- YYYY-MM-DD en zona del centro (día de la entrada)
  codigo         TEXT    NOT NULL UNIQUE,         -- F-AAAA-NNNN
  estado         TEXT    NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada')),
  editado        INTEGER NOT NULL DEFAULT 0,
  creado_ts      INTEGER NOT NULL,
  actualizado_ts INTEGER NOT NULL,
  UNIQUE (empleado_id, fecha)
);

CREATE TABLE IF NOT EXISTS presentia_marcas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  jornada_id  INTEGER NOT NULL,
  tipo        TEXT    NOT NULL CHECK (tipo IN ('entrada','salida')),
  ts          INTEGER NOT NULL,                  -- epoch ms UTC
  origen      TEXT,                              -- 'kiosk' | 'manager'
  dispositivo TEXT,
  editado     INTEGER NOT NULL DEFAULT 0,
  creado_ts   INTEGER NOT NULL,
  FOREIGN KEY (jornada_id) REFERENCES presentia_jornadas(id)
);

-- Historial inalterable de cambios sobre marcas (conserva el valor ORIGINAL). Append-only.
CREATE TABLE IF NOT EXISTS presentia_marca_versiones (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  marca_id       INTEGER NOT NULL,
  campo          TEXT    NOT NULL,               -- p.ej. 'ts' | 'tipo'
  valor_anterior TEXT,
  valor_nuevo    TEXT,
  motivo         TEXT    NOT NULL,
  autor_id       TEXT    NOT NULL,
  ts             INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS presentia_solicitudes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  empleado_id TEXT   NOT NULL,
  tipo       TEXT    NOT NULL DEFAULT 'correccion',
  jornada_id INTEGER,
  marca_id   INTEGER,
  cambio     TEXT    NOT NULL,                   -- JSON: {accion, tipo, ts, ...}
  motivo     TEXT    NOT NULL,
  estado     TEXT    NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada')),
  resuelto_por TEXT,
  resuelto_ts  INTEGER,
  comentario   TEXT,
  creado_ts    INTEGER NOT NULL
);

-- Auditoría append-only encadenada por hash (§6.4). hash = sha256(prev_hash + payload canónico).
CREATE TABLE IF NOT EXISTS presentia_auditoria (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         INTEGER NOT NULL,
  actor_id   TEXT,
  actor_rol  TEXT,
  accion     TEXT    NOT NULL,
  entidad    TEXT,
  entidad_id TEXT,
  detalle    TEXT,                               -- JSON (sin datos sensibles: nunca PIN/hash/token)
  origen     TEXT,
  motivo     TEXT,
  prev_hash  TEXT    NOT NULL,
  hash       TEXT    NOT NULL
);

-- Ancla tamper-evidente de la auditoría (fix S-02): última fila REAL (id + hash) y
-- recuento total, actualizada en cada alta (ver audit.service.js: registrar()). Un
-- hash-chain simple sólo detecta manipulación "en el medio"; borrar las filas MÁS
-- RECIENTES no deja ninguna fila posterior que lo delate. Este ancla —comparada contra
-- la última fila real en verificarIntegridad()— sí detecta ese truncamiento de cola.
-- Fila única (id=1).
CREATE TABLE IF NOT EXISTS presentia_auditoria_ancla (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  ultima_id   INTEGER NOT NULL DEFAULT 0,
  ultimo_hash TEXT    NOT NULL DEFAULT 'GENESIS',
  recuento    INTEGER NOT NULL DEFAULT 0
);

-- Contador correlativo atómico (fallback cuando Expira no aporta su puerto correlatives).
CREATE TABLE IF NOT EXISTS presentia_correlativos (
  serie  TEXT    NOT NULL,
  anio   INTEGER NOT NULL,
  ultimo INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (serie, anio)
);

-- Aceptación de términos y condiciones por usuario (una vez por versión). Prueba de
-- consentimiento informado: quién y cuándo. La aceptación se exige en el primer acceso.
CREATE TABLE IF NOT EXISTS presentia_aceptaciones (
  empleado_id TEXT    NOT NULL,
  version     TEXT    NOT NULL,
  ts          INTEGER NOT NULL,
  origen      TEXT,
  PRIMARY KEY (empleado_id, version)
);

-- Estado de intentos de PIN por empleado y dispositivo (bloqueo/backoff, §6.1).
CREATE TABLE IF NOT EXISTS presentia_pin_intentos (
  empleado_id     TEXT    NOT NULL,
  dispositivo     TEXT    NOT NULL,
  fallos          INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta INTEGER NOT NULL DEFAULT 0,
  actualizado_ts  INTEGER NOT NULL,
  PRIMARY KEY (empleado_id, dispositivo)
);

CREATE INDEX IF NOT EXISTS idx_presentia_marcas_jornada  ON presentia_marcas (jornada_id);
CREATE INDEX IF NOT EXISTS idx_presentia_jornadas_emp    ON presentia_jornadas (empleado_id, fecha);
CREATE INDEX IF NOT EXISTS idx_presentia_jornadas_fecha  ON presentia_jornadas (fecha);
CREATE INDEX IF NOT EXISTS idx_presentia_solici_estado   ON presentia_solicitudes (estado);
CREATE INDEX IF NOT EXISTS idx_presentia_versiones_marca ON presentia_marca_versiones (marca_id);
`;

/** Nombres de tablas del módulo (para pruebas de integridad / documentación). */
export const TABLAS = Object.freeze([
  'presentia_ajustes',
  'presentia_jornadas',
  'presentia_marcas',
  'presentia_marca_versiones',
  'presentia_solicitudes',
  'presentia_auditoria',
  'presentia_auditoria_ancla',
  'presentia_correlativos',
  'presentia_pin_intentos',
  'presentia_aceptaciones',
]);
