export class Video {
  id: VideoId;
  snippet: Snippet;
}

export class VideoId {
  videoId: string;
}

export class VideoResponse {
    constructor() {
        this.more = false;
        this.pageNumber = 1;
    }
    videos: any;
    more: boolean;
    pageNumber: number;
    totalResults: string;
}


export class Snippet {
  publishedAt: string;
  title: string;
  thumbnails: Thumbnails;
}
export class Channel {
  id: string;
  statistics: Statistics;
  snippet: Snippet;
  //For vanity URL
  username: string;
}
export class SearchChannel {
  id: SearchChannelId;
}
export class SearchChannelId {
  kind: string;
  channelId: string;
}
export class Thumbnails {
  medium: Thumbnail;
}
export class Thumbnail {
  url: string;
}
export class Statistics {
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
}
export class Timeouts {
  onResize: number;
  errorMessagesEmpty: number;
}
