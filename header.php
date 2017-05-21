<?php
if (empty($compile)) {
    $compile = FALSE;
}
$applicationVersion = 103;
$hosted_url = "https://samleatherdale.github.io/youtubetimeline";
$local_url = "/youtubetimeline/source";
$site_description = "View the entire history of any YouTube channel without scrolling forever.";
$opengraph_image = "http://youtubetimeline.com/icon/opengraph-icon.png";
$local_mode = (!$compile && ($_SERVER["HTTP_HOST"] == "localhost"));
$site_url = ($local_mode) ? $local_url : $hosted_url;
$resource_url = ($local_mode) ? "/youtubetimelinejs/youtubetimeline/" : "/youtubetimeline/";
$extension = ($compile) ? ".html" : ".php";
$menu_items = array(
    "Home" => (object) [
        "location" => "/",
        "share_url" => "/"
    ],
    "About" => (object) [
        "location" => "/about",
        "share_url" => "/about"
    ]
);
if (isset($error_page)) {
    $share_url = $site_url."/";
}
else {
    $share_url = $site_url.$menu_items[$page_name]->share_url;
}
$fb_appid = "929549153810401";
?>
<!DOCTYPE html>
<html itemscope itemtype="http://schema.org/WebApplication" lang="en">
<head>
<meta charset="utf-8">
<?php
if ($compile) {
    $date = new DateTime(); ?>
    <!--Compiled on <?php echo $date->format("d/m/Y h:i:sA P T"); ?>-->
<?php } ?>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="description" content="<?php echo $site_description; ?>" />
<meta name="author" content="Sam Leatherdale" />
<?php
    $page_title = $page_name." - ";
    if ($page_name == "Home") {
        $page_title = "";
    }
?>
<title><?php echo $page_title; ?>YouTube Timeline</title>
<!--Iconography-->
<link rel="apple-touch-icon" sizes="57x57" href="<?php echo $resource_url; ?>icon/apple-touch-icon-57x57.png?v=4">
<link rel="apple-touch-icon" sizes="60x60" href="<?php echo $resource_url; ?>icon/apple-touch-icon-60x60.png?v=4">
<link rel="apple-touch-icon" sizes="72x72" href="<?php echo $resource_url; ?>icon/apple-touch-icon-72x72.png?v=4">
<link rel="apple-touch-icon" sizes="76x76" href="<?php echo $resource_url; ?>icon/apple-touch-icon-76x76.png?v=4">
<link rel="apple-touch-icon" sizes="114x114" href="<?php echo $resource_url; ?>icon/apple-touch-icon-114x114.png?v=4">
<link rel="apple-touch-icon" sizes="120x120" href="<?php echo $resource_url; ?>icon/apple-touch-icon-120x120.png?v=4">
<link rel="apple-touch-icon" sizes="144x144" href="<?php echo $resource_url; ?>icon/apple-touch-icon-144x144.png?v=4">
<link rel="apple-touch-icon" sizes="152x152" href="<?php echo $resource_url; ?>icon/apple-touch-icon-152x152.png?v=4">
<link rel="apple-touch-icon" sizes="180x180" href="<?php echo $resource_url; ?>icon/apple-touch-icon-180x180.png?v=4">
<link rel="icon" type="image/png" href="<?php echo $resource_url; ?>icon/favicon-32x32.png?v=4" sizes="32x32">
<link rel="icon" type="image/png" href="<?php echo $resource_url; ?>icon/android-chrome-192x192.png?v=4" sizes="192x192">
<link rel="icon" type="image/png" href="<?php echo $resource_url; ?>icon/favicon-96x96.png?v=4" sizes="96x96">
<link rel="icon" type="image/png" href="<?php echo $resource_url; ?>icon/favicon-16x16.png?v=4" sizes="16x16">
<link rel="manifest" href="<?php echo $resource_url; ?>icon/manifest.json?v=4">
<link rel="mask-icon" href="<?php echo $resource_url; ?>icon/safari-pinned-tab.svg?v=4" color="#e62117">
<link rel="shortcut icon" href="<?php echo $resource_url; ?>icon/favicon.ico?v=4">
<meta name="apple-mobile-web-app-title" content="YouTube Timeline">
<meta name="application-name" content="YouTube Timeline">
<meta name="msapplication-TileColor" content="#b91d47">
<meta name="msapplication-TileImage" content="<?php echo $resource_url; ?>icon/mstile-144x144.png?v=4">
<meta name="msapplication-config" content="<?php echo $resource_url; ?>icon/browserconfig.xml?v=4">
<meta name="theme-color" content="#e62117">

<!--Site Verification-->
<meta name="wot-verification" content="b4aed9acc3b46be09c61"/>
<meta name="wot-verification" content="e018c11bc4419df518b7"/>
<!--Google Analytics-->
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-76753203-1', 'auto');
  ga('send', 'pageview');

</script>
<!--Facebook OpenGraph-->
<meta property="og:url" content="<?php echo $share_url; ?>" />
<meta property="og:title" content="YouTube Timeline" />
<meta property="og:description" content="<?php echo $site_description; ?>" />
<meta property="og:site_name" content="YouTube Timeline" />
<meta property="og:image" content="<?php echo $opengraph_image; ?>" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="fb:app_id" content="<?php echo $fb_appid; ?>" />
<!--Twitter API-->
<!--<script type="text/javascript" async src="https://platform.twitter.com/widgets.js"></script>-->
<!--Twitter Cards-->
<meta name="twitter:card" content="summary" />
<meta name="twitter:site" content="@YouTubeTimeline" />
<meta name="twitter:title" content="YouTube Timeline" />
<meta name="twitter:description" content="<?php echo $site_description; ?>" />
<meta name="twitter:image" content="<?php echo $opengraph_image; ?>" />
<meta name="twitter:image:alt" content="YouTube Timeline Logo" />
<!--Google API-->
<!--<script src="https://apis.google.com/js/platform.js" async defer></script>-->
<!--Google Snippet-->
<meta itemprop="name" content="YouTube Timeline">
<meta itemprop="image" content="<?php echo $opengraph_image; ?>">
<meta itemprop="operatingSystem" content="Any">
<meta itemprop="applicationCategory" content="Utilities">
<meta itemprop="description" content="<?php echo $site_description; ?>">

<!--Hosted Resources-->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" rel="stylesheet" integrity="sha384-XdYbMnZ/QjLh6iI4ogqCTaIjrFk87ip+ekIjefZch0Y+PvJ8CDYtEs1ipDmPorQ+" crossorigin="anonymous">

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.min.js" integrity="sha256-ZosEbRLbNQzLpnKIkEdrPv7lOy9C27hHQ+Xp8a4MxAQ=" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js" integrity="sha256-Gn7MUQono8LUxTfRA0WZzJgTua52Udm1Ifrk5421zkA=" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>
<!--Local Resources-->
<link rel="stylesheet" type="text/css" href="<?php echo $resource_url; ?>third_party/bootstrap-social.css" />
<link rel="stylesheet" type="text/css" href="<?php echo $resource_url; ?>style.css?v=<?php echo microtime(true); ?>" />

<?php if ($page_name == "Home") { ?>
<script src="<?php echo $resource_url; ?>timeline.js?v=<?php echo microtime(true); ?>"></script>
<script src="<?php echo $resource_url; ?>third_party/jquery-scrolltofixed-min.js"></script>
<script src="<?php echo $resource_url; ?>third_party/lscache.min.js"></script>
<?php } ?>
