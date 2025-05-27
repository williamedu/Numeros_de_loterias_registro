<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Mostrar errores y guardar logs
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Verificar si hay conexión a Internet antes de continuar
if (!checkInternetConnection()) {
    echo "10"; // No hay conexión a Internet
    exit();
}

// Incluir las dependencias de PHPMailer
require 'vendor/autoload.php';  // Si usas Composer

// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)", 3307);

// Verificar si la conexión falló
if (mysqli_connect_errno()) {
    echo "1"; // Error code #1 = connection failed
    error_log("Error de conexión a la base de datos: " . mysqli_connect_error());
    exit();
}

// Recoger los datos del formulario
$name = mysqli_real_escape_string($con, $_POST["name"]);
$lastname = mysqli_real_escape_string($con, $_POST["lastname"]);
$username = mysqli_real_escape_string($con, $_POST["username"]);
$password = $_POST["password"];
$gender = mysqli_real_escape_string($con, $_POST["gender"]);
$age = mysqli_real_escape_string($con, $_POST["age"]);
$email = mysqli_real_escape_string($con, $_POST["email"]);
$country = mysqli_real_escape_string($con, $_POST["country"]); // Recoger el campo de nacionalidad
$verified = 0; // Usuario por defecto no verificado

// Generar un código de verificación aleatorio de 6 dígitos
$verification_code = random_int(100000, 999999);

// Generar el tiempo de expiración del código de verificación (24 horas a partir de ahora)
$code_expiry = date("Y-m-d H:i:s", strtotime("+24 hours"));


// Verificar si el nombre de usuario ya existe
$namecheckquery = "SELECT username FROM users WHERE username = ?";
$stmt = mysqli_prepare($con, $namecheckquery);
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) > 0) {
    echo "3"; // Error code #3 - el nombre de usuario ya existe
    error_log("Error: El nombre de usuario '$username' ya existe.");
    mysqli_stmt_close($stmt); // Cerrar la consulta
    exit();
}

// Verificar si el correo electrónico ya está registrado
$emailcheckquery = "SELECT email FROM users WHERE email = ?";
$stmt = mysqli_prepare($con, $emailcheckquery);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
mysqli_stmt_store_result($stmt);

if (mysqli_stmt_num_rows($stmt) > 0) {
    echo "9"; // El correo electrónico ya está registrado
    mysqli_stmt_close($stmt); // Cerrar la consulta
    exit();
}

mysqli_stmt_close($stmt); // Cerrar la consulta si no está verificado

// Intentar enviar el correo antes de hacer la inserción en la base de datos
if (!sendVerificationEmail($email, $verification_code)) {
    echo "7";  // Error al enviar el correo, detener el proceso
    exit();
}

// Si el correo fue enviado correctamente, insertar el nuevo usuario en la base de datos
$hash = password_hash($password, PASSWORD_DEFAULT);

$insertuserquery = "INSERT INTO users (name, lastname, username, hash, gender, age, email, country, verified, verification_code, code_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = mysqli_prepare($con, $insertuserquery);
mysqli_stmt_bind_param($stmt, "sssssissiis", $name, $lastname, $username, $hash, $gender, $age, $email, $country, $verified, $verification_code, $code_expiry);



if (mysqli_stmt_execute($stmt)) {
    echo "0";  // Éxito, el usuario fue insertado y el correo fue enviado
} else {
    echo "4";  // Error al insertar el usuario en la base de datos
    exit();
}

// Función para enviar el correo de verificación
function sendVerificationEmail($toEmail, $verificationCode) {
    $mail = new PHPMailer(true);

    try {
        // Configuración del servidor SMTP de Gmail
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
        $mail->Subject = 'Account Verification Code';
        $mail->Body    = 'Your verification code is: <b>' . $verificationCode . '</b>';
        $mail->AltBody = 'Your verification code is: ' . $verificationCode;

        // Enviar el correo
        if ($mail->send()) {
            return true;  // El correo fue enviado correctamente
        } else {
            return false;  // Hubo un error al enviar el correo
        }

    } catch (Exception $e) {
        error_log("Error al enviar el correo: " . $mail->ErrorInfo);
        return false;  // Si hay una excepción, devolvemos false
    }
}

// Función para verificar si hay conexión a Internet
function checkInternetConnection() {
    $connected = @fsockopen("www.google.com", 80);  // Intenta conectarte a Google (puedes usar cualquier otro sitio conocido)
    if ($connected) {
        fclose($connected);
        return true;  // Hay conexión a Internet
    } else {
        return false;  // No hay conexión a Internet
    }
}

// Cerrar la conexión y las declaraciones
mysqli_stmt_close($stmt);
mysqli_close($con);
?>
