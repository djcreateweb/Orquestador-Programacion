-- Contador persistente del sufijo #N por nombre base.
-- Nunca decrementa: si un usuario se elimina, su número queda quemado.
CREATE TABLE IF NOT EXISTS contador_username (
    nombre_base VARCHAR(50) NOT NULL PRIMARY KEY,
    siguiente   INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
