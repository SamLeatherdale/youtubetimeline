/// <reference path="main.ts" />

import moment from "moment";
import { session, APPLICATION_VERSION } from "./globals";
import { FinaliseRestoreSession, getVideos, processChannel, searchChannels } from "./main";

export function showTutorial() {
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
 * Utility export functions *
 */

export function getMomentFromTag(tag) {
    var month = moment.utc(tag, "YYYY-MM");
    return month;
};

export function addCommas(nStr) {
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

export function showMessage(message, level) {
    $("#error_messages").append(
        "<div class='alert alert-" + level + "' role='alert'>" + message + "</div>"
    );
};
/*Session export function from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API*/
export function storageAvailable(type: string): boolean {
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

/*Get URL parameter export function from https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144*/
export function getParameterByName(name: string) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) { return null; }
    if (!results[2]) { return ''; }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/*
 * jQuery export functions/Event handlers
 */

export function onResize() {
    $("body").css("margin-bottom", $("footer").outerHeight(true));
    if ($(window).width() >= 768 && $("body").hasClass("timeline-modal-open")) {
        $("#show_timeline_navigation").click();
    }
};

export function hideShowPanel(el: JQuery, callback: () => void) {
    return el.each(function() {
        if ($(this).hasClass("in")) {
            $(this).on("hidden.bs.collapse", function(e) {
                callback();
                collapseChevron($(e.delegateTarget as unknown as JQuery<HTMLElement>), "show");
                $(this).off("hidden.bs.collapse");
            });
            collapseChevron($(this), "hide");
        }
        else {
            callback();
            collapseChevron($(this), "show");
        }
    });
};

export function onDropdownChevron() {
    var icon_container = $(this).children(".glyphicon");
    if (icon_container.hasClass("glyphicon-chevron-down")) {
        icon_container.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
    }
    else {
        icon_container.removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
    }
};

export function collapseChevron(el: JQuery, action: "toggle" | "show" | "hide") {
    return el.each(function() {
        var icon_container = el.parent().children(".panel-heading").find(".glyphicon");
        if (action == "show") {
            icon_container.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
        }
        else if (action == "hide") {
            icon_container.removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
        }
        el.collapse(action);
    });
};

export function onShowMonth() {
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

export function getMoreVideos() {
    console.log($(this).attr("data-page-number"));
    getVideos($(this).parents(".timeline-month"), parseInt($(this).attr("data-page-number")));
}

export function onHideMonth() {
    let parent = $(this).parent();
    let month = parent.attr("data-month");
    // if (session.hasSessionStorage) {
    //     if (session.openMonths[month]) {
    //         delete session.openMonths[month];
    //         sessionStorage.setItem("openMonths", JSON.stringify(session.openMonths));
    //     }
    // }
};

export function onExpandMonth() {
    $(this).on('show.bs.collapse', onShowMonth);
    $(this).on('hide.bs.collapse', onHideMonth);
};

export function ScrollToMonth() {
    if ($(this).hasClass("timeline-month")) {
        goTo($(this));
    }
    else {
        goTo($(this).parents(".timeline-month"));
    }
};

export function SelectChannel(event) {
    event.preventDefault();
    let channelID: string = $(this).parent().attr("data-channel-ID");
    console.log(channelID);
    collapseChevron($("#channel_results_collapse"), "hide");
    if (channelID === $("#input_channel_ID").val()) {
        return;
    }
    $(".channel-result .btn").removeClass("active");
    $(this).addClass("active");
    $("#input_channel_ID").val(channelID);
    processChannel(channelID, false);
}

export function SearchChannelsDropdown() {
    if (!session.channelSearchCompleted) {
        session.channelSearchCompleted = true;
        searchChannels(session.channelName, false);
    }
};

export function ExpandAll() {
    var parent_body = $(this).parent();
    collapseChevron(parent_body.find(".panel-collapse"), "show");
};

export function CollapseAll() {
    var parent_body = $(this).parent();
    collapseChevron(parent_body.find(".panel-collapse"), "hide");
};

export function JumpToYear(event) {
    event.preventDefault();
    goTo($($(this).attr('href')));
    CloseMobileNavigation();
};

export function CloseMobileNavigation() {
    if ($("body").hasClass("timeline-modal-open")) {
        $("#show_timeline_navigation").click();
    }
}

export function ToggleMobileNavigation() {
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

export function BindRestoreSessionHandler() {
    $("#session_restore_dialog").modal({
        backdrop: "static",
        keyboard: false,
        show: true
    });
    $(document).one({"restore-complete": FinaliseRestoreSession});
};

export function disableExpand() {
    collapseChevron($(this), "hide");
    $(this).css("display", "none");
    let toggle_link = $(this).parent().children(".panel-heading").find("a");
    toggle_link.off();
    toggle_link.attr("href", "");
    toggle_link.addClass("disabled-link");
    toggle_link.children('.glyphicon').css('display', 'none');
};

export function goTo(el: JQuery) {
    $('html, body').animate({
        scrollTop: el.offset().top + 'px'
    }, 'fast');
};
