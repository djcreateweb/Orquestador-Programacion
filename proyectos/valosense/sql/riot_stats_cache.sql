-- Caché de estadísticas Valorant obtenidas via HenrikDev API.
-- TTL efectivo en la app: 15 minutos (ver RiotStatsService::CACHE_TTL_SECONDS).
CREATE TABLE IF NOT EXISTS riot_stats_cache (
    puuid VARCHAR(120) NOT NULL PRIMARY KEY,
    stats_json TEXT NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
