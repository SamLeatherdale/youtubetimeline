/// <reference path="main.ts" />
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
};

/*
 * Utility functions *
 */

function getMomentFromTag(tag) {
    var month = moment.utc(tag, "YYYY-MM");
    return month;
};

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
};

function showMessage(message, level) {
    $("#error_messages").append(
        "<div class='alert alert-" + level + "' role='alert'>" + message + "</div>"
    );
};
/*Session function from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API*/
function storageAvailable(type: string): boolean {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return false;
    }
};

/*Get URL parameter function from http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144*/
function getParameterByName(name: string) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) { return null; }
    if (!results[2]) { return ''; }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/*
 * jQuery functions/Event handlers
 */

function onResize() {
    $("body").css("margin-bottom", $("footer").outerHeight(true));
    if ($(window).width() >= 768 && $("body").hasClass("timeline-modal-open")) {
        $("#show_timeline_navigation").click();
    }
};

$.fn.hideShowPanel = function(callback) {
    return $(this).each(function() {
        if ($(this).hasClass("in")) {
            $(this).on("hidden.bs.collapse", function(e) {
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
};

$.fn.collapseChevron = function(action: string) {
    return $(this).each(function() {
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
    let parent = $(this).parent();
    let month = parent.attr("data-month");
    let videoMonth = getMomentFromTag(parent.attr("data-month"));
    session.lastMonth = videoMonth;

    //Store that this month is open
    session.replaceState({ month: true });

    //Scroll month into view by triggering videos shown event
    if (parent.attr('data-videos-loaded') === "true") {
        return;
    }

    let panelBody = parent.find(".panel-body");
    panelBody.find(".fa-spinner").css("display", "inline-block");
    getVideos(parent, 1);
};

function getMoreVideos() {
    console.log($(this).attr("data-page-number"));
    getVideos($(this).parents(".timeline-month"), parseInt($(this).attr("data-page-number")));
}

function onHideMonth() {
    let parent = $(this).parent();
    let month = parent.attr("data-month");
    // if (session.hasSessionStorage) {
    //     if (session.openMonths[month]) {
    //         delete session.openMonths[month];
    //         sessionStorage.setItem("openMonths", JSON.stringify(session.openMonths));
    //     }
    // }
};

function onExpandMonth() {
    $(this).on('show.bs.collapse', onShowMonth);
    $(this).on('hide.bs.collapse', onHideMonth);
};

function ScrollToMonth() {
    if ($(this).hasClass("timeline-month")) {
        $(this).goTo();
    }
    else {
        $(this).parents(".timeline-month").goTo();
    }
};

function SelectChannel(event: JQueryEventObject) {
    event.preventDefault();
    let channelID: string = $(this).parent().attr("data-channel-ID");
    console.log(channelID);
    $("#channel_results_collapse").collapseChevron("hide");
    if (channelID === $("#input_channel_ID").val()) {
        return;
    }
    $(".channel-result .btn").removeClass("active");
    $(this).addClass("active");
    $("#input_channel_ID").val(channelID);
    processChannel(channelID, false);
};

function SearchChannelsDropdown() {
    if (!session.channelSearchCompleted) {
        session.channelSearchCompleted = true;
        searchChannels(session.channelName, false);
    }
};

function ExpandAll() {
    var parent_body = $(this).parent();
    parent_body.find(".panel-collapse").collapseChevron("show");
};

function CollapseAll() {
    var parent_body = $(this).parent();
    parent_body.find(".panel-collapse").collapseChevron("hide");
};

function JumpToYear(event: JQueryEventObject) {
    event.preventDefault();
    $($(this).attr('href')).goTo();
    CloseMobileNavigation();
};

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
        $("#modal_background").show().click(function() {
            $("#show_timeline_navigation").click();
        });
        $(window).resize();
    }
    else {
        button.attr("data-status", "hidden");
        button.find(".fa").removeClass("fa-times").addClass("fa-bars");
        timeline_nav.animate({ width: "0" }, {
            complete: function() {
                timeline_nav.hide();
                $("body").removeClass("timeline-modal-open");
                $("#modal_background").hide().off("click");
                $(window).resize();
            }
        });
    }
};

function BindRestoreSessionHandler() {
    $("#session_restore_dialog").modal({
        backdrop: "static",
        keyboard: false,
        show: true
    });
    $(document).one({"restore-complete": FinaliseRestoreSession});
};

function disableExpand() {
    $(this).collapseChevron("hide");
    $(this).css("display", "none");
    let toggle_link = $(this).parent().children(".panel-heading").find("a");
    toggle_link.off();
    toggle_link.attr("href", "");
    toggle_link.addClass("disabled-link");
    toggle_link.children('.glyphicon').css('display', 'none');
};

$.fn.goTo = function() {
    $('html, body').animate({
        scrollTop: $(this).offset().top + 'px'
    }, 'fast');
    return this;
};
