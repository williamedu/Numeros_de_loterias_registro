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

// Consulta para obtener todos los registros de la tabla
$query = "SELECT exercise_id, name_exercise, name, last_name, dept, landed, mistakes_L, mistakes_S, score, exercise_duration, username, submission_time FROM exercise_results";

// Ejecutar la consulta
$result = mysqli_query($con, $query);

// Verificar si la consulta fue exitosa
if (!$result) {
    echo json_encode(array("error" => "Error executing query"));
    exit();
}

// Crear un array para almacenar los resultados
$exerciseData = array();

// Procesar los datos recibidos
while ($row = mysqli_fetch_assoc($result)) {
    $exerciseData[] = array(
        'exercise_id' => $row['exercise_id'],
        'name_exercise' => $row['name_exercise'],
        'name' => $row['name'],
        'last_name' => $row['last_name'],
        'dept' => $row['dept'],
        'landed' => $row['landed'],
        'mistakes_L' => $row['mistakes_L'],
        'mistakes_S' => $row['mistakes_S'],
        'score' => $row['score'],
        'exercise_duration' => $row['exercise_duration'],
        'username' => $row['username'],
        'submission_time' => $row['submission_time']
    );
}

// Convertir el array a JSON y imprimirlo
echo json_encode(array("dataList" => $exerciseData));

// Cerrar la conexión
mysqli_close($con);
?>
