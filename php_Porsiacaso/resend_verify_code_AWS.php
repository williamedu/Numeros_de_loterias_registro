<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';  // Si usas Composer

// Conectar a la base de datos
$con = mysqli_connect(
    "americastowersimulator.c14c80caytj6.us-east-1.rds.amazonaws.com", 
    "admin", 
    "Controlador2929", 
    "simulador(unity-access)" // Usar comillas invertidas si AWS lo permite
);

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo "4"; // Error de conexión a la base de datos
    exit();
}

// Recoger el correo del formulario
$email = mysqli_real_escape_string($con, $_POST["email"]);

// Verificar si el correo está en la base de datos
$query = "SELECT verification_code, code_expiry, verified FROM users WHERE email = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) === 0) {
    echo "1"; // No está el correo en la base de datos
    exit();
}

mysqli_stmt_bind_result($stmt, $verification_code, $code_expiry, $verified);
mysqli_stmt_fetch($stmt);

$currentTime = date("Y-m-d H:i:s");

// Primero, verificar si el usuario ya está verificado
if ($verified == 1) {
    echo "2"; // Usuario ya verificado
    exit();
}

// Luego, verificar si el código ha expirado o no
if ($code_expiry > $currentTime) {
    echo "3"; // El código aún no ha expirado
    exit();
}

// Si el código ha expirado, generar uno nuevo y reenviar
$new_verification_code = random_int(100000, 999999);
$new_code_expiry = date("Y-m-d H:i:s", strtotime("+24 hours"));

// Actualizar el nuevo código en la base de datos
$updateQuery = "UPDATE users SET verification_code = ?, code_expiry = ? WHERE email = ?";
$updateStmt = mysqli_prepare($con, $updateQuery);
mysqli_stmt_bind_param($updateStmt, "iss", $new_verification_code, $new_code_expiry, $email);
mysqli_stmt_execute($updateStmt);
mysqli_stmt_close($updateStmt);

// Enviar el nuevo código por correo
if (sendVerificationEmail($email, $new_verification_code)) {
    echo "0";  // Código reenviado con éxito
} else {
    echo "5";  // Error al enviar el correo
}

mysqli_stmt_close($stmt);
mysqli_close($con);

// Función para enviar el correo de verificación
function sendVerificationEmail($toEmail, $verificationCode) {
    $mail = new PHPMailer(true);

    try {
        // Configuración del servidor SMTP
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'williamhiciano26@gmail.com';  // Tu correo
        $mail->Password   = 'emdn gegi hyyj wmih';  // Contraseña de aplicación
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        // Configuración del remitente y destinatario
        $mail->setFrom('williamhiciano26@gmail.com', 'William Hicano');
        $mail->addAddress($toEmail);

        // Contenido del correo
        $mail->isHTML(true);
        $mail->Subject = 'Resend Verification Code';
        $mail->Body    = 'Your new verification code is: <b>' . $verificationCode . '</b>';
        $mail->AltBody = 'Your new verification code is: ' . $verificationCode;

        // Enviar el correo
        if ($mail->send()) {
            return true;  // El correo fue enviado correctamente
        } else {
            return false;  // Hubo un error al enviar el correo
        }

    } catch (Exception $e) {
        error_log("Error al enviar el correo: " . $mail->ErrorInfo);
        return false;
    }
}
?>
