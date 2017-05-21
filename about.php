<?php
    $page_name = "About";
    include("header.php");
?>
<style>

</style>
</head>
<body>
    <?php include("nav.php"); ?>
<div class="container-fluid main">

    <div class="panel panel-default about-panel">
        <p>YouTube Timeline allows you to view all the videos a channel has published by month. This allows you to easily dive far back into the history of your favourite channels, which you cannot do easily with the native YouTube interface without scrolling for miles.</p>

        <p>Simply enter the username of a channel, and click Show Timeline. If the name matches a channel, that channel will be shown, otherwise, you can select a channel from the suggestions shown or enter a new name. Then, simply click on the panel of the year and month you wish to view, and the videos will be retrieved.</p>

        <p>Please feel free to leave any comments, suggestions, bugs or feature requests on the website's
            <a href="https://www.facebook.com/YTTimeline">Facebook</a> or
            <a href="https://twitter.com/YouTubeTimeline">Twitter</a> pages.</p>

        <p>YouTube Timeline uses
            <a href="https://jquery.com/" target="_blank">jQuery</a>,
            <a href="http://getbootstrap.com/" target="_blank">Bootstrap</a>,
            <a href="https://fortawesome.github.io/Font-Awesome/" target="_blank">Font Awesome</a>,
            <a href="http://momentjs.com/" target="_blank">moment.js</a>,
            <a href="https://lipis.github.io/bootstrap-social/" target="_blank">Bootstrap Social</a>,
            and the jQuery <a href="https://github.com/bigspotteddog/ScrollToFixed" target="_blank"> ScrollToFixed plugin.</a>
        </p>
    </div>

</div>
    <?php include("footer.php") ?>
</body>
</html>
