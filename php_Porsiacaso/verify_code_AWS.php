<?php
// Conectar a la base de datos
$con = mysqli_connect(
    "americastowersimulator.c14c80caytj6.us-east-1.rds.amazonaws.com", 
    "admin", 
    "Controlador2929", 
    "simulador(unity-access)" // Usar comillas invertidas si AWS lo permite
);
// Verificar la conexión
if (mysqli_connect_errno()) {
    echo "Error de conexión a la base de datos.";
    exit();
}

// Obtener el código de verificación desde el formulario
$verification_code = mysqli_real_escape_string($con, $_POST['verification_code']);

// Buscar el código de verificación en la base de datos
$query = "SELECT verification_code, verified, code_expiry FROM users WHERE verification_code = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "s", $verification_code);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

// Si no se encuentra el código
if (mysqli_stmt_num_rows($stmt) == 0) {
    echo "1"; // Código no encontrado
    exit(); // Detener la ejecución
}

mysqli_stmt_bind_result($stmt, $stored_code, $verified, $code_expiry);
mysqli_stmt_fetch($stmt);

// Verificar si el código ya está verificado
if ($verified == 1) {
    echo "2"; // El código ya ha sido verificado anteriormente
    exit();
}

// Verificar si el código ha expirado
if (strtotime($code_expiry) > time()) {
    // Código válido, actualizar el estado de verificación a 1
    $update_query = "UPDATE users SET verified = 1 WHERE verification_code = ?";
    $update_stmt = mysqli_prepare($con, $update_query);
    mysqli_stmt_bind_param($update_stmt, "s", $verification_code);
    mysqli_stmt_execute($update_stmt);

    echo "0"; // Código verificado correctamente
    exit();
} else {
    echo "1"; // Código expirado
    exit();
}

mysqli_stmt_close($stmt);
mysqli_close($con);
?>