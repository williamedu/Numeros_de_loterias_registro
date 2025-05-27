<?php
// Conectar a la base de datos
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

// Verificar la conexión
if (mysqli_connect_errno()) {
    echo "1: Conexión fallida"; // Error 1: Conexión a la base de datos fallida
    exit();
}

// Obtener los datos enviados desde el formulario
$nombre = $_POST["nombre"];
$estrellas = $_POST["estrellas"];

// Verificar si el usuario ya existe
$namecheckquery = "SELECT nombre FROM usuarios_simulador WHERE nombre = '" . $nombre . "';";
$namecheck = mysqli_query($con, $namecheckquery) or die("2: Consulta de nombre fallida"); // Error 2: Consulta de nombre fallida

if (mysqli_num_rows($namecheck) > 0) {
    // Si el usuario existe, actualizar el número de estrellas
    $updatequery = "UPDATE usuarios_simulador SET estrellas_conseguidas = $estrellas WHERE nombre = '$nombre';";
    mysqli_query($con, $updatequery) or die("3: Actualización de estrellas fallida"); // Error 3: Error al actualizar las estrellas
    echo "0"; // Éxito
} else {
    // Si el usuario no existe, insertar un nuevo registro
    $insertquery = "INSERT INTO usuarios_simulador (nombre, estrellas_conseguidas) VALUES ('$nombre', $estrellas);";
    mysqli_query($con, $insertquery) or die("4: Inserción de usuario fallida"); // Error 4: Error al insertar nuevo usuario
    echo "0"; // Éxito
}

?>
