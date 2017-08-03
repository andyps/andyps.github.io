<?php

sleep(5);

header('Content-Type: text/json');
$a = ['x' => 1, 'y' => 2, 'z' => 3];
echo json_encode($a);
