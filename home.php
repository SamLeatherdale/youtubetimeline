<?php
    $page_name = "Home";
    include("header.php");
?>
<body data-spy="scroll" data-target="#timeline_navigation">
<?php
    if (!$compile) {
        include("./api/apikey.php"); ?>
    <script>apiKey = "<?php echo $developerKey; ?>";</script>
<?php
    } ?>
    <div id="modal_background"></div>
    <?php include("nav.php"); ?>
    <div class="container-fluid main">

        <!--Welcome message-->
        <div id="welcome_message" class="alert alert-success alert-dismissible fade in" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            <h4>Welcome to YouTube Timeline!</h4>
            <p>Ever wanted to look at a channel's old videos but had to scroll through all the one's you've already watched? And once you did scroll down, you choose a video, only to have to scroll down all over again and lose your place? With YouTube Timeline, you can instantly jump to the year and month that you're interested in.</p>
        </div>

        <div id="scroll_top" title="Scroll to top">
            <i class="fa fa-chevron-circle-up"></i>
        </div>

        <div id="show_timeline_navigation" data-status="hidden" title="Show navigation">
            <i class="fa fa-bars"></i>
        </div>

        <!--Loading modal-->
        <div class="modal fade" tabindex="-1" role="dialog" id="session_restore_dialog">
            <div class="modal-dialog modal-sm" role="document">
              <div class="modal-content">
                  <div class="modal-body">We're restoring your last timeline&hellip;</div>
              </div>
            </div>
        </div>

    	<div id="options_box">
            <form id="form_channel_name">
                <label for="input_channel_name">Enter a channel username to view a complete history of their videos:</label>
                <div class="input-group" id="input_group_channel_name">
                    <span class="input-group-addon" id="addon_youtube_domain_user">http://www.youtube.com/user/</span>
                    <input type="text" class="form-control" name="channel_name" id="input_channel_name" aria-describedby="addon_youtube_domain_user" placeholder="username" required />
                </div>
                <div>
                    <label for="input_video_title">Optionally, filter by video title as well:</label>
                    <input type="text" class="form-control" name="video_title" id="input_video_title" />
                    <input type="submit" class="btn btn-primary yt-red yt-red-hover" value="Show Timeline" />
                </div>
            </form>
        </div>

        <div id="error_messages">
        </div>

        <div class="panel-group" id="channel_results" role="tablist" aria-multiselectable="true">
          <div class="panel panel-info">
            <div class="panel-heading" role="tab" id="channel_results_heading">
              <h4 class="panel-title">
                <a role="button" data-toggle="collapse" data-parent="#channel_results" href="#channel_results_collapse" aria-expanded="true" aria-controls="channel_results_collapse" >
                  <span class="glyphicon glyphicon-chevron-down"></span><span id="channel_results_description"></span>
                </a>
              </h4>
            </div>
            <div id="channel_results_collapse" class="panel-collapse collapse" role="tabpanel" aria-labelledby="channel_results_heading">
              <div class="panel-body" id="channel_results_body">
                  <i id="channel_results_spinner" class="fa fa-spinner fa-pulse"></i>
                  <div id="channel_result_container">

                  </div>
              </div>
            </div>
          </div>
        </div>


        <div id="channel_info_container">
        </div>

        <div id="timeline_main">

            <div id="timeline_navigation" class="timeline-navigation" role="navigation">
                <ul class="nav nav-pills nav-stacked" role="tablist">
                </ul>
            </div>

            <div id="timeline_navigation_placeholder">

            </div>

            <div id="timeline_navigation_mobile" class="timeline-navigation" role="navigation">
                <div id="timeline_navigation_mobile_header" class="yt-red">Jump to Year</div>
                <ul class="nav nav-pills nav-stacked" role="tablist">
                </ul>
            </div>


            <div id="timeline_container">
                <div id="timeline_container_buttons">
                    <button type="button" class="btn btn-info timeline-collapse-all">Collapse All</button>
                    <button type="button" class="btn btn-warning" id="reset_watch_history">Reset Watch History</button>
                </div>
                <div class="panel-group" id="timeline_accordion" role="tablist" aria-multiselectable="true">
                </div>
            </div>

        </div>


    </div>
    <?php include("footer.php"); ?>
</body>
</html>
