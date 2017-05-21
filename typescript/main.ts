"use strict";
/// <reference path="api.ts" />
/// <reference path="utility.ts" />
//import * as moment from "./moment";
//import moment = moment;
//Custom events defined in this script include:
//timeline-videos-shown, restore-complete
class Session {
    channelName: string;
    searchTerm: string;
    channelSearchCompleted = false;
    channelDate: moment.Moment = moment();
    channelId: string;
    channel: Channel;
    lastMonth: moment.Moment;
    openMonths = {};
    watchHistory = {};

    hasSessionStorage: boolean;
    hasLocalStorage: boolean;
    constructor() {
        this.hasSessionStorage = storageAvailable("sessionStorage");
        this.hasLocalStorage = storageAvailable("localStorage");
    }
    loadWatchHistory() {
        if (this.hasLocalStorage && localStorage.getItem("watchHistory_" + this.channelId)) {
            this.watchHistory = JSON.parse(localStorage.getItem("watchHistory_" + this.channelId));
        }
    }
    replaceState(options?: any) {
        options = $.extend({}, {month: false, default: false}, options);
        if (options.default) {
            history.replaceState({}, "YouTube Timeline", host_url);
            return;
        }
        let channelString = (typeof session.channel.username !== "undefined") ? host_url + "?user=" + encodeURIComponent(this.channel.username) : host_url + "?channel=" + encodeURIComponent(session.channelId);
        if (options.month) {
            history.replaceState({}, this.channel.snippet.title + " - " + this.lastMonth.format("MMMM YYYY"), channelString + "&lastMonth=" + encodeURIComponent(this.lastMonth.format("YYYY/MM")));
        } else {
            history.replaceState({}, this.channel.snippet.title, channelString);
            document.title = this.channel.snippet.title + " - YouTube Timeline";
        }

    }
};
class Channel {
    id: string;
    statistics: Statistics;
    snippet: Snippet;
    //For vanity URL
    username: string;
}
class Snippet {
    publishedAt: string;
    title: string;
    thumbnails: Thumbnails;
}
class Thumbnails {
    medium: Thumbnail;
}
class Thumbnail {
    url: string;
}
class Statistics {
    subscriberCount: number;
    hiddenSubscriberCount: boolean;
    videoCount: number;
}
class Video {
    id: VideoId;
    snippet: Snippet;
}
class VideoId {
    videoId: string;
}
class Timeouts {
    onResize: number;
    errorMessagesEmpty: number;
}
class VideoResponse {
    constructor() {
        this.more = false;
        this.page = 1;
    }
    videos: any
    more: boolean
    page: number
    totalResults: string
}
var session = new Session();
var timeouts = new Timeouts();
var APPLICATION_VERSION = "103";
var host_url = (window.location.hostname == "localhost") ? "/youtubetimelinejs/youtubetimeline/" : "/youtubetimeline/";
var apiKey = "AIzaSyD7qhxl1x67T5l8itG9jGZ4Oa69gBeVurw";

function submitUsername() {
    let channel_name: string = $("#input_channel_name").val();
    let search_term: string = $("#input_video_title").val();
    if (channel_name === session.channelName && search_term === session.searchTerm) {
        //Query is the same, return
        return;
    }
    else if (channel_name === session.channelName && search_term !== session.searchTerm) {
        session.searchTerm = search_term;
        createTimeline(session.channelDate);
        $('#timeline_container').goTo();
        return;
    }
    //Cache channel name in case user wants to perform search
    session.channelName = channel_name;
    session.searchTerm = search_term;

    //Clear errors
    $("#error_messages > *").addClass("clear").slideUp();
    $("#error_messages > *").slideUp();
    timeouts.errorMessagesEmpty = setTimeout(function() {
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
	   		key: apiKey
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
       	        $("#channel_results_collapse").collapseChevron("hide");
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

function searchChannels(search_term: string, auto_hide_show: boolean) {
    $("#channel_results").css("display", "block");
    if (auto_hide_show) {
        $("#channel_results_collapse").hideShowPanel(function() {
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
	   		key: apiKey
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

function displayChannelSearchResults(channels) {
    let channel_data : Channel[] = [];
    $.each(channels, function(i, channel) {
        $.get(
            "https://www.googleapis.com/youtube/v3/channels",
            {
                part : 'snippet,statistics',
                id : channel.id,
                key: apiKey
            },
            function(data) {
                channel_data.push(channel.items[0]);
            }
        );
    });
    console.log(channel_data);

    channel_data.sort(function(a, b) {
        if (a.statistics.subscriberCount > b.statistics.subscriberCount) {
            return 1;
        }
        else if (a.statistics.subscriberCount < b.statistics.subscriberCount) {
            return -1;
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
        if (channel.statistics.videoCount === 0) {
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
}

function processChannel(channelID: string, customURL: boolean) {
    $.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
            part : 'snippet,statistics',
            id : channelID,
            key: apiKey
        },
       	function(data) {
            if (data.pageInfo.totalResults === 0) {
                showMessage("Channel ID invalid. Please try again.", "danger");
                $(document).trigger("restore-complete", {success: false});
                return;
            }
            let channel: Channel = data.items[0];
            console.log(channel);
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
                    <a href="http://www.youtube.com/channel/${channel.id}" target="_blank" >
                        <img src="${channel.snippet.thumbnails.medium.url}" />
                    </a>
                    <div class="channel-info-details">
                        <div class="channel-info-details-wrapper">
                            <a href="http://www.youtube.com/channel/${channel.id}" target="_blank" >
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
                        <button type="button" class="btn btn-info timeline-expand-all">Expand All</button>
                        <button type="button" class="btn btn-info timeline-collapse-all">Collapse All</button>
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
                        <div class="video-container">
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

function getVideos(parent: JQuery, channelID: string, videoMonth: moment.Moment) {
    let panelCollapse = parent.find(".panel-collapse");
    let panelBody = parent.find(".panel-body");
    let videoContainer = parent.find(".video-container");
    let publishedAfter = videoMonth;
    let publishedBefore = moment(videoMonth).add(1, "months");
    let videoTitle = $("#input_video_title").val().toLowerCase();
    //Get videos
    retrieveVideos(channelID, publishedBefore, publishedAfter, "", function(videoResponse: VideoResponse) {
        $.each(videoResponse.videos, function(i, video) {
            //Filter out videos that do not contain the specified title
            if (videoTitle !== "" && video.snippet.title.toLowerCase().indexOf(videoTitle) === -1) {
                return;
            }
            let video_date = moment(video.snippet.publishedAt);
            videoContainer.append(
                `<div class="timeline-video button-result">
                    <a href="http://www.youtube.com/watch?v=${video.id.videoId}" target="_blank">
                        <div class="timeline-video-container btn btn-default" data-video-id="${video.id.videoId}" onclick="watchVideo(this);">
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
        });
        panelBody.find(".fa-spinner").css("display", "none");
        var videoCount = videoResponse.totalResults;
        parent.children(".panel-heading").find("a").append('<span class="badge">' + videoCount + ' videos</span>');
        if (videoCount === "0") {
            parent.find(".panel-collapse").each(disableExpand);
        }
        else {
            if (videoResponse.more && panelBody.find(".videos-show-more").length === 0) {
                panelBody.append(
                    `<button type="button" class="btn btn-info videos-show-more">Show More</button>`
                );
            }
        }

        //Mark watched videos
        videoContainer.find(".timeline-video-container").each(function(i, el) {
            if (session.watchHistory[$(el).attr("data-video-id")]) {
                $(el).removeClass("btn-default").addClass("btn-success");
            }
        });
        if (panelCollapse.hasClass("in")) {
            //If the panel has already opened, scroll to it now
            videoContainer.trigger("timeline-videos-shown");
        }
        //Otherwise, scroll once it has finished opening
        panelCollapse.on("shown.bs.collapse", ScrollToMonth);
        parent.attr('data-videos-loaded', 'true');
    });
}

function resetWatchHistory() {
    if (confirm("Are you sure you want to erase your watch history for this channel?")) {
        if (session.hasLocalStorage) {
            localStorage.removeItem("watchHistory_" + session.channelId);
            sessionStorage.clear();
            location.reload(true);
        }
    }
}

function watchVideo(target) {
    var video = $(target);
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

function FinaliseRestoreSession(event, event_data) {
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
            $("#timeline_year_" + session.lastMonth.year() + "_collapse").collapseChevron("show");
            let month_collapse = $("#timeline_month_" + session.lastMonth.format("YYYY-MM") + "_collapse");
            month_collapse.collapseChevron("show").on("timeline-videos-shown", function() {
                //month_collapse.parent().goTo();
            });
        }
    }

}

$(function() {
    //Some browsers retain form information
    $("#form_channel_name input[type='hidden']").val("");
    $("#form_channel_name").submit(function(event: JQueryEventObject) {
        event.preventDefault();
        submitUsername();
    });
    //Needs to run since the panel is created when the page loads
    $('#channel_results .panel-title a').click(SearchChannelsDropdown).click(onDropdownChevron);
    $("#show_timeline_navigation").click(ToggleMobileNavigation);
    $("#reset_watch_history").click(resetWatchHistory);

    $("#timeline_navigation").scrollToFixed({ marginTop: 10, zIndex: 99 });

    $("#scroll_top").click(function() {
        $('header').goTo();
    });

    //Hook up resize events
    timeouts.onResize = 0;
    $(window).resize(function() {
        if (timeouts.onResize !== 0) {
            clearTimeout(timeouts.onResize);
        }
        timeouts.onResize = setTimeout(function() { onResize(); }, 100);
    });

    showTutorial();
    RestoreSession();
});
