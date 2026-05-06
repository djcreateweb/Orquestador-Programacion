<?php
/**
 * Verificación local del id_token de Google (RS256) usando JWKS.
 * Sin librerías externas: openssl_verify + construcción manual del PEM.
 */

if (!function_exists('vs_b64url_decode')) {
    function vs_b64url_decode(string $s): string {
        $pad = 3 - (3 + strlen($s)) % 4;
        return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', $pad));
    }
}

/** Cache local del JWKS (TTL 12h) */
function vs_google_jwks(): ?array {
    $dir  = __DIR__ . '/../cache';
    $file = $dir . '/google_jwks.json';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);

    // Servir desde cache si sigue fresco
    if (is_file($file) && (time() - filemtime($file) < 12 * 3600)) {
        $json = @file_get_contents($file);
        $data = $json ? json_decode($json, true) : null;
        if (is_array($data) && !empty($data['keys'])) return $data;
    }

    // Descargar
    $ch = curl_init('https://www.googleapis.com/oauth2/v3/certs');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($http !== 200 || !$resp) return null;
    $data = json_decode($resp, true);
    if (!is_array($data) || empty($data['keys'])) return null;
    @file_put_contents($file, $resp, LOCK_EX);
    return $data;
}

/** Serializa longitud ASN.1 DER */
function vs_asn1_len(int $len): string {
    if ($len < 0x80) return chr($len);
    $s = ltrim(pack('N', $len), "\x00");
    return chr(0x80 | strlen($s)) . $s;
}

/** Convierte un JWK RSA (n, e) a PEM de clave pública */
function vs_jwk_to_pem(array $jwk): ?string {
    if (($jwk['kty'] ?? '') !== 'RSA' || empty($jwk['n']) || empty($jwk['e'])) return null;
    $n = vs_b64url_decode($jwk['n']);
    $e = vs_b64url_decode($jwk['e']);

    // INTEGER n (con byte 0x00 prefijo si el primer bit es 1, para marcar positivo)
    $nEnc = (ord($n[0]) & 0x80) ? "\x00" . $n : $n;
    $intN = "\x02" . vs_asn1_len(strlen($nEnc)) . $nEnc;
    $intE = "\x02" . vs_asn1_len(strlen($e))    . $e;

    // SEQUENCE { n, e }
    $rsaKey = "\x30" . vs_asn1_len(strlen($intN) + strlen($intE)) . $intN . $intE;

    // AlgorithmIdentifier { rsaEncryption, NULL }
    $algoId = "\x30\x0d" . "\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01" . "\x05\x00";

    // BIT STRING con 0 unused bits + rsaKey
    $bitStr = "\x03" . vs_asn1_len(strlen($rsaKey) + 1) . "\x00" . $rsaKey;

    // SubjectPublicKeyInfo
    $spki = "\x30" . vs_asn1_len(strlen($algoId) + strlen($bitStr)) . $algoId . $bitStr;

    return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($spki), 64, "\n") . "-----END PUBLIC KEY-----\n";
}

/**
 * Verifica id_token de Google y devuelve payload si es válido, null si no.
 * Valida: firma RS256 con clave de JWKS cuyo kid coincide, aud, iss, exp, iat, email_verified.
 */
function vs_google_verify_id_token(string $id_token, string $client_id): ?array {
    $parts = explode('.', $id_token);
    if (count($parts) !== 3) return null;

    [$h_b64, $p_b64, $s_b64] = $parts;
    $header  = json_decode(vs_b64url_decode($h_b64), true);
    $payload = json_decode(vs_b64url_decode($p_b64), true);
    $sig_bin = vs_b64url_decode($s_b64);
    if (!is_array($header) || !is_array($payload)) return null;

    if (($header['alg'] ?? '') !== 'RS256') return null;
    $kid = $header['kid'] ?? '';
    if ($kid === '') return null;

    $jwks = vs_google_jwks();
    if (!$jwks) return null;

    $jwk = null;
    foreach ($jwks['keys'] as $k) {
        if (($k['kid'] ?? '') === $kid) { $jwk = $k; break; }
    }
    if (!$jwk) return null;

    $pem = vs_jwk_to_pem($jwk);
    if (!$pem) return null;

    $signing_input = $h_b64 . '.' . $p_b64;
    $ok = openssl_verify($signing_input, $sig_bin, $pem, OPENSSL_ALGO_SHA256);
    if ($ok !== 1) return null;

    // Validación de claims
    $now = time();
    if (($payload['aud'] ?? '') !== $client_id) return null;
    $iss = $payload['iss'] ?? '';
    if (!in_array($iss, ['accounts.google.com', 'https://accounts.google.com'], true)) return null;
    if ((int)($payload['exp'] ?? 0) <= $now - 30) return null;      // 30s de tolerancia
    if ((int)($payload['iat'] ?? 0) > $now + 30)  return null;
    $ev = $payload['email_verified'] ?? false;
    $email_verified = ($ev === true || $ev === 'true' || $ev === '1');
    if (!$email_verified) return null;
    if (empty($payload['sub']) || empty($payload['email'])) return null;

    return $payload;
}
