<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Conectar a la base de datos AWS
$con = mysqli_connect("americastowersimulator.c14c80caytj6.us-east-1.rds.amazonaws.com", "admin", "Controlador2929", "simulador(unity-access)");

// Verificar conexión
if (mysqli_connect_errno()) {
    echo json_encode(["error" => "ERROR_DB"]);
    exit();
}

// Obtener el departamento enviado desde Unity
$departamento = $_POST["departamento"] ?? null;

if (!$departamento) {
    echo json_encode(["error" => "Faltan parámetros requeridos"]);
    exit();
}

// Consulta para obtener el menú activo del departamento especificado
$query = "SELECT periodo, menus_opciones FROM registro_comidas WHERE status = 'activo' AND departamento = '$departamento' LIMIT 1";
$result = mysqli_query($con, $query);

if ($row = mysqli_fetch_assoc($result)) {
    $periodo = json_decode($row['periodo'], true); // Convertir fechas a array
    $menu = json_decode($row['menus_opciones'], true); // Convertir menú a array

    // Devolver JSON con las fechas y el menú
    echo json_encode([
        "fechas" => $periodo,
        "menu" => $menu
    ]);
} else {
    echo json_encode(["error" => "NO_ACTIVE_MENU"]); // Si no hay menú activo para ese departamento
}

mysqli_close($con);
?>

