import $ from "jquery";
import moment from "moment";
import { Channel } from "./classes";
import { host_url, session } from "./globals";
import { storageAvailable } from "./utility";

//import moment = moment;
//Custom events defined in this script include:
//timeline-videos-shown, restore-complete
export default class Session {
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
        options = $.extend({}, { month: false, default: false }, options);
        if (options.default) {
            history.replaceState({}, "YouTube Timeline", host_url);
            return;
        }
        let channelString = (typeof this.channel.username !== "undefined") ? host_url + "?user=" + encodeURIComponent(this.channel.username) : host_url + "?channel=" + encodeURIComponent(this.channelId);
        if (options.month) {
            history.replaceState({}, this.channel.snippet.title + " - " + this.lastMonth.format("MMMM YYYY"), channelString + "&lastMonth=" + encodeURIComponent(this.lastMonth.format("YYYY/MM")));
        } else {
            history.replaceState({}, this.channel.snippet.title, channelString);
            document.title = this.channel.snippet.title + " - YouTube Timeline";
        }

    }
}
