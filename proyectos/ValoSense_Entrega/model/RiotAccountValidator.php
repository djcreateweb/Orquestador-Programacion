<?php
// Valida una cuenta de Valorant contra la API de HenrikDev
class RiotAccountValidator {

    // Comprueba si la cuenta existe y devuelve sus datos o false
    public static function validar($riot_id, $tag){
        require_once("model/config.php");
        $url = "https://api.henrikdev.xyz/valorant/v1/account/"
             . urlencode($riot_id) . "/" . urlencode($tag);
        $contexto = stream_context_create([
            "http" => [
                "header"  => "Authorization: " . RIOT_API_KEY . "\r\n",
                "timeout" => 8
            ],
            "ssl" => [
                "verify_peer"      => false,
                "verify_peer_name" => false
            ]
        ]);
        $respuesta = @file_get_contents($url, false, $contexto);
        if ($respuesta === false) return false;
        $datos = json_decode($respuesta, true);
        if (empty($datos["data"]["puuid"])) return false;
        // Devuelve puuid y región de la cuenta
        return $datos["data"];
    }
}
?>
