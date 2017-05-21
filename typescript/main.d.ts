interface JQuery {
    goTo(): JQuery;
    collapseChevron(mode: string): JQuery;
    hideShowPanel(callback: Function): JQuery;
    //one(events: string, handler: () => void): JQuery;
}
