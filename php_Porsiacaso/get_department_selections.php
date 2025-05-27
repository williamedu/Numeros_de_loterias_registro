<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Conexión a la base de datos en AWS RDS
$servername = "americastowersimulator.c14c80caytj6.us-east-1.rds.amazonaws.com";
$username = "admin";
$password = "Controlador2929";
$dbname = "simulador(unity-access)";

// Conectar a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Error de conexión: " . $conn->connect_error]));
}

// Obtener los datos enviados desde Unity
if (!isset($_GET["username"]) || !isset($_GET["beginDate"]) || !isset($_GET["endDate"])) {
    die(json_encode(["status" => "error", "message" => "Faltan parámetros requeridos"]));
}

$username = $_GET["username"];
$beginDate = $_GET["beginDate"];
$endDate = $_GET["endDate"];
$fechaJson = json_encode([$beginDate, $endDate], JSON_UNESCAPED_SLASHES); // Formato JSON de fechas

// Obtener el departamento del usuario
$queryDept = "SELECT departamento FROM usuarios_comida WHERE usuario = ?";
$stmt = $conn->prepare($queryDept);
$stmt->bind_param("s", $username);
$stmt->execute();
$resultDept = $stmt->get_result();

if ($resultDept->num_rows == 0) {
    die(json_encode(["status" => "error", "message" => "Usuario no encontrado"]));
}

$userData = $resultDept->fetch_assoc();
$departamento = $userData["departamento"];

// Contar cuántos compañeros pertenecen al mismo departamento
$queryTotal = "SELECT COUNT(*) AS totalCompañeros FROM usuarios_comida WHERE departamento = ?";
$stmt = $conn->prepare($queryTotal);
$stmt->bind_param("s", $departamento);
$stmt->execute();
$resultTotal = $stmt->get_result();
$totalCompañeros = ($resultTotal->num_rows > 0) ? $resultTotal->fetch_assoc()["totalCompañeros"] : 0;

// Contar cuántos ya hicieron su selección en ese período
$querySeleccionados = "SELECT COUNT(*) AS seleccionados FROM seleccion_usuarios 
WHERE departamento = ? AND fecha = ?";
$stmt = $conn->prepare($querySeleccionados);
$stmt->bind_param("ss", $departamento, $fechaJson);
$stmt->execute();
$resultSeleccionados = $stmt->get_result();
$seleccionados = ($resultSeleccionados->num_rows > 0) ? $resultSeleccionados->fetch_assoc()["seleccionados"] : 0;

// Respuesta JSON para Unity
$response = [
    "status" => "success",
    "data" => [
        "totalCompañeros" => $totalCompañeros,
        "seleccionados" => $seleccionados
    ]
];

echo json_encode($response);

// Cerrar conexión
$stmt->close();
$conn->close();
?>
