<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';  // Cargar PHPMailer y dependencias

// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)", 3307);

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo "3"; // Error code #3 = problema con la conexión a la base de datos
    exit();
}

// Recoger el correo electrónico enviado desde Unity
$email = mysqli_real_escape_string($con, $_POST["email"]);

// Verificar si el correo existe en la base de datos
$emailcheckquery = "SELECT id, verified FROM users WHERE email = ?";
$stmt = mysqli_prepare($con, $emailcheckquery);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) == 0) {
    echo "2"; // El correo no está registrado en la base de datos
    exit();
}

mysqli_stmt_bind_result($stmt, $user_id, $verified);
mysqli_stmt_fetch($stmt);

if ($verified == 0) {
    echo "1"; // El correo no está verificado
    exit();
}

mysqli_stmt_close($stmt);

// Si el correo está verificado, generar un código de cambio de contraseña
$reset_code = random_int(100000, 999999);  // Generar un código de 6 dígitos
$code_expiry = date("Y-m-d H:i:s", strtotime("+15 minutes"));  // El código expira en 15 minutos

// Verificar si el usuario ya tiene un código en la tabla password_reset
$resetcheckquery = "SELECT id FROM password_reset WHERE user_id = ?";
$stmt = mysqli_prepare($con, $resetcheckquery);
mysqli_stmt_bind_param($stmt, "i", $user_id);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) > 0) {
    // Si ya existe un registro para el usuario, actualizar el código y la expiración
    $updateresetquery = "UPDATE password_reset SET reset_code = ?, code_expiry = ? WHERE user_id = ?";
    $stmt = mysqli_prepare($con, $updateresetquery);
    mysqli_stmt_bind_param($stmt, "isi", $reset_code, $code_expiry, $user_id);
    if (!mysqli_stmt_execute($stmt)) {
        echo "3"; // Problema al actualizar el código en la base de datos
        exit();
    }
} else {
    // Si no existe un registro, insertar uno nuevo
    $insertresetquery = "INSERT INTO password_reset (user_id, reset_code, code_expiry) VALUES (?, ?, ?)";
    $stmt = mysqli_prepare($con, $insertresetquery);
    mysqli_stmt_bind_param($stmt, "iis", $user_id, $reset_code, $code_expiry);
    if (!mysqli_stmt_execute($stmt)) {
        echo "3"; // Problema al insertar el código en la base de datos
        exit();
    }
}
mysqli_stmt_close($stmt);

// Enviar el código de cambio de contraseña por correo
if (!sendPasswordResetEmail($email, $reset_code)) {
    echo "3";  // Error al enviar el correo
    exit();
}

echo "0"; // Éxito

// Función para enviar el correo con el código de cambio de contraseña
function sendPasswordResetEmail($toEmail, $resetCode) {
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'williamhiciano26@gmail.com';  // Tu correo
        $mail->Password   = 'emdn gegi hyyj wmih';  // Contraseña de aplicación
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom('williamhiciano26@gmail.com', 'William Hicano');
        $mail->addAddress($toEmail);

        $mail->isHTML(true);
        $mail->Subject = 'Change Password Code';
        $mail->Body    = 'Your change password code is: <b>' . $resetCode . '</b>';
        $mail->AltBody = 'Your change password code is: ' . $resetCode;

        return $mail->send();
    } catch (Exception $e) {
        error_log("Error al enviar el correo: " . $mail->ErrorInfo);
        return false;
    }
}

mysqli_close($con);
?>

