(function () {

    var eventsHooked = false;

    var hashes = {};

    function getHashWithoutSharp() {
        // Do not use "window.location.hash" for a FireFox bug on encoding/decoding
        var loc = window.location.toString();
        var i = loc.indexOf("#");
        if (i > 0) {
            var hashWithoutSharp = $.trim(loc.substring(i + 1));
            if (hashWithoutSharp)
                return hashWithoutSharp;
        }

        //No hash part found; return empty string
        return "";
    }

    function ensureEventsAreHooked() {
        //Do nothing if event handlers are already attached
        if (eventsHooked)
            return;

        //Hook to the "hashchange" event
        window.onhashchange = function () {
            var hashWithoutSharp = getHashWithoutSharp();
            navigateToHistoryPoint(hashWithoutSharp);
        };

        eventsHooked = true;
    }

    function setStartingPoint(action) {
        //Make sure we are listening to history events
        ensureEventsAreHooked();

        //Associate the empty hash url with the callback
        hashes[""] = action;

        //Execute the action
        if (action)
            action();
    }

    function addHistoryPoint(action) {
        //Make sure we are listening to history events
        ensureEventsAreHooked();

        //Create a unique hash url
        var hashWithoutSharp = jpvs.randomString(10);
        var url = "#" + hashWithoutSharp;

        //Associate it with the callback that modifies the page
        hashes[hashWithoutSharp] = action;

        //Now navigate to the url, so the "hashchange" event is triggered, so "navigateToHistoryPoint(hashWithoutSharp)" is called,
        //so the action is executed
        window.location = url;
    }

    function navigateToHistoryPoint(hashWithoutSharp) {
        //Get the action...
        var action = hashes[hashWithoutSharp];

        //Execute it
        if (action)
            action();
    }

    function reloadCurrentHistoryPoint() {
        //Make sure we are listening to history events
        ensureEventsAreHooked();

        var hashWithoutSharp = getHashWithoutSharp();
        navigateToHistoryPoint(hashWithoutSharp);
    }

    jpvs.History = {
        setStartingPoint: setStartingPoint,
        addHistoryPoint: addHistoryPoint,
        reloadCurrentHistoryPoint: reloadCurrentHistoryPoint
    };

})();
