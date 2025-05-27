<?php
// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)", 3307);

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo "3"; // Error code #3 = problema con la conexión a la base de datos
    exit();
}

// Recoger el código y el correo electrónico enviado desde Unity
$email = mysqli_real_escape_string($con, $_POST["email"]);
$code = mysqli_real_escape_string($con, $_POST["code"]);

// Buscar el user_id asociado con el correo electrónico
$emailcheckquery = "SELECT id FROM users WHERE email = ?";
$stmt = mysqli_prepare($con, $emailcheckquery);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
mysqli_stmt_bind_result($stmt, $user_id);
mysqli_stmt_fetch($stmt);
mysqli_stmt_close($stmt);

if (!$user_id) {
    echo "2"; // El correo no está registrado
    exit();
}

// Verificar si el código ingresado coincide con el de la tabla password_reset y no ha expirado
$codecheckquery = "SELECT reset_code, code_expiry FROM password_reset WHERE user_id = ? AND reset_code = ?";
$stmt = mysqli_prepare($con, $codecheckquery);
mysqli_stmt_bind_param($stmt, "ii", $user_id, $code);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) == 0) {
    echo "1"; // El código no coincide
    exit();
}

mysqli_stmt_bind_result($stmt, $reset_code, $code_expiry);
mysqli_stmt_fetch($stmt);

// Verificar si el código ha expirado
if (strtotime($code_expiry) < time()) {
    echo "5"; // El código ha expirado
    exit();
}

echo "0"; // Código válido
mysqli_stmt_close($stmt);
mysqli_close($con);
?>
