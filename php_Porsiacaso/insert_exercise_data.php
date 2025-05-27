<?php
// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo "3"; // Error de conexión a la base de datos
    exit();
}

// Recoger los datos del formulario enviados desde Unity
$username = mysqli_real_escape_string($con, $_POST["username"]);
$dept_planes = (int)$_POST["dept_planes"];
$landed = (int)$_POST["landed"];
$name_exercise = mysqli_real_escape_string($con, $_POST["name_exercise"]);
$score = (int)$_POST["score"];
$exercise_duration = mysqli_real_escape_string($con, $_POST["time_exercise"]);
$mistakes_L = (int)$_POST["mistakes_L"];
$mistakes_S = mysqli_real_escape_string($con, $_POST["mistakes_S"]);

// Verificar si el nombre de usuario existe y obtener su ID, nombre y apellido
$query = "SELECT id, name, lastname FROM users WHERE username = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) == 0) {
    echo "1"; // El nombre de usuario no existe
    exit();
}

mysqli_stmt_bind_result($stmt, $user_id, $name, $lastname);
mysqli_stmt_fetch($stmt);
mysqli_stmt_close($stmt);

// Concatenar el nombre de usuario en PHP
$generated_username = $name . '.' . $lastname;

// Determinar si pasó o no
$pass = ($score >= 70) ? "YES" : "NO";

// Insertar los datos del ejercicio en la tabla 'exercise_results'
$insert_query = "INSERT INTO exercise_results (user_id, name_exercise, name, last_name, username, dept, landed, score, exercise_duration, pass, mistakes_L, mistakes_S)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$insert_stmt = mysqli_prepare($con, $insert_query);
mysqli_stmt_bind_param($insert_stmt, "issssiiissis", $user_id, $name_exercise, $name, $lastname, $generated_username, $dept_planes, $landed, $score, $exercise_duration, $pass, $mistakes_L, $mistakes_S);

if (mysqli_stmt_execute($insert_stmt)) {
    echo "0"; // Éxito
} else {
    echo "2"; // Error al insertar los datos del ejercicio
}

mysqli_stmt_close($insert_stmt);
mysqli_close($con);