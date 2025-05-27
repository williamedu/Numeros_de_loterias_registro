<?php
// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo json_encode(["error" => "Error de conexión a la base de datos"]);
    exit();
}

// Recoger el ID del ejercicio
$exercise_id = mysqli_real_escape_string($con, $_POST["exercise_id"]);

// Obtener mistakes_S y AI_response
$query = "SELECT mistakes_S, AI_response FROM exercise_results WHERE exercise_id = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "i", $exercise_id);
mysqli_stmt_execute($stmt);
mysqli_stmt_bind_result($stmt, $mistakes_S, $AI_response);
mysqli_stmt_fetch($stmt);
mysqli_stmt_close($stmt);
mysqli_close($con);

// Devolver los datos en formato JSON
echo json_encode([
    "mistakes_S" => $mistakes_S,
    "AI_response" => $AI_response
]);
