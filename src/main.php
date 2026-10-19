<?php
//main.php for TEST
  // require  dirname(__DIR__) . DIRECTORY_SEPARATOR . 'class' . DIRECTORY_SEPARATOR .'Scenario.php';
  require './Domain/Model/Scenario.php';
?>

<?php

$scenario = new Scenario(1000.0,5,[]);
var_dump($scenario);