<?php

$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

// Check that connection happened
if (mysqli_connect_errno()) {
    echo "1: Connection failed"; // Error code #1 = connection failed
    exit();
}

$username = $_POST["name"];
$password = $_POST["password"];

// Check if the username exists
$namecheckquery = "SELECT username, salt, hash, score FROM player WHERE username = '" . $username . "';";
$namecheck = mysqli_query($con, $namecheckquery) or die("2: Name check query failed"); // Error code #2 - name check query failed

if (mysqli_num_rows($namecheck) != 1) {
    echo "5: Either no user with that name, or more than one"; // Error code #5 - number of names matching != 1
    exit();
}

// Fetch login info from query
$existinginfo = mysqli_fetch_assoc($namecheck);
$salt = $existinginfo["salt"];
$hash = $existinginfo["hash"]; // Corregido de 'hast' a 'hash'

// Hash the password with the salt
$loginhash = crypt($password, $salt);

// Compare the hashes
if ($hash != $loginhash) {
    echo "6: Incorrect password"; // Error code #6 password does not match
    exit();
}

// Success
echo "0\t" . $existinginfo["score"];

?>