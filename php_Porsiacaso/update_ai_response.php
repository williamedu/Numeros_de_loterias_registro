<?php
// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

if (mysqli_connect_errno()) {
    echo "3"; // Error de conexión a la base de datos
    exit();
}

$exercise_id = mysqli_real_escape_string($con, $_POST["exercise_id"]);
$AI_response = mysqli_real_escape_string($con, $_POST["AI_response"]);

// Actualizar AI_response en la tabla
$query = "UPDATE exercise_results SET AI_response = ? WHERE exercise_id = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "si", $AI_response, $exercise_id);

if (mysqli_stmt_execute($stmt)) {
    echo "0"; // Éxito
} else {
    echo "2"; // Error al actualizar AI_response
}

mysqli_stmt_close($stmt);
mysqli_close($con);
?>
