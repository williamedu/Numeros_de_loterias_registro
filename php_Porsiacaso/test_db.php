<?php
$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

if (mysqli_connect_errno()) {
    echo "Failed to connect to MySQL: " . mysqli_connect_error();
} else {
    echo "Connected successfully!";
}

mysqli_close($con);
?>
