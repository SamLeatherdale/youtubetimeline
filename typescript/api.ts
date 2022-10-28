import moment from "moment";
import lscache from "lscache";
import { API_KEY } from "./globals";
import {Video, VideoResponse} from "./classes";

class CacheMonth {
    constructor() {
        this.videos = {};
        this.retrievedAll = false
    }
    lastUpdated: string
    videos: any
    retrievedAll: boolean
    nextPageToken: string
}
export function retrieveVideos(channelID: string, publishedBefore: moment.Moment, publishedAfter: moment.Moment, pageNumber: number, callback: Function) {
    //Try the cache
    let VIDEOS_PER_PAGE = 50;
    let cacheKey = channelID + "/" + publishedAfter.format("YYYY/MM");
    let cacheMonth: CacheMonth = lscache.get(cacheKey);
    let numVideos = 0;
    let videoResponse = new VideoResponse();
    let refresh = false;
    let refreshLatestOnly = false;
    let refreshNextPage = false;
    if (cacheMonth === null) {
        refresh = true;
        cacheMonth = new CacheMonth();
    }
    else {
        numVideos = Object.keys(cacheMonth.videos).length;
        console.log("# videos: " + numVideos);
        console.log("Page number: " + pageNumber);
        let lastUpdated = moment(cacheMonth.lastUpdated);
        if (moment(lastUpdated).add(1, "days") < moment() && moment(publishedAfter).add(2, "months") > moment()) {
            //It has been at least 1 day since update, and the month is in the past two months
            refresh = true;
            refreshLatestOnly = true;
            console.log("Refreshing due to timeout");
        }
        else if (pageNumber * VIDEOS_PER_PAGE > numVideos && !cacheMonth.retrievedAll) {
            refresh = true;
            refreshNextPage = true;
            console.log("Getting next page");
        }
    }
    if (refresh) {
        console.log("%c Refreshing from YouTube Data API", "background-color: red; color: white;");
        //Cache miss, get videos
        var values: any = {
            part : 'snippet',
            channelId : channelID,
            maxResults: VIDEOS_PER_PAGE,
            type: "video",
            publishedAfter: publishedAfter.toISOString(),
            publishedBefore: publishedBefore.toISOString(),
            order: "date",
            fields: "nextPageToken,pageInfo/totalResults,items/id/videoId,items/snippet/publishedAt,items/snippet/title,items/snippet/thumbnails/medium/url",
            key: API_KEY
        };
        if (refreshNextPage) {
            values.pageToken = cacheMonth.nextPageToken;
        }
        $.get(
            "https://www.googleapis.com/youtube/v3/search",
            values,
            function(data) {
                let previousUpdate = false;
                $.each(data.items, function(i, video: Video) {
                    if (cacheMonth.videos[video.id.videoId] === undefined) {
                        cacheMonth.videos[video.id.videoId] = video;
                    }
                    else if (refreshLatestOnly) {
                        //We have caught up to the previously saved videos, stop here
                        return false;
                    }
                });
                if (data.nextPageToken === undefined) {
                    cacheMonth.retrievedAll = true;
                    cacheMonth.nextPageToken = "";
                }
                else {
                    videoResponse.more = true;
                    videoResponse.pageNumber = pageNumber + 1;
                    if (!refreshLatestOnly) {
                        cacheMonth.nextPageToken = data.nextPageToken;
                    }
                }
                cacheMonth.lastUpdated = moment().toISOString();
                //Write it back to the cache, expiring after a month
                lscache.set(cacheKey, cacheMonth, 43200);
                let videos = convertVideosToArray(cacheMonth.videos);
                videoResponse.videos = videos.slice((pageNumber - 1) * VIDEOS_PER_PAGE, pageNumber * VIDEOS_PER_PAGE);
                videoResponse.totalResults = Object.keys(cacheMonth.videos).length.toString() + ((cacheMonth.retrievedAll) ? "" : "+");
                videoResponse.pageNumber = pageNumber + 1;
                callback(videoResponse);
            }
        );
    }
    else if (numVideos > (pageNumber - 1) * VIDEOS_PER_PAGE) {
        console.log("%c Using lscache", "background-color: limegreen");
        let videos = convertVideosToArray(cacheMonth.videos);
        videoResponse.videos = videos.slice((pageNumber - 1) * VIDEOS_PER_PAGE, pageNumber * VIDEOS_PER_PAGE);
        if (cacheMonth.retrievedAll == false || numVideos > pageNumber * VIDEOS_PER_PAGE) {
            videoResponse.more = true;
            videoResponse.pageNumber = pageNumber + 1;
        }
        videoResponse.totalResults = numVideos.toString() + ((cacheMonth.retrievedAll) ? "" : "+");

        callback(videoResponse);
    }
    else {
        console.log("No more videos");
    }

}
function sortVideos(a: Video, b: Video) {
    if (moment(a.snippet.publishedAt) > moment(b.snippet.publishedAt)) {
        return -1;
    }
    else if (moment(a.snippet.publishedAt) < moment(b.snippet.publishedAt)) {
        return 1;
    }
    return 0;
}
function convertVideosToArray(videos) : Video[] {
    let video_array: Video[] =  $.map(videos, function(video) { return video });
    video_array.sort(sortVideos);
    return video_array;
}
