<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Conectar a la base de datos AWS RDS
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

// Obtener datos enviados desde Unity
$username = $_POST["username"] ?? null;
$fechaInicio = $_POST["fecha_inicio"] ?? null;
$fechaFinal = $_POST["fecha_final"] ?? null;

// Validar datos requeridos
if (!$username || !$fechaInicio || !$fechaFinal) {
    die(json_encode(["status" => "error", "message" => "Faltan parámetros requeridos"]));
}

// Consulta para verificar si existe una selección para ese usuario en el período dado
$query = "SELECT seleccion FROM seleccion_usuarios 
          WHERE usuario = '$username' 
          AND (JSON_CONTAINS(fecha, JSON_QUOTE('$fechaInicio')) OR JSON_CONTAINS(fecha, JSON_QUOTE('$fechaFinal')))";

$result = $conn->query($query);

// Verificar si se encontró un registro válido
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode(["status" => "success", "seleccion_menu" => json_decode($row["seleccion"])]);
} else {
    // No hay selección para este usuario en este período
    echo json_encode(["status" => "success", "seleccion_menu" => []]);
}

// Cerrar conexión
$conn->close();
?>



