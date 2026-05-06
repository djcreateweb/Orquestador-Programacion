<?php
/**
 * Helper ligero para leer variables de entorno desde el archivo .env
 * en la raíz del proyecto. Sin librerías externas, PHP 8 puro.
 *
 * Uso:
 *   require_once("model/env.php");
 *   $key = env('HENRIK_API_KEY');
 *   $mode = env('APP_MODE', 'prod');
 */

if (!function_exists('env')) {
    function env(string $key, $default = null) {
        static $cache = null;

        if ($cache === null) {
            $cache = [];
            $path  = __DIR__ . '/../.env';
            if (is_readable($path)) {
                $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                if ($lines !== false) {
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if ($line === '' || $line[0] === '#') continue;
                        $eq = strpos($line, '=');
                        if ($eq === false) continue;
                        $k = trim(substr($line, 0, $eq));
                        $v = trim(substr($line, $eq + 1));
                        // Strip comillas dobles o simples envolventes
                        if (strlen($v) >= 2) {
                            $first = $v[0];
                            $last  = substr($v, -1);
                            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                                $v = substr($v, 1, -1);
                            }
                        }
                        if ($k !== '') {
                            $cache[$k] = $v;
                        }
                    }
                }
            }
        }

        if (array_key_exists($key, $cache)) {
            $val = $cache[$key];
            return ($val === '' && $default !== null) ? $default : $val;
        }

        // Fallback por si otro cargador ya pobló $_ENV / getenv()
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
        $g = getenv($key);
        if ($g !== false && $g !== '') return $g;

        return $default;
    }
}
