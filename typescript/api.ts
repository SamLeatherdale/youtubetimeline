class CacheMonth {
    constructor(lastUpdated: string) {
        this.lastUpdated = lastUpdated;
        this.videos = {};
        this.retrievedAll = false
    }
    lastUpdated: string
    videos: any
    retrievedAll: boolean
    nextPageToken: string
}
function retrieveVideos(channelID: string, publishedBefore: moment.Moment, publishedAfter: moment.Moment, nextPageToken: string, callback: Function) {
    //Try the cache
    let cacheKey = channelID + "/" + publishedAfter.format("YYYY/MM");
    let cacheMonth: CacheMonth = lscache.get(cacheKey);
    let videoResponse = new VideoResponse();
    let refresh = false;
    let refreshLatestOnly = false;
    if (cacheMonth === null) {
        refresh = true;
        cacheMonth = new CacheMonth(moment().toISOString());
    }
    else {
        let lastUpdated = moment(cacheMonth.lastUpdated);
        if (moment(lastUpdated).add(1, "days") < moment() && moment(publishedAfter).add(2, "months") > moment()) {
            //It has been at least 1 day since update, and the month is in the past two months
            refresh = true;
            refreshLatestOnly = true;
        }
    }
    if (refresh) {
        console.log("Refreshing from YouTube Data API");
        //Cache miss, get videos
        var values: any = {
            part : 'snippet',
            channelId : channelID,
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
                    if (!refreshLatestOnly) {
                        cacheMonth.nextPageToken = data.nextPageToken;
                    }
                }
                //Write it back to the cache, expiring after a month
                lscache.set(cacheKey, cacheMonth, 43200);
                videoResponse.videos = data.items;
                videoResponse.totalResults = Object.keys(cacheMonth.videos).length.toString() + ((cacheMonth.retrievedAll) ? "" : "+");
                callback(videoResponse);
            }
        );
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
