(function () {
    var exports = {};
    jpvs.Window = exports;

    exports.parseQueryString = parseQueryString;
    function parseQueryString() {
        // Leggiamo tutti i campi della query string
        var queryString = {};
        location.href.replace(/([^?=&]+)(=([^&]*))?/g, function ($0, $1, $2, $3) {
            queryString[$1] = decodeURIComponent($3);
        });

        return queryString;
    }


    exports.open = open;
    function open(url, windowName, windowFeatures) {
        var modifiedUrl = url;

        setTimeout(function () {
            var wnd;
            if (windowFeatures)
                wnd = window.open(modifiedUrl, windowName, windowFeatures);
            else if (windowName)
                wnd = window.open(modifiedUrl, windowName);
            else
                wnd = window.open(modifiedUrl);

            if (wnd)
                wnd.focus();
        }, 10);

        return {
            withData: function (data) {
                var dataSlotName = jpvs.randomString(10);
                localStorage[dataSlotName] = jpvs.toJSON(data);
                modifiedUrl = addDataSlotName(modifiedUrl, dataSlotName);
            }
        };
    }


    exports.navigateTo = navigateTo;
    function navigateTo(url) {
        var modifiedUrl = url;

        setTimeout(function () {
            location = modifiedUrl;
        }, 10);

        return {
            withData: function (data) {
                var dataSlotName = jpvs.randomString(10);
                localStorage[dataSlotName] = jpvs.toJSON(data);
                modifiedUrl = addDataSlotName(modifiedUrl, dataSlotName);
            }
        };
    }

    function addDataSlotName(url, dataSlotName) {
        if (url.indexOf("?") < 0)
            return url + "?jpvs=" + dataSlotName;
        else
            return url + "&jpvs=" + dataSlotName;
    }

    exports.getData = getData;
    function getData() {
        var queryString = parseQueryString();
        var dataSlotName = queryString["jpvs"];
        if (!dataSlotName)
            return null;

        //Move to sessionStorage and clear from localStorage, so it does not persist after we close the browser, but it persists
        //over a page refresh or navigation in the same browser tab
        var jsonValue = localStorage[dataSlotName] || sessionStorage[dataSlotName] || null;
        localStorage.removeItem(dataSlotName);

        if (jsonValue) {
            sessionStorage[dataSlotName] = jsonValue;
            return jpvs.parseJSON(jsonValue);
        }
        else
            return null;
    }

})();
