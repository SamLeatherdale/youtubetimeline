import $ from "jquery";
import "scrolltofixed"
import moment from "moment";
import "./api"
import { retrieveVideos } from "./api";
import { Channel, SearchChannel, VideoResponse } from "./classes";
import { API_KEY, session, timeouts } from "./globals";
import { addCommas, BindRestoreSessionHandler, CollapseAll, collapseChevron, disableExpand, ExpandAll, getMomentFromTag, getMoreVideos, getParameterByName, goTo, hideShowPanel, JumpToYear, onDropdownChevron, onExpandMonth, onResize, ScrollToMonth, SearchChannelsDropdown, SelectChannel, showMessage, showTutorial, ToggleMobileNavigation } from "./utility";


function submitUsername() {
    let channel_name: string = $("#input_channel_name").val() as string;
    let search_term: string = $("#input_video_title").val() as string;
    if (channel_name === session.channelName && search_term === session.searchTerm) {
        //Query is the same, return
        return;
    }
    else if (channel_name === session.channelName && search_term !== session.searchTerm) {
        session.searchTerm = search_term;
        createTimeline(session.channelDate);
        goTo($('#timeline_container'));
        return;
    }
    //Cache channel name in case user wants to perform search
    session.channelName = channel_name;
    session.searchTerm = search_term;

    //Clear errors
    $("#error_messages > *").addClass("clear").slideUp();
    $("#error_messages > *").slideUp();
    timeouts.errorMessagesEmpty = window.setTimeout(function() {
        $("#error_messages > .clear").remove();
    }, 400);


    if (channel_name === "") {
        $("#input_group_channel_name").addClass("has-error");
        return;
    }
    $("#input_group_channel_name").removeClass("has-error");


    let results_panel = $("#channel_results > .panel");

    //Check channel
    $.get(
        "https://www.googleapis.com/youtube/v3/channels",
		{
			part : 'id',
	   		forUsername : channel_name,
			fields : "pageInfo/totalResults,items/id",
	   		key: API_KEY
	   	},
       	function(data) {
       	    if (data.pageInfo.totalResults === 0) {
                $(document).trigger("restore-complete", {success: false});
       	        session.channelSearchCompleted = true;
       	        $("#channel_results_description").text("Did you mean...");
                results_panel.removeClass("panel-info");
                results_panel.addClass("panel-warning");
                searchChannels(channel_name, true);
       	    }
       	    else {
                let channel = data.items[0];
       	        session.channelSearchCompleted = false;
       	        collapseChevron($("#channel_results_collapse"), "hide");
       	        $("#channel_result_container").empty();
                $("#channel_results_description").text("Suggestions");
                results_panel.removeClass("panel-warning");
                results_panel.addClass("panel-info");

                session.channelId = channel.id;
                processChannel(session.channelId, true);
                //Display the related channels box, but don't perform search
                $("#channel_results").css("display", "block");
       	    }
        }
    ).fail(function(xhr, status, error) {
        $(document).trigger("restore-complete", {success: false});
        if (xhr.status === 400) {
            showMessage("Please enter a channel name and try again.", "danger");
        }
    });
}

export function searchChannels(search_term: string, auto_hide_show: boolean) {
    $("#channel_results").css("display", "block");
    if (auto_hide_show) {
        hideShowPanel($("#channel_results_collapse"), function() {
            $("#channel_result_container").empty();
            $("#channel_results_spinner").css("display", "inline-block");
        });
    }
    else {
        $("#channel_results_spinner").css("display", "inline-block");
    }


    $.get(
        "https://www.googleapis.com/youtube/v3/search",
		{
			part : 'snippet',
	   		q : search_term,
			type: "channel",
			maxResults: 5,
			filter: "pageInfo/totalResults,items/id",
	   		key: API_KEY
	   	},
       	function(data) {
            if (data.pageInfo.totalResults === 0) {
                $("#channel_results_spinner").css("display", "none");
                $("#channel_results").css("display", "none");
                showMessage("No channels found with that name.", "danger");
                return;
            }
            displayChannelSearchResults(data.items);
            $("#channel_results_spinner").css("display", "none");
        }
    ).fail(function(xhr, status, error) {
        if (xhr.status === 400) {
            showMessage("Please enter a channel name and try again.", "warning");
        }
    });
}

function displayChannelSearchResults(channels: SearchChannel[]) {
    let channel_data : Channel[];
    let channel_ids: string[] = [];
    $.each(channels, function(i, channel) {
        channel_ids.push(channel.id.channelId);
    });
    $.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
            part : 'snippet,statistics',
            id : channel_ids.join(","),
            key: API_KEY
        },
        function(data) {
            channel_data = data.items;

            channel_data.sort(function(a, b) {
                if (parseInt(a.statistics.subscriberCount) > parseInt(b.statistics.subscriberCount)) {
                    return -1;
                }
                else if (parseInt(a.statistics.subscriberCount) < parseInt(b.statistics.subscriberCount)) {
                    return 1;
                }
                return 0;
            });

            $.each(channel_data, function(i, channel) {
                let subscribers = "";
                let subscriberClass = "";
                let videoClass = "";
                if (channel.statistics.hiddenSubscriberCount === true) {
                    subscribers = "Private";
                    subscriberClass = " invert-yt-red";
                }
                else {
                    subscribers = addCommas(channel.statistics.subscriberCount.toString());
                }
                if (channel.statistics.videoCount === "0") {
                    videoClass = " invert-yt-red";
                }
                //Display element
                let set_active = "";
                if (session.channelId === channel.id) {
                    set_active = " active";
                }
                $("#channel_result_container").append(
                    `<div class="channel-result button-result" data-channel-ID="${channel.id}">
                        <a class="btn btn-default ${set_active}" href="#">
                            <img src="${channel.snippet.thumbnails.medium.url}" />
                            <div class="button-result-info-box">
                                <div class="button-result-info-wrapper" >
                                    <div class="button-result-title smart-break">${channel.snippet.title}</div>
                                    <div class="channel-result-badge-container">
                                        <span class="channel-result-subscribers badge ${ subscriberClass}" data-subscribers="${channel.statistics.subscriberCount}">${subscribers}</span>
                                        <br />
                                        <span class="channel-result-videos badge ${ videoClass}">${addCommas(channel.statistics.videoCount)}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>`
                );


            });
            
            $(".channel-result a").click(SelectChannel);
    });
}

export function processChannel(channelID: string, customURL: boolean) {
    $.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
            part : 'snippet,statistics',
            id : channelID,
            key: API_KEY
        },
       	function(data) {
            if (data.pageInfo.totalResults === 0) {
                showMessage("Channel ID invalid. Please try again.", "danger");
                $(document).trigger("restore-complete", {success: false});
                return;
            }
            let channel: Channel = data.items[0];
            let subscribers = "";
            if (channel.statistics.hiddenSubscriberCount === true) {
                subscribers = "Private";
            }
            else {
                subscribers = addCommas(channel.statistics.subscriberCount.toString());
            }
            $("#channel_info_container").empty();
            $("#channel_info_container").append(
                `<div id="channel_info">
                    <a href="https://www.youtube.com/channel/${channel.id}" target="_blank" >
                        <img src="${channel.snippet.thumbnails.medium.url}" />
                    </a>
                    <div class="channel-info-details">
                        <div class="channel-info-details-wrapper">
                            <a href="https://www.youtube.com/channel/${channel.id}" target="_blank" >
                                <div class="channel-info-name">${channel.snippet.title}</div>
                            </a>
                            <div class="channel-info-subscribers">${subscribers} subscribers</div>
                            <div class="channel-info-videos">${addCommas(channel.statistics.videoCount)} videos</div>
                        </div>
                    </div>
                </div>`
            );
            session.channelDate = moment(channel.snippet.publishedAt);
            session.channelId = channel.id;
            if (customURL) {
                channel.username = session.channelName;
            }
            session.channel = channel;

            session.replaceState();
            session.loadWatchHistory();
            createTimeline(session.channelDate);
        }
    ).fail(function(xhr, status, error) {
        if (xhr.status === 404) {
        }
    });
}

function createTimeline(channelDate: moment.Moment) {
    $("#timeline_accordion").empty();
    $(".timeline-navigation > ul").empty();
    $(".timeline-channel-created").remove();

    var currentDate = moment();
    var yearLoopDate = moment({
        year: currentDate.year()
    });

    var monthLoopDate = moment({
        year: currentDate.year(),
        month: currentDate.month()
    });
    if (session.hasLocalStorage && Object.keys(session.watchHistory).length > 0) {
        $("#reset_watch_history").show();
    } else {
        $("#reset_watch_history").hide();
    }
    $("#timeline_container_buttons").show();
    while (yearLoopDate.isSameOrAfter(channelDate, "year")) {
        //loop through each year and create accordions
        var id_string = 'timeline_year_' + yearLoopDate.year();
        $("#timeline_accordion").append(
            `<div class="timeline-year panel panel-default" id="${id_string}">
                <div class="panel-heading" role="tab" id="${id_string}_heading">
                    <h4 class="panel-title">
                        <a role="button" data-toggle="collapse" data-parent="#${id_string}" href="#${id_string}_collapse" aria-expanded="true" aria-controls="${id_string}_collapse">
                            <span class="glyphicon glyphicon-chevron-down"></span><span class="timeline-year-label">${ yearLoopDate.year()}</span>
                        </a>
                    </h4>
                </div>
                <div id="${id_string}_collapse" class="panel-collapse collapse" role="tabpanel" aria-labelledby="${id_string}_heading">
                    <div class="panel-body">
                        <div class="timeline-year-buttons">
                            <button type="button" class="btn btn-info timeline-expand-all">Expand All</button>
                            <button type="button" class="btn btn-info timeline-collapse-all">Collapse All</button>
                        </div>
                        <div class="month-container"></div>
                    </div>
                </div>
            </div>`
        );

        //also create year navigation elements
        $(".timeline-navigation > ul").append(
            `<li role="presentation"><a href="${id_string}_heading">${yearLoopDate.year()}</a></li>`
        );

        yearLoopDate.subtract(1, "years");
    }

    //Hook up button event handlers
    $(".timeline-expand-all").click(ExpandAll);
    $(".timeline-collapse-all").click(CollapseAll);

    //Hook up navigation event handlers
    $(".timeline-navigation a").click(JumpToYear);

    while (monthLoopDate.isSameOrAfter(channelDate, "month")) {
        //loop through each month and create accordions
        let keyMonthYear: string = monthLoopDate.year() + "-" + monthLoopDate.format("MM");
        let id_string = "timeline_month_" + keyMonthYear;
        $("#timeline_year_" + monthLoopDate.year() + "_collapse .month-container").append(
            `<div class="timeline-month panel panel-default" id="${id_string}" data-month="${keyMonthYear}">
                <div class="panel-heading" role="tab" id="${id_string}_heading">
                    <h4 class="panel-title">
                        <a role="button" data-videos-loaded="false" data-toggle="collapse" data-parent="#${id_string}" href="#${id_string}_collapse" aria-expanded="true" aria-controls="${id_string}_collapse">
                            <span class="glyphicon glyphicon-chevron-down"></span><span class="timeline-month-label">${ monthLoopDate.format("MMMM YYYY")}</span>
                        </a>
                    </h4>
                </div>
                <div id="${id_string}_collapse" class="panel-collapse collapse" role="tabpanel" aria-labelledby="${id_string}_heading">
                    <div class="panel-body">
                        <i class="fa fa-spinner fa-pulse"></i>
                        <div class="video-container clearfix">
                        </div>
                    </div>
                </div>
            </div>`
        );
        monthLoopDate.subtract(1, "months");
    }

    $(".timeline-month").on("timeline-videos-shown", ScrollToMonth);
    $(".timeline-month .panel-collapse").each(onExpandMonth);
    $('.timeline-month .panel-title a, .timeline-year .panel-title a').click(onDropdownChevron);

    $("#timeline_container").append(
        `<div class="timeline-channel-created well yt-red">
           <i class="fa fa-flag"></i>
           <div>Channel created ${ channelDate.format("Do MMMM YYYY")}</div>
        </div>`
    );

    //Activate collapsibles
    $('.panel-collapse').collapse({ toggle: false });

    //Trigger any callbacks
    $(document).trigger("restore-complete", {success: true});
}

export function getVideos(parent: JQuery, pageNumber: number) {
    let videoMonth = getMomentFromTag(parent.attr("data-month"));

    let panelCollapse = parent.find(".panel-collapse");
    let panelBody = parent.find(".panel-body");
    let videoContainer = parent.find(".video-container");
    let publishedAfter = videoMonth;
    let publishedBefore = moment(videoMonth).add(1, "months");
    let videoTitle = ($("#input_video_title").val() as string).toLowerCase();
    //Get videos
    retrieveVideos(session.channelId, publishedBefore, publishedAfter, pageNumber, function(videoResponse: VideoResponse) {
        $.each(videoResponse.videos, function(i, video) {
            //Filter out videos that do not contain the specified title
            if (videoTitle !== "" && video.snippet.title.toLowerCase().indexOf(videoTitle) === -1) {
                return;
            }
            let video_date = moment(video.snippet.publishedAt);
            videoContainer.append(
                `<div class="timeline-video button-result">
                    <a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank">
                        <div class="timeline-video-container btn btn-default" data-video-id="${video.id.videoId}">
                            <div class="timeline-video-date badge yt-red">${video_date.format("Do")}</div>
                            <div class="timeline-video-thumb-container">
                                <div class="timeline-video-watched">
                                    <i class="fa fa-check"></i>
                                </div>
                                <img src="${video.snippet.thumbnails.medium.url}" />
                            </div>
                            <div class="button-result-info-box">
                                <div class="button-result-info-wrapper" >
                                   <div class="button-result-title smart-break">${video.snippet.title}</div>
                                   </div>
                            </div>
                        </div>
                   </a>
                </div>`
            )
            videoContainer.find(".timeline-video-container").click(watchVideo)
        });
        panelBody.find(".fa-spinner").css("display", "none");
        let badge = parent.find(".panel-heading .badge");
        if (badge.length === 0) {
            parent.children(".panel-heading").find("a").append('<span class="badge">' + videoResponse.totalResults + ' videos</span>');
        }
        else {
            badge.text(videoResponse.totalResults + " videos");
        }

        if (videoResponse.totalResults === "0") {
            parent.find(".panel-collapse").each(disableExpand);
        }

        if (videoResponse.more) {
            if (panelBody.find(".videos-show-more").length === 0) {
                let more_button = $(`<button type="button" class="btn btn-info videos-show-more" data-page-number="${videoResponse.pageNumber}">Show More</button>`);
                more_button.click(getMoreVideos);
                panelBody.append(more_button);
            }
            else {
                //Update existing button
                panelBody.find(".videos-show-more").attr("data-page-number", videoResponse.pageNumber);
            }
        }
        else {
            panelBody.find(".videos-show-more").remove();
        }

        //Mark watched videos
        videoContainer.find(".timeline-video-container").each(function(i, el) {
            if (session.watchHistory[$(el).attr("data-video-id")]) {
                $(el).removeClass("btn-default").addClass("btn-success");
            }
        });
        if (pageNumber == 1) {
            if (panelCollapse.hasClass("in")) {
                //If the panel has already opened, scroll to it now
                videoContainer.trigger("timeline-videos-shown");
            }
            //Otherwise, scroll once it has finished opening
            panelCollapse.on("shown.bs.collapse", ScrollToMonth);
        }
        parent.attr('data-videos-loaded', 'true');
    });
}


function resetWatchHistory() {
    if (confirm("Are you sure you want to erase your watch history for this channel?")) {
        if (session.hasLocalStorage) {
            localStorage.removeItem("watchHistory_" + session.channelId);
            sessionStorage.clear();
            location.reload();
        }
    }
}

function watchVideo() {
    var video = $(this);
    $("#reset_watch_history").show();
    session.lastMonth = getMomentFromTag(video.parents(".timeline-month").attr("data-month"));
    session.replaceState({ month: true });
    if (session.hasLocalStorage) {
        if (session.watchHistory[video.attr("data-video-id")] !== 1) {
            session.watchHistory[video.attr("data-video-id")] = 1;
        }
        localStorage.setItem("watchHistory_" + session.channelId, JSON.stringify(session.watchHistory));
    }
    video.removeClass("btn-default").addClass("btn-success");
}


function RestoreSession() {
    let channelId = getParameterByName("channel");
    let channelName = getParameterByName("user");
    if (channelId !== null || channelName !== null) {
        if (channelId !== null) {
            //Restore channel from url
            if (channelId == "") {
                session.replaceState({default: true});
                return;
            }
            session.channelId = channelId;
            let month = getParameterByName("lastMonth");
            if (month !== null) {
                //Includes month
                session.lastMonth = moment.utc(month, "YYYY/MM");
            }
            BindRestoreSessionHandler();
            processChannel(session.channelId, false);
        }
        else if (channelName !== null) {
            //Fill username
            if (channelName == "") {
                session.replaceState({default: true});
                return;
            }
            $("#input_channel_name").val(channelName);
            let month = getParameterByName("lastMonth");
            if (month !== null) {
                //Includes month
                session.lastMonth = moment.utc(month, "YYYY/MM");
            }
            BindRestoreSessionHandler();
            submitUsername();
        }
    }
}

export function FinaliseRestoreSession(event, event_data) {
    // if (sessionStorage.getItem("openMonths")) {
    //     session.openMonths = JSON.parse(sessionStorage.getItem("openMonths"));
    //     let month_collapse;
    //     $.each(session.openMonths, function(prop, val) {
    //         var month = getMomentFromTag(prop);
    //         $("#timeline_year_" + month.year() + "_collapse").collapseChevron("show");
    //         month_collapse = $("#timeline_month_" + prop + "_collapse");
    //         month_collapse.collapseChevron("show");
    //     });
    // }
    $("#session_restore_dialog").modal('hide');
    if (event_data.success) {
        session.loadWatchHistory();
        if (session.lastMonth) {
            collapseChevron($("#timeline_year_" + session.lastMonth.year() + "_collapse"), "show");
            let month_collapse = $("#timeline_month_" + session.lastMonth.format("YYYY-MM") + "_collapse");
            collapseChevron(month_collapse, "show").on("timeline-videos-shown", function() {
                //month_collapse.parent().goTo();
            });
        }
    }

}

$(function() {
    //Some browsers retain form information
    $("#form_channel_name input[type='hidden']").val("");
    $("#form_channel_name").submit(function(event) {
        event.preventDefault();
        submitUsername();
    });
    //Needs to run since the panel is created when the page loads
    $('#channel_results .panel-title a').click(SearchChannelsDropdown).click(onDropdownChevron);
    $("#show_timeline_navigation").click(ToggleMobileNavigation);
    $("#reset_watch_history").click(resetWatchHistory);

    $("#timeline_navigation").scrollToFixed({ marginTop: 10, zIndex: 99 });

    $("#scroll_top").click(function() {
        goTo($('header'));
    });

    //Hook up resize events
    timeouts.onResize = 0;
    $(window).resize(function() {
        if (timeouts.onResize !== 0) {
            clearTimeout(timeouts.onResize);
        }
        timeouts.onResize = window.setTimeout(function() { onResize(); }, 100);
    });

    showTutorial();
    RestoreSession();
});
