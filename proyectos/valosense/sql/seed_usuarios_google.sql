-- ============================================================
-- Ejemplos simulando registros via Google OAuth con formato
-- nombre#N. El contador por nombre base NUNCA decrementa.
-- ============================================================

-- Hash bcrypt placeholder (los usuarios Google no usan password local)
SET @ph := '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

INSERT INTO usuario (username, email, password_hash, rango, region, google_id, riot_id_visible) VALUES
('david#1',      'david@gmail.com',        @ph, 'Gold',      'EU', 'g_fake_david_001',      1),
('david#2',      'david@outlook.com',      @ph, 'Platinum',  'EU', 'g_fake_david_002',      1),
('maria#1',      'maria@gmail.com',        @ph, 'Silver',    'EU', 'g_fake_maria_003',      1),
('juanperez#1',  'juan.perez@gmail.com',   @ph, 'Diamond',   'EU', 'g_fake_juanperez_004',  1),
('francisco#1',  'francisco@gmail.com',    @ph, 'Bronze',    'EU', 'g_fake_francisco_005',  1);

-- Contadores coherentes con los registros creados
INSERT INTO contador_username (nombre_base, siguiente) VALUES
('david',      3),
('maria',      2),
('juanperez',  2),
('francisco',  2)
ON DUPLICATE KEY UPDATE siguiente = VALUES(siguiente);
