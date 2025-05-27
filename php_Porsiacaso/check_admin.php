<?php
// Conectar a la base de datos AWS
$con = mysqli_connect("americastowersimulator.c14c80caytj6.us-east-1.rds.amazonaws.com", "admin", "Controlador2929", "simulador(unity-access)");

// Verificar conexión
if (!$con) {
    die("ERROR_DB");
}

// Recibir datos desde Unity
$username = $_POST["username"] ?? '';

// Verificar si el username está vacío
if (empty($username)) {
    die("MISSING_USERNAME");
}

// Depuración: Mostrar el username recibido
error_log("📌 Verificando usuario: " . $username);

// Consulta para verificar si el usuario existe
$query = "SELECT admin FROM usuarios_comida WHERE usuario = '$username'";
$result = mysqli_query($con, $query);

// Verificar si la consulta se ejecutó correctamente
if (!$result) {
    die("SQL_ERROR: " . mysqli_error($con));
}

// Verificar si se encontró el usuario
if (mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    $isAdmin = (int)$row["admin"]; // Convertir a entero (0 o 1)

    if ($isAdmin === 1) {
        echo "ADMIN"; // Usuario es administrador
    } else {
        echo "NO_ADMIN"; // Usuario normal
    }
} else {
    echo "USER_NOT_FOUND"; // Usuario no encontrado
}

// Cerrar conexión
mysqli_close($con);
?>
