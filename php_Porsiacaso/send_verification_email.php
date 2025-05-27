<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Function to send the verification email
function sendVerificationEmail($toEmail, $verificationCode) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'williamhiciano26@gmail.com';
        $mail->Password   = 'your-app-password'; // Or your Gmail app-specific password
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        // Recipients
        $mail->setFrom('your-email@gmail.com', 'Your Name');
        $mail->addAddress($toEmail);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Account Verification Code';
        $mail->Body    = 'Your verification code is: <b>' . $verificationCode . '</b>';
        $mail->AltBody = 'Your verification code is: ' . $verificationCode;

        $mail->send();
        echo 'Verification email sent!';
    } catch (Exception $e) {
        echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    }
}
?>
