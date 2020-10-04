<?php
$buildDir = __DIR__ . "/build/";
if (!is_dir($buildDir)) {
    mkdir($buildDir);
}
$compile = TRUE;
$compile_pages = array(
    "Home" => array("filename" => "home", "compile" => "index"),
    "About" => array("filename" => "about", "compile" => "about")
);
foreach ($compile_pages as $page_name => $filenames) {
    ob_start();
    include($filenames["filename"].".php");
    $outfile = fopen($buildDir . $filenames["compile"].".html", "w") or die("Compile failed: access denied.");
    fwrite($outfile, ob_get_contents());
    fclose($outfile);
    ob_end_clean();
    echo "Compiled page ".$filenames["filename"].".php to ".$filenames["compile"].".html\n";
}
