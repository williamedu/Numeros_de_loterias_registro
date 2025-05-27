<?php

$con = mysqli_connect("localhost", "root", "root", "simulador(unity-access)");

// Check that connection happened
if (mysqli_connect_errno()) {
    echo "1: Connection failed"; // Error code #1 = connection failed
    exit();
}

$username = $_POST["name"];
$newscore = $_POST["score"];

// Double check there is only one user with this name
$namecheckquery = "SELECT username, salt, hash, score FROM player WHERE username = '" . $username . "';";
$namecheck = mysqli_query($con, $namecheckquery) or die ("2: Name check query failed"); // Error code #2 - name check query failed

if (mysqli_num_rows($namecheck) != 1) {
    echo "5: Either no user with that name, or more than one"; // Error code #5 - number of names matching != 1
    exit();
}

// Update the score for the user
$updatequery = "UPDATE player SET score = " . $newscore . " WHERE username = '" . $username . "';";
mysqli_query($con, $updatequery) or die("7: Save query failed"); // Error code #7 - UPDATE query failed

echo "0"; // Success

?>
