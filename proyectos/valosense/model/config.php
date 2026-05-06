<?php
// Carga variables desde .env una sola vez (función idempotente)
if (!function_exists('vs_load_env')) {
    function vs_load_env(): void {
        static $loaded = false;
        if ($loaded) return;
        $loaded = true;
        $path = __DIR__ . '/../.env';
        if (!is_readable($path)) return;
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            $eq = strpos($line, '=');
            if ($eq === false) continue;
            $k = trim(substr($line, 0, $eq));
            $v = trim(substr($line, $eq + 1));
            // Quita comillas si las hay
            if ((strlen($v) >= 2) && (($v[0] === '"' && substr($v, -1) === '"') || ($v[0] === "'" && substr($v, -1) === "'"))) {
                $v = substr($v, 1, -1);
            }
            if (!isset($_ENV[$k])) $_ENV[$k] = $v;
            if (getenv($k) === false) putenv("$k=$v");
        }
    }
}
vs_load_env();

if (!defined('GOOGLE_CLIENT_ID'))     define('GOOGLE_CLIENT_ID',     $_ENV['GOOGLE_CLIENT_ID']     ?? '');
if (!defined('GOOGLE_CLIENT_SECRET')) define('GOOGLE_CLIENT_SECRET', $_ENV['GOOGLE_CLIENT_SECRET'] ?? '');
if (!defined('GOOGLE_REDIRECT_URI'))  define('GOOGLE_REDIRECT_URI',  $_ENV['GOOGLE_REDIRECT_URI']  ?? '');
