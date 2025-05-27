<?php
// Conectar a la base de datos
$con = mysqli_connect(
    "americastowersimulator.c14c80caytj6.us-east-1.rds.amazonaws.com", 
    "admin", 
    "Controlador2929", 
    "simulador(unity-access)" // Usar comillas invertidas si AWS lo permite
);
// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo "3"; // Error code #3 = problema con la conexión a la base de datos
    exit();
}

// Recoger el correo electrónico y la nueva contraseña desde Unity
$email = mysqli_real_escape_string($con, $_POST["email"]);
$password = $_POST["password"];

// Verificar si el correo existe en la base de datos
$emailcheckquery = "SELECT id FROM users WHERE email = ?";
$stmt = mysqli_prepare($con, $emailcheckquery);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
mysqli_stmt_bind_result($stmt, $user_id);
mysqli_stmt_fetch($stmt);
mysqli_stmt_close($stmt);

if (!$user_id) {
    echo "1"; // El correo no fue encontrado
    exit();
}

// Encriptar la nueva contraseña
$hash = password_hash($password, PASSWORD_DEFAULT);

// Actualizar la contraseña en la base de datos
$updatequery = "UPDATE users SET hash = ? WHERE id = ?";
$stmt = mysqli_prepare($con, $updatequery);
mysqli_stmt_bind_param($stmt, "si", $hash, $user_id);

if (mysqli_stmt_execute($stmt)) {
    echo "0"; // Éxito al cambiar la contraseña
} else {
    echo "2"; // Hubo un problema al cambiar la contraseña
}

mysqli_stmt_close($stmt);
mysqli_close($con);
?>
