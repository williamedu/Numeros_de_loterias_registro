<?php

$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

// Check that connection happened
if (mysqli_connect_errno())
{
    echo "1: Connection failed"; // Error code #1 = connection failed
    exit();
}

$username = $_POST["name"];
$password = $_POST["password"];

// Check if name exists
$namecheckquery = "SELECT username FROM player WHERE username = '" . $username . "';";

$namecheck = mysqli_query($con, $namecheckquery) or die("2: Name check query failed"); // Error code #2 - name check query failed

if (mysqli_num_rows($namecheck) > 0)
{
    echo "3: Name already exists"; // Error code #3 - name already exists, cannot register
    exit();
}

// Add user to the table
$salt = "\$5\$rounds=500\$" . "steamedhams" . $username . "\$";
$hash = crypt($password, $salt);

// Correct insertion query with quotes around $salt
$insertuserquery = "INSERT INTO player(username, hash, salt) VALUES('" . $username . "', '" . $hash . "', '" . $salt . "');";
mysqli_query($con, $insertuserquery) or die("4: Insert player query failed"); // Error code #4 - insert query failed

echo "0"; // Success
?>
