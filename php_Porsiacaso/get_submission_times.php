<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo json_encode(array("error" => "3")); // Error de conexión a la base de datos
    exit();
}

// Consulta para obtener solo los valores de submission_time
$query = "SELECT submission_time FROM exercise_results";

// Ejecutar la consulta
$result = mysqli_query($con, $query);

// Verificar si la consulta fue exitosa
if (!$result) {
    echo json_encode(array("error" => "Error executing query"));
    exit();
}

// Crear un array para almacenar los resultados
$submissionTimes = array();

// Procesar los datos recibidos
while ($row = mysqli_fetch_assoc($result)) {
    $submissionTimes[] = array(
        'submission_time' => $row['submission_time']
    );
}

// Convertir el array a JSON y enviarlo
echo json_encode(array("dataList" => $submissionTimes));

// Cerrar la conexión
mysqli_close($con);
?>
