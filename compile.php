<?php
$compile = TRUE;
$compile_pages = array(
    "Home" => "index",
    "About" => "about"
);
foreach ($compile_pages as $page_name => $page_filename) {
    ob_start();
    include($page_filename.".php");
    $outfile = fopen($page_filename.".html", "w") or die("Compile failed: access denied.");
    fwrite($outfile, ob_get_contents());
    fclose($outfile);
    ob_end_clean();
    echo "Compiled page ".$page_filename.".php\n";
}
