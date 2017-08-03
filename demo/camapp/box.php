<?php

sleep(5);

header('Content-Type: image/png');
echo file_get_contents('box.png');
