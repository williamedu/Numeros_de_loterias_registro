<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)", 3307);

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo json_encode(array("error" => "3")); // Error de conexión a la base de datos
    exit();
}

// Recoger los datos enviados desde Unity
$username = mysqli_real_escape_string($con, $_POST["username"]);
$isAdmin = isset($_POST["isAdmin"]) ? (int)$_POST["isAdmin"] : 0;

// Si el usuario es administrador, obtener todos los registros
if ($isAdmin) {
    $query = "SELECT exercise_id, name_exercise, name, last_name, dept, landed, mistakes_L, mistakes_S, score, exercise_duration, username, submission_time FROM exercise_results";
} else {
    $query = "SELECT exercise_id, name_exercise, name, last_name, dept, landed, mistakes_L, mistakes_S, score, exercise_duration, username, submission_time FROM exercise_results WHERE username = ?";
}


// Preparar la consulta
$stmt = mysqli_prepare($con, $query);

if (!$isAdmin) {
    // Solo enlazar el username si no es administrador
    mysqli_stmt_bind_param($stmt, "s", $username);
}

mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

// Crear un array para almacenar los resultados
$exerciseData = array();

// Procesar los datos recibidos
while ($row = mysqli_fetch_assoc($result)) {
    $exerciseData[] = array(
        'submission_time' => $row['submission_time'],
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
        'username' => $row['username']
        
    );
}


// Aquí es donde debes colocar el código para enviar la respuesta JSON
echo json_encode(array("dataList" => $exerciseData));

// Cerrar la conexión
mysqli_close($con);
?>
