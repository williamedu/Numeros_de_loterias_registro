<?php
$con = mysqli_connect(
    "americastowersimulator.c14c80caytj6.us-east-1.rds.amazonaws.com", 
    "admin", 
    "Controlador2929", 
    "simulador(unity-access)" // Usar comillas invertidas si AWS lo permite
);
// Verificar la conexión
if (mysqli_connect_errno()) {
    echo "1"; // Error code #1 = connection failed
    exit();
}

$username = mysqli_real_escape_string($con, $_POST["name"]);
$password = $_POST["password"];

// Verificar si el usuario existe
$usercheckquery = "SELECT username, hash FROM users WHERE username = ?";
$stmt = mysqli_prepare($con, $usercheckquery);
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) != 1) {
    echo "2"; // Error code #1 - usuario no existe
    exit();
}

// Obtener la información de login
$user = mysqli_fetch_assoc($result);
$hash = $user["hash"];

// Verificar la contraseña
if (password_verify($password, $hash)) {
    echo "0"; // Login exitoso
} else {
    echo "3"; // Contraseña incorrecta
}

mysqli_close($con);
?>
