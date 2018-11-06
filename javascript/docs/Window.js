window.jpvs = window.jpvs || {};

jpvs.Window = {
    parseQueryString: function () {
        /// <summary>Parses the current url query string and returns an object with keys and values.</summary>
    },

    open: function (url, windowName, windowFeatures) {
        /// <summary>Opens a new window or tab and optionally passes a javascript object to the new window. 
        /// It is mapped directly to the standard window.open function. In addition, returns an object that
        /// contains a "function withData(value)", so it may be used like this:
        /// jpvs.Window.open(url).withData(value);
        /// In the opened page, a call to jpvs.Window.getData can be used to get the passed value, 
        /// which persists even after a page navigation or a tab refresh.
        /// </summary>
    },

    navigateTo: function (url) {
        /// <summary>Navigates to a new url in the same browser tab and optionally passes a javascript object to the new page. 
        /// In addition, returns an object that
        /// contains a "function withData(value)", so it may be used like this:
        /// jpvs.Window.navigateTo(url).withData(value);
        /// In the opened page, a call to jpvs.Window.getData can be used to get the passed value, 
        /// which persists even after a page navigation or a tab refresh.
        /// </summary>
    },

    getData: function () {
        /// <summary>Retrieves the optional data passed via jpvs.Window.open(...).withData(...) 
        /// or jpvs.Window.navigateTo(...).withData(...).</summary>
    }
};

