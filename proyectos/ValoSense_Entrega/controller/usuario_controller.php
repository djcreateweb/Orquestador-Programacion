<?php
function home(){
    session_start();
    if (isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=matchmaker&action=home');
        exit();
    }
    $message = "";
    require_once("view/usuario_view.php");
}

function login(){
    session_start();
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $message = "";
    if (isset($_POST["login"])) {
        $user = isset($_POST["nombre"]) ? $_POST["nombre"] : "";
        $pass = isset($_POST["pswd"]) ? $_POST["pswd"] : "";
        $registro = $model->login($user, $pass);
        if ($registro) {
            $_SESSION["usuario"] = $registro;
            header('Location: index.php?controlador=matchmaker&action=home');
            exit();
        }
        $message = "Usuario o contraseÃ±a incorrectos";
    }
    require_once("view/usuario_view.php");
}

function registro(){
    session_start();
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $message = "";
    if (isset($_POST["registrar"])) {
        $user = isset($_POST["nombre"]) ? $_POST["nombre"] : "";
        $pass = isset($_POST["pswd"]) ? $_POST["pswd"] : "";
        $rango = "Sin clasificar";
        $email = isset($_POST["email"]) && $_POST["email"] != "" ? $_POST["email"] : $user . "@valosense.local";
        if ($user == "" || $pass == "") {
            $message = "Rellena todos los campos";
        } else {
            $ok = $model->registro($user, $email, $pass, $rango, "EU");
            if ($ok) {
                $message = "Cuenta creada correctamente, ya puedes iniciar sesiÃ³n";
            } else {
                $message = "Ese nombre de usuario ya estÃ¡ en uso";
            }
        }
    }
    require_once("view/usuario_view.php");
}

function gestionar(){
    session_start();
    if (!isset($_SESSION["usuario"]) || empty($_SESSION["usuario"]["es_admin"])) {
        header('Location: index.php?controlador=matchmaker&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $message = "";
    if (isset($_POST["borrar"])) {
        $id = isset($_POST["id"]) ? $_POST["id"] : "";
        if ($id != "" && $id != $_SESSION["usuario"]["id"]) {
            $model->borrar($id);
        }
        header('Location: index.php?controlador=usuario&action=gestionar');
        exit();
    }
    $array = $model->get_usuarios();
    require_once("view/gestiona_usuario_view.php");
}

function vincular(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    header('Location: index.php?controlador=usuario&action=completar_perfil');
    exit();
}

function ajustes(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $user = $model->get_by_id($_SESSION["usuario"]["id"]);
    $amigos = $model->get_amigos($_SESSION["usuario"]["id"]);
    $rangos = [
        'Sin clasificar',
        'Iron 1',
        'Iron 2',
        'Iron 3',
        'Bronze 1',
        'Bronze 2',
        'Bronze 3',
        'Silver 1',
        'Silver 2',
        'Silver 3',
        'Gold 1',
        'Gold 2',
        'Gold 3',
        'Platinum 1',
        'Platinum 2',
        'Platinum 3',
        'Diamond 1',
        'Diamond 2',
        'Diamond 3',
        'Ascendant 1',
        'Ascendant 2',
        'Ascendant 3',
        'Immortal 1',
        'Immortal 2',
        'Immortal 3',
        'Radiant',
    ];
    $regiones = ['EU', 'NA', 'LATAM', 'BR', 'AP', 'KR'];
    $message = "";
    require_once("view/ajustes_view.php");
}

function cambiar_presencia(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $estado = isset($_POST["estado"]) ? $_POST["estado"] : "";
    if ($estado != "") {
        $ok = $model->actualizar_estado_presencia($_SESSION["usuario"]["id"], $estado);
        if ($ok) {
            $_SESSION["usuario"]["estado_presencia"] = $estado;
        }
    }
    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

function cambiar_password(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $actual = isset($_POST["actual"]) ? $_POST["actual"] : "";
    $nueva = isset($_POST["nueva"]) ? $_POST["nueva"] : "";
    $confirmar = isset($_POST["confirmar"]) ? $_POST["confirmar"] : "";
    if ($actual == "" || $nueva == "" || $confirmar == "") {
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    if ($nueva != $confirmar) {
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    $model->cambiar_password($_SESSION["usuario"]["id"], $actual, $nueva);
    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

function editar_datos(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $username = isset($_POST["username"]) ? $_POST["username"] : "";
    $email = isset($_POST["email"]) ? $_POST["email"] : "";
    $rango = isset($_POST["rango"]) ? $_POST["rango"] : "";
    $region = isset($_POST["region"]) ? $_POST["region"] : "";
    if ($username == "" || $email == "" || $rango == "" || $region == "") {
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    $perfil_completo = $rango == "Sin clasificar" ? "no" : "si";
    $ok = $model->update($username, $email, $rango, $region, $perfil_completo, $_SESSION["usuario"]["id"]);
    if ($ok) {
        $_SESSION["usuario"]["username"] = $username;
        $_SESSION["usuario"]["email"] = $email;
        $_SESSION["usuario"]["rango"] = $rango;
        $_SESSION["usuario"]["region"] = $region;
        $_SESSION["usuario"]["perfil_completo"] = $perfil_completo;
    }
    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

function cambiar_visibilidad_riot(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $visible = isset($_POST["riot_id_visible"]) ? 1 : 0;
    $ok = $model->actualizar_visibilidad_riot($_SESSION["usuario"]["id"], $visible);
    if ($ok) {
        $_SESSION["usuario"]["riot_id_visible"] = $visible;
    }
    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

function eliminar_cuenta(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $password_confirm = isset($_POST["password_confirm"]) ? $_POST["password_confirm"] : "";
    if ($password_confirm == "") {
        header('Location: index.php?controlador=usuario&action=ajustes');
        exit();
    }
    $ok = $model->eliminar_cuenta($_SESSION["usuario"]["id"], $password_confirm);
    if ($ok) {
        session_destroy();
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    header('Location: index.php?controlador=usuario&action=ajustes');
    exit();
}

function desconectar(){
    session_start();
    session_destroy();
    header('Location: index.php');
    exit();
}

function completar_perfil(){
    session_start();
    if (!isset($_SESSION["usuario"])) {
        header('Location: index.php?controlador=usuario&action=home');
        exit();
    }
    require_once("model/usuario_model.php");
    $model = new Usuario_model();
    $message = "";
    if (isset($_POST["guardar_perfil"])) {
        $id = $_SESSION["usuario"]["id"];
        $riot_id = isset($_POST["riot_id"]) ? trim($_POST["riot_id"]) : "";
        $riot_tag = isset($_POST["riot_tag"]) ? trim($_POST["riot_tag"]) : "";
        $riot_region = isset($_POST["riot_region"]) ? trim($_POST["riot_region"]) : "";
        $rango = isset($_POST["rango"]) ? trim($_POST["rango"]) : "Sin clasificar";
        $rango_rr = isset($_POST["rango_rr"]) ? (int) $_POST["rango_rr"] : 0;
        if (empty($riot_id) || empty($riot_tag) || empty($riot_region) || $rango === 'Sin clasificar') {
            $message = "Rellena todos los campos del perfil";
        } else {
            $ok = $model->completar_perfil($id, $riot_id, $riot_tag, $riot_region, $rango, $rango_rr);
            if ($ok) {
                $_SESSION["usuario"]["perfil_completo"] = "si";
                $_SESSION["usuario"]["rango"] = $rango;
                $_SESSION["usuario"]["riot_id"] = $riot_id;
                $_SESSION["usuario"]["riot_tag"] = $riot_tag;
                $_SESSION["usuario"]["riot_region"] = $riot_region;
                header('Location: index.php?controlador=usuario&action=ajustes');
                exit();
            } else {
                $message = "Error al guardar el perfil";
            }
        }
    }
    require_once("view/completar_perfil_view.php");
}
?>
