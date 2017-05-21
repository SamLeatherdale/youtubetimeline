var CacheMonth = (function () {
    function CacheMonth(lastUpdated) {
        this.lastUpdated = lastUpdated;
        this.videos = {};
        this.retrievedAll = false;
    }
    return CacheMonth;
}());
function retrieveVideos(channelID, publishedBefore, publishedAfter, nextPageToken, callback) {
    var cacheKey = channelID + "/" + publishedAfter.format("YYYY/MM");
    var cacheMonth = lscache.get(cacheKey);
    var videoResponse = new VideoResponse();
    var refresh = false;
    var refreshLatestOnly = false;
    if (cacheMonth === null) {
        refresh = true;
        cacheMonth = new CacheMonth(moment().toISOString());
    }
    else {
        var lastUpdated = moment(cacheMonth.lastUpdated);
        if (moment(lastUpdated).add(1, "days") < moment() && moment(publishedAfter).add(2, "months") > moment()) {
            refresh = true;
            refreshLatestOnly = true;
        }
    }
    if (refresh) {
        console.log("Refreshing from YouTube Data API");
        var values = {
            part: 'snippet',
            channelId: channelID,
            maxResults: 50,
            type: "video",
            publishedAfter: publishedAfter.toISOString(),
            publishedBefore: publishedBefore.toISOString(),
            order: "date",
            fields: "nextPageToken,pageInfo/totalResults,items/id/videoId,items/snippet/publishedAt,items/snippet/title,items/snippet/thumbnails/medium/url",
            key: apiKey
        };
        if (nextPageToken !== "") {
            values.pageToken = nextPageToken;
        }
        $.get("https://www.googleapis.com/youtube/v3/search", values, function (data) {
            var previousUpdate = false;
            $.each(data.items, function (i, video) {
                if (cacheMonth.videos[video.id.videoId] === undefined) {
                    cacheMonth.videos[video.id.videoId] = video;
                }
                else if (refreshLatestOnly) {
                    return false;
                }
            });
            if (data.nextPageToken === undefined) {
                cacheMonth.retrievedAll = true;
                cacheMonth.nextPageToken = "";
            }
            else {
                videoResponse.more = true;
                if (!refreshLatestOnly) {
                    cacheMonth.nextPageToken = data.nextPageToken;
                }
            }
            lscache.set(cacheKey, cacheMonth, 43200);
            videoResponse.videos = data.items;
            videoResponse.totalResults = Object.keys(cacheMonth.videos).length.toString() + ((cacheMonth.retrievedAll) ? "" : "+");
            callback(videoResponse);
        });
    }
    else {
        console.log("Using lscache");
        videoResponse.videos = cacheMonth.videos;
        if (cacheMonth.retrievedAll == false) {
            videoResponse.more = true;
        }
        videoResponse.totalResults = Object.keys(cacheMonth.videos).length.toString() + ((cacheMonth.retrievedAll) ? "" : "+");
        callback(videoResponse);
    }
}
"use strict";
var Session = (function () {
    function Session() {
        this.channelSearchCompleted = false;
        this.channelDate = moment();
        this.openMonths = {};
        this.watchHistory = {};
        this.hasSessionStorage = storageAvailable("sessionStorage");
        this.hasLocalStorage = storageAvailable("localStorage");
    }
    Session.prototype.loadWatchHistory = function () {
        if (this.hasLocalStorage && localStorage.getItem("watchHistory_" + this.channelId)) {
            this.watchHistory = JSON.parse(localStorage.getItem("watchHistory_" + this.channelId));
        }
    };
    Session.prototype.replaceState = function (options) {
        options = $.extend({}, { month: false, default: false }, options);
        if (options.default) {
            history.replaceState({}, "YouTube Timeline", host_url);
            return;
        }
        var channelString = (typeof session.channel.username !== "undefined") ? host_url + "?user=" + encodeURIComponent(this.channel.username) : host_url + "?channel=" + encodeURIComponent(session.channelId);
        if (options.month) {
            history.replaceState({}, this.channel.snippet.title + " - " + this.lastMonth.format("MMMM YYYY"), channelString + "&lastMonth=" + encodeURIComponent(this.lastMonth.format("YYYY/MM")));
        }
        else {
            history.replaceState({}, this.channel.snippet.title, channelString);
            document.title = this.channel.snippet.title + " - YouTube Timeline";
        }
    };
    return Session;
}());
;
var Channel = (function () {
    function Channel() {
    }
    return Channel;
}());
var Snippet = (function () {
    function Snippet() {
    }
    return Snippet;
}());
var Thumbnails = (function () {
    function Thumbnails() {
    }
    return Thumbnails;
}());
var Thumbnail = (function () {
    function Thumbnail() {
    }
    return Thumbnail;
}());
var Statistics = (function () {
    function Statistics() {
    }
    return Statistics;
}());
var Video = (function () {
    function Video() {
    }
    return Video;
}());
var VideoId = (function () {
    function VideoId() {
    }
    return VideoId;
}());
var Timeouts = (function () {
    function Timeouts() {
    }
    return Timeouts;
}());
var VideoResponse = (function () {
    function VideoResponse() {
        this.more = false;
        this.page = 1;
    }
    return VideoResponse;
}());
var session = new Session();
var timeouts = new Timeouts();
var APPLICATION_VERSION = "103";
var host_url = (window.location.hostname == "localhost") ? "/youtubetimelinejs/youtubetimeline/" : "/";
var apiKey = "AIzaSyD7qhxl1x67T5l8itG9jGZ4Oa69gBeVurw";
function submitUsername() {
    var channel_name = $("#input_channel_name").val();
    var search_term = $("#input_video_title").val();
    if (channel_name === session.channelName && search_term === session.searchTerm) {
        return;
    }
    else if (channel_name === session.channelName && search_term !== session.searchTerm) {
        session.searchTerm = search_term;
        createTimeline(session.channelDate);
        $('#timeline_container').goTo();
        return;
    }
    session.channelName = channel_name;
    session.searchTerm = search_term;
    $("#error_messages > *").addClass("clear").slideUp();
    $("#error_messages > *").slideUp();
    timeouts.errorMessagesEmpty = setTimeout(function () {
        $("#error_messages > .clear").remove();
    }, 400);
    if (channel_name === "") {
        $("#input_group_channel_name").addClass("has-error");
        return;
    }
    $("#input_group_channel_name").removeClass("has-error");
    var results_panel = $("#channel_results > .panel");
    $.get("https://www.googleapis.com/youtube/v3/channels", {
        part: 'id',
        forUsername: channel_name,
        fields: "pageInfo/totalResults,items/id",
        key: apiKey
    }, function (data) {
        if (data.pageInfo.totalResults === 0) {
            $(document).trigger("restore-complete", { success: false });
            session.channelSearchCompleted = true;
            $("#channel_results_description").text("Did you mean...");
            results_panel.removeClass("panel-info");
            results_panel.addClass("panel-warning");
            searchChannels(channel_name, true);
        }
        else {
            var channel = data.items[0];
            session.channelSearchCompleted = false;
            $("#channel_results_collapse").collapseChevron("hide");
            $("#channel_result_container").empty();
            $("#channel_results_description").text("Suggestions");
            results_panel.removeClass("panel-warning");
            results_panel.addClass("panel-info");
            session.channelId = channel.id;
            processChannel(session.channelId, true);
            $("#channel_results").css("display", "block");
        }
    }).fail(function (xhr, status, error) {
        $(document).trigger("restore-complete", { success: false });
        if (xhr.status === 400) {
            showMessage("Please enter a channel name and try again.", "danger");
        }
    });
}
function searchChannels(search_term, auto_hide_show) {
    $("#channel_results").css("display", "block");
    if (auto_hide_show) {
        $("#channel_results_collapse").hideShowPanel(function () {
            $("#channel_result_container").empty();
            $("#channel_results_spinner").css("display", "inline-block");
        });
    }
    else {
        $("#channel_results_spinner").css("display", "inline-block");
    }
    $.get("https://www.googleapis.com/youtube/v3/search", {
        part: 'snippet',
        q: search_term,
        type: "channel",
        maxResults: 5,
        filter: "pageInfo/totalResults,items/id",
        key: apiKey
    }, function (data) {
        if (data.pageInfo.totalResults === 0) {
            $("#channel_results_spinner").css("display", "none");
            $("#channel_results").css("display", "none");
            showMessage("No channels found with that name.", "danger");
            return;
        }
        displayChannelSearchResults(data.items);
        $("#channel_results_spinner").css("display", "none");
    }).fail(function (xhr, status, error) {
        if (xhr.status === 400) {
            showMessage("Please enter a channel name and try again.", "warning");
        }
    });
}
function displayChannelSearchResults(channels) {
    var channel_data = [];
    $.each(channels, function (i, channel) {
        $.get("https://www.googleapis.com/youtube/v3/channels", {
            part: 'snippet,statistics',
            id: channel.id,
            key: apiKey
        }, function (data) {
            channel_data.push(channel.items[0]);
        });
    });
    console.log(channel_data);
    channel_data.sort(function (a, b) {
        if (a.statistics.subscriberCount > b.statistics.subscriberCount) {
            return 1;
        }
        else if (a.statistics.subscriberCount < b.statistics.subscriberCount) {
            return -1;
        }
        return 0;
    });
    $.each(channel_data, function (i, channel) {
        var subscribers = "";
        var subscriberClass = "";
        var videoClass = "";
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
        var set_active = "";
        if (session.channelId === channel.id) {
            set_active = " active";
        }
        $("#channel_result_container").append("<div class=\"channel-result button-result\" data-channel-ID=\"" + channel.id + "\">\n                <a class=\"btn btn-default " + set_active + "\" href=\"#\">\n                    <img src=\"" + channel.snippet.thumbnails.medium.url + "\" />\n                    <div class=\"button-result-info-box\">\n                        <div class=\"button-result-info-wrapper\" >\n                            <div class=\"button-result-title smart-break\">" + channel.snippet.title + "</div>\n                            <div class=\"channel-result-badge-container\">\n                                <span class=\"channel-result-subscribers badge " + subscriberClass + "\" data-subscribers=\"" + channel.statistics.subscriberCount + "\">" + subscribers + "</span>\n                                <br />\n                                <span class=\"channel-result-videos badge " + videoClass + "\">" + addCommas(channel.statistics.videoCount) + "</span>\n                            </div>\n                        </div>\n                    </div>\n                </a>\n            </div>");
    });
    $(".channel-result a").click(SelectChannel);
}
function processChannel(channelID, customURL) {
    $.get("https://www.googleapis.com/youtube/v3/channels", {
        part: 'snippet,statistics',
        id: channelID,
        key: apiKey
    }, function (data) {
        if (data.pageInfo.totalResults === 0) {
            showMessage("Channel ID invalid. Please try again.", "danger");
            $(document).trigger("restore-complete", { success: false });
            return;
        }
        var channel = data.items[0];
        console.log(channel);
        var subscribers = "";
        if (channel.statistics.hiddenSubscriberCount === true) {
            subscribers = "Private";
        }
        else {
            subscribers = addCommas(channel.statistics.subscriberCount.toString());
        }
        $("#channel_info_container").empty();
        $("#channel_info_container").append("<div id=\"channel_info\">\n                    <a href=\"http://www.youtube.com/channel/" + channel.id + "\" target=\"_blank\" >\n                        <img src=\"" + channel.snippet.thumbnails.medium.url + "\" />\n                    </a>\n                    <div class=\"channel-info-details\">\n                        <div class=\"channel-info-details-wrapper\">\n                            <a href=\"http://www.youtube.com/channel/" + channel.id + "\" target=\"_blank\" >\n                                <div class=\"channel-info-name\">" + channel.snippet.title + "</div>\n                            </a>\n                            <div class=\"channel-info-subscribers\">" + subscribers + " subscribers</div>\n                            <div class=\"channel-info-videos\">" + addCommas(channel.statistics.videoCount) + " videos</div>\n                        </div>\n                    </div>\n                </div>");
        session.channelDate = moment(channel.snippet.publishedAt);
        session.channelId = channel.id;
        if (customURL) {
            channel.username = session.channelName;
        }
        session.channel = channel;
        session.replaceState();
        session.loadWatchHistory();
        createTimeline(session.channelDate);
    }).fail(function (xhr, status, error) {
        if (xhr.status === 404) {
        }
    });
}
function createTimeline(channelDate) {
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
    }
    else {
        $("#reset_watch_history").hide();
    }
    $("#timeline_container_buttons").show();
    while (yearLoopDate.isSameOrAfter(channelDate, "year")) {
        var id_string = 'timeline_year_' + yearLoopDate.year();
        $("#timeline_accordion").append("<div class=\"timeline-year panel panel-default\" id=\"" + id_string + "\">\n                <div class=\"panel-heading\" role=\"tab\" id=\"" + id_string + "_heading\">\n                    <h4 class=\"panel-title\">\n                        <a role=\"button\" data-toggle=\"collapse\" data-parent=\"#" + id_string + "\" href=\"#" + id_string + "_collapse\" aria-expanded=\"true\" aria-controls=\"" + id_string + "_collapse\">\n                            <span class=\"glyphicon glyphicon-chevron-down\"></span><span class=\"timeline-year-label\">" + yearLoopDate.year() + "</span>\n                        </a>\n                    </h4>\n                </div>\n                <div id=\"" + id_string + "_collapse\" class=\"panel-collapse collapse\" role=\"tabpanel\" aria-labelledby=\"" + id_string + "_heading\">\n                    <div class=\"panel-body\">\n                        <button type=\"button\" class=\"btn btn-info timeline-expand-all\">Expand All</button>\n                        <button type=\"button\" class=\"btn btn-info timeline-collapse-all\">Collapse All</button>\n                        <div class=\"month-container\"></div>\n                    </div>\n                </div>\n            </div>");
        $(".timeline-navigation > ul").append("<li role=\"presentation\"><a href=\"" + id_string + "_heading\">" + yearLoopDate.year() + "</a></li>");
        yearLoopDate.subtract(1, "years");
    }
    $(".timeline-expand-all").click(ExpandAll);
    $(".timeline-collapse-all").click(CollapseAll);
    $(".timeline-navigation a").click(JumpToYear);
    while (monthLoopDate.isSameOrAfter(channelDate, "month")) {
        var keyMonthYear = monthLoopDate.year() + "-" + monthLoopDate.format("MM");
        var id_string_1 = "timeline_month_" + keyMonthYear;
        $("#timeline_year_" + monthLoopDate.year() + "_collapse .month-container").append("<div class=\"timeline-month panel panel-default\" id=\"" + id_string_1 + "\" data-month=\"" + keyMonthYear + "\">\n                <div class=\"panel-heading\" role=\"tab\" id=\"" + id_string_1 + "_heading\">\n                    <h4 class=\"panel-title\">\n                        <a role=\"button\" data-videos-loaded=\"false\" data-toggle=\"collapse\" data-parent=\"#" + id_string_1 + "\" href=\"#" + id_string_1 + "_collapse\" aria-expanded=\"true\" aria-controls=\"" + id_string_1 + "_collapse\">\n                            <span class=\"glyphicon glyphicon-chevron-down\"></span><span class=\"timeline-month-label\">" + monthLoopDate.format("MMMM YYYY") + "</span>\n                        </a>\n                    </h4>\n                </div>\n                <div id=\"" + id_string_1 + "_collapse\" class=\"panel-collapse collapse\" role=\"tabpanel\" aria-labelledby=\"" + id_string_1 + "_heading\">\n                    <div class=\"panel-body\">\n                        <i class=\"fa fa-spinner fa-pulse\"></i>\n                        <div class=\"video-container\">\n                        </div>\n                    </div>\n                </div>\n            </div>");
        monthLoopDate.subtract(1, "months");
    }
    $(".timeline-month").on("timeline-videos-shown", ScrollToMonth);
    $(".timeline-month .panel-collapse").each(onExpandMonth);
    $('.timeline-month .panel-title a, .timeline-year .panel-title a').click(onDropdownChevron);
    $("#timeline_container").append("<div class=\"timeline-channel-created well yt-red\">\n           <i class=\"fa fa-flag\"></i>\n           <div>Channel created " + channelDate.format("Do MMMM YYYY") + "</div>\n        </div>");
    $('.panel-collapse').collapse({ toggle: false });
    $(document).trigger("restore-complete", { success: true });
}
function getVideos(parent, channelID, videoMonth) {
    var panelCollapse = parent.find(".panel-collapse");
    var panelBody = parent.find(".panel-body");
    var videoContainer = parent.find(".video-container");
    var publishedAfter = videoMonth;
    var publishedBefore = moment(videoMonth).add(1, "months");
    var videoTitle = $("#input_video_title").val().toLowerCase();
    retrieveVideos(channelID, publishedBefore, publishedAfter, "", function (videoResponse) {
        $.each(videoResponse.videos, function (i, video) {
            if (videoTitle !== "" && video.snippet.title.toLowerCase().indexOf(videoTitle) === -1) {
                return;
            }
            var video_date = moment(video.snippet.publishedAt);
            videoContainer.append("<div class=\"timeline-video button-result\">\n                    <a href=\"http://www.youtube.com/watch?v=" + video.id.videoId + "\" target=\"_blank\">\n                        <div class=\"timeline-video-container btn btn-default\" data-video-id=\"" + video.id.videoId + "\" onclick=\"watchVideo(this);\">\n                            <div class=\"timeline-video-date badge yt-red\">" + video_date.format("Do") + "</div>\n                            <div class=\"timeline-video-thumb-container\">\n                                <div class=\"timeline-video-watched\">\n                                    <i class=\"fa fa-check\"></i>\n                                </div>\n                                <img src=\"" + video.snippet.thumbnails.medium.url + "\" />\n                            </div>\n                            <div class=\"button-result-info-box\">\n                                <div class=\"button-result-info-wrapper\" >\n                                   <div class=\"button-result-title smart-break\">" + video.snippet.title + "</div>\n                                   </div>\n                            </div>\n                        </div>\n                   </a>\n                </div>");
        });
        panelBody.find(".fa-spinner").css("display", "none");
        var videoCount = videoResponse.totalResults;
        parent.children(".panel-heading").find("a").append('<span class="badge">' + videoCount + ' videos</span>');
        if (videoCount === "0") {
            parent.find(".panel-collapse").each(disableExpand);
        }
        else {
            if (videoResponse.more && panelBody.find(".videos-show-more").length === 0) {
                panelBody.append("<button type=\"button\" class=\"btn btn-info videos-show-more\">Show More</button>");
            }
        }
        videoContainer.find(".timeline-video-container").each(function (i, el) {
            if (session.watchHistory[$(el).attr("data-video-id")]) {
                $(el).removeClass("btn-default").addClass("btn-success");
            }
        });
        if (panelCollapse.hasClass("in")) {
            videoContainer.trigger("timeline-videos-shown");
        }
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
    var channelId = getParameterByName("channel");
    var channelName = getParameterByName("user");
    if (channelId !== null || channelName !== null) {
        if (channelId !== null) {
            if (channelId == "") {
                session.replaceState({ default: true });
                return;
            }
            session.channelId = channelId;
            var month = getParameterByName("lastMonth");
            if (month !== null) {
                session.lastMonth = moment.utc(month, "YYYY/MM");
            }
            BindRestoreSessionHandler();
            processChannel(session.channelId, false);
        }
        else if (channelName !== null) {
            if (channelName == "") {
                session.replaceState({ default: true });
                return;
            }
            $("#input_channel_name").val(channelName);
            var month = getParameterByName("lastMonth");
            if (month !== null) {
                session.lastMonth = moment.utc(month, "YYYY/MM");
            }
            BindRestoreSessionHandler();
            submitUsername();
        }
    }
}
function FinaliseRestoreSession(event, event_data) {
    $("#session_restore_dialog").modal('hide');
    if (event_data.success) {
        session.loadWatchHistory();
        if (session.lastMonth) {
            $("#timeline_year_" + session.lastMonth.year() + "_collapse").collapseChevron("show");
            var month_collapse = $("#timeline_month_" + session.lastMonth.format("YYYY-MM") + "_collapse");
            month_collapse.collapseChevron("show").on("timeline-videos-shown", function () {
            });
        }
    }
}
$(function () {
    $("#form_channel_name input[type='hidden']").val("");
    $("#form_channel_name").submit(function (event) {
        event.preventDefault();
        submitUsername();
    });
    $('#channel_results .panel-title a').click(SearchChannelsDropdown).click(onDropdownChevron);
    $("#show_timeline_navigation").click(ToggleMobileNavigation);
    $("#reset_watch_history").click(resetWatchHistory);
    $("#timeline_navigation").scrollToFixed({ marginTop: 10, zIndex: 99 });
    $("#scroll_top").click(function () {
        $('header').goTo();
    });
    timeouts.onResize = 0;
    $(window).resize(function () {
        if (timeouts.onResize !== 0) {
            clearTimeout(timeouts.onResize);
        }
        timeouts.onResize = setTimeout(function () { onResize(); }, 100);
    });
    showTutorial();
    RestoreSession();
});
function showTutorial() {
    if (session.hasLocalStorage) {
        if (!localStorage.getItem("applicationVersion") || localStorage.getItem("applicationVersion") != APPLICATION_VERSION) {
            sessionStorage.clear();
            localStorage.clear();
            localStorage.setItem("applicationVersion", APPLICATION_VERSION);
        }
        if (!localStorage.getItem("welcome_message")) {
            $("#welcome_message").show();
            localStorage.setItem("welcome_message", "1");
        }
    }
}
;
function getMomentFromTag(tag) {
    var month = moment.utc(tag, "YYYY-MM");
    return month;
}
;
function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}
;
function showMessage(message, level) {
    $("#error_messages").append("<div class='alert alert-" + level + "' role='alert'>" + message + "</div>");
}
;
function storageAvailable(type) {
    try {
        var storage = window[type], x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return false;
    }
}
;
function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function onResize() {
    $("body").css("margin-bottom", $("footer").outerHeight(true));
    if ($(window).width() >= 768 && $("body").hasClass("timeline-modal-open")) {
        $("#show_timeline_navigation").click();
    }
}
;
$.fn.hideShowPanel = function (callback) {
    return $(this).each(function () {
        if ($(this).hasClass("in")) {
            $(this).on("hidden.bs.collapse", function (e) {
                callback();
                $(e.delegateTarget).collapseChevron("show");
                $(this).off("hidden.bs.collapse");
            });
            $(this).collapseChevron("hide");
        }
        else {
            callback();
            $(this).collapseChevron("show");
        }
    });
};
function onDropdownChevron(event) {
    var icon_container = $(this).children(".glyphicon");
    if (icon_container.hasClass("glyphicon-chevron-down")) {
        icon_container.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
    }
    else {
        icon_container.removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
    }
}
;
$.fn.collapseChevron = function (action) {
    return $(this).each(function () {
        var icon_container = $(this).parent().children(".panel-heading").find(".glyphicon");
        if (action == "show") {
            icon_container.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
        }
        else if (action == "hide") {
            icon_container.removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
        }
        $(this).collapse(action);
    });
};
function onShowMonth() {
    var parent = $(this).parent();
    var month = parent.attr("data-month");
    var videoMonth = getMomentFromTag(parent.attr("data-month"));
    session.lastMonth = videoMonth;
    session.replaceState({ month: true });
    if (parent.attr('data-videos-loaded') === "true") {
        return;
    }
    var panelBody = parent.find(".panel-body");
    panelBody.find(".fa-spinner").css("display", "inline-block");
    getVideos(parent, session.channelId, videoMonth);
}
;
function onHideMonth() {
    var parent = $(this).parent();
    var month = parent.attr("data-month");
}
;
function onExpandMonth() {
    $(this).on('show.bs.collapse', onShowMonth);
    $(this).on('hide.bs.collapse', onHideMonth);
}
;
function ScrollToMonth() {
    if ($(this).hasClass("timeline-month")) {
        $(this).goTo();
    }
    else {
        $(this).parents(".timeline-month").goTo();
    }
}
;
function SelectChannel(event) {
    event.preventDefault();
    var channelID = $(this).parent().attr("data-channel-ID");
    $("#channel_results_collapse").collapseChevron("hide");
    if (channelID === $("#input_channel_ID").val()) {
        return;
    }
    $(".channel-result .btn").removeClass("active");
    $(this).addClass("active");
    $("#input_channel_ID").val(channelID);
    processChannel(channelID, false);
}
;
function SearchChannelsDropdown() {
    if (!session.channelSearchCompleted) {
        session.channelSearchCompleted = true;
        searchChannels(session.channelName, false);
    }
}
;
function ExpandAll() {
    var parent_body = $(this).parent();
    parent_body.find(".panel-collapse").collapseChevron("show");
}
;
function CollapseAll() {
    var parent_body = $(this).parent();
    parent_body.find(".panel-collapse").collapseChevron("hide");
}
;
function JumpToYear(event) {
    event.preventDefault();
    $($(this).attr('href')).goTo();
    CloseMobileNavigation();
}
;
function CloseMobileNavigation() {
    if ($("body").hasClass("timeline-modal-open")) {
        $("#show_timeline_navigation").click();
    }
}
function ToggleMobileNavigation() {
    var button = $(this);
    var timeline_nav = $('#timeline_navigation_mobile');
    if (button.attr("data-status") == "hidden") {
        button.attr("data-status", "shown");
        button.find(".fa").removeClass("fa-bars").addClass("fa-times");
        timeline_nav.css({ display: "flex", width: "0px" }).animate({ width: "140px" });
        $("body").addClass("timeline-modal-open");
        $("#modal_background").show().click(function () {
            $("#show_timeline_navigation").click();
        });
        $(window).resize();
    }
    else {
        button.attr("data-status", "hidden");
        button.find(".fa").removeClass("fa-times").addClass("fa-bars");
        timeline_nav.animate({ width: "0" }, {
            complete: function () {
                timeline_nav.hide();
                $("body").removeClass("timeline-modal-open");
                $("#modal_background").hide().off("click");
                $(window).resize();
            }
        });
    }
}
;
function BindRestoreSessionHandler() {
    $("#session_restore_dialog").modal({
        backdrop: "static",
        keyboard: false,
        show: true
    });
    $(document).one({ "restore-complete": FinaliseRestoreSession });
}
;
function disableExpand() {
    $(this).collapseChevron("hide");
    $(this).css("display", "none");
    var toggle_link = $(this).parent().children(".panel-heading").find("a");
    toggle_link.off();
    toggle_link.attr("href", "");
    toggle_link.addClass("disabled-link");
    toggle_link.children('.glyphicon').css('display', 'none');
}
;
$.fn.goTo = function () {
    $('html, body').animate({
        scrollTop: $(this).offset().top + 'px'
    }, 'fast');
    return this;
};
