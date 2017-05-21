<?php
    $tweet_text = "Check out YouTube Timeline, which lets you easily view the complete history of any channel's videos.";
    $share_site_url = urlencode($site_url)
?>
<!--Facebook SDK-->
<!--<div id="fb-root"></div>
<script>(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_GB/sdk.js#xfbml=1&version=v2.6&appId=929549153810401";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));</script>-->
<!--End Facebook SDK-->
<header class="container-fluid" id="page_header">
    <div class="header-title">
        <a href="<?php echo $resource_url; ?>/"><h1 class="yt-red-dark">YouTube Timeline</h1></a>
        <a href="https://webhost.wsi.tafensw.edu.au/bluemountains/sam.leatherdale1/wordpress_sam/" target="_blank"><h2>by Sam Leatherdale</h2></a>
    </div>

    <nav id="header_nav">
            <ul class="nav nav-pills">
            <?php
                foreach ($menu_items as $item_name => $menu_item) {
            ?>
                <li role="presentation" class="<?php echo ($page_name == $item_name) ? "active" : ""; ?>"><a href="<?php echo $resource_url.$menu_item->location; ?>"><?php echo $item_name; ?></a></li>
            <?php
                }
            ?>
            </ul>
    </nav>

    <div id="social_buttons">

                <div id="twitter_button_container" class="social-button-container">

                    <a href="https://twitter.com/YouTubeTimeline" target="_blank" class="btn btn-social-icon btn-twitter social-button-link">
                        <span class="fa fa-twitter"></span>
                    </a>
<!--                    <a class="twitter-share-button"
                  href="https://twitter.com/intent/tweet?url=<?php echo $share_site_url; ?>&text=<?php echo urlencode($tweet_text); ?>"
                  data-size="default">
                Share</a>-->

                </div>

                <div id="fb_button_container" class="social-button-container">

                    <a href="https://www.facebook.com/YTTimeline" target="_blank" class="btn btn-social-icon btn-facebook social-button-link">
                        <span class="fa fa-facebook"></span>
                    </a>
<!--                    <div class="fb-share-button" data-href="<?php echo $site_url; ?>" data-layout="button" data-mobile-iframe="true"></div>-->

                </div>



<!--                <div id="google_button_container" class="social-button-container">
                    <div class="social-button-link">

                    </div>
                    <div class="g-plus" data-href="<?php echo $site_url; ?>" data-action="share" data-annotation="none" data-expandTo="bottom" data-height="20"></div>

                </div>-->


    </div>

<!--    <div id="header_navbar">




    </div>-->


</header>
