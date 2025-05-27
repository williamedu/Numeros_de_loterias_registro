<?php
// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo "3"; // Error de conexión a la base de datos
    exit();
}

// Recoger el ID del ejercicio enviado desde Unity
$exercise_id = mysqli_real_escape_string($con, $_POST["exercise_id"]);

// Consulta para verificar si hay respuesta en AI_response
$query = "SELECT AI_response FROM exercise_results WHERE exercise_id = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "i", $exercise_id);
mysqli_stmt_execute($stmt);
mysqli_stmt_bind_result($stmt, $AI_response);
mysqli_stmt_fetch($stmt);

if (empty($AI_response)) {
    echo "0"; // No hay respuesta en la columna AI_response
} else {
    echo $AI_response; // Devolver la respuesta existente
}

mysqli_stmt_close($stmt);
mysqli_close($con);
?>
