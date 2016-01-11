(function () {

    var eventsHooked = false;

    //Here we save the actions associated to history points (we prefer session storage, when available; otherwise we use a variable)
    var historyPoints = window.sessionStorage || {};

    //Temporary flag used for suppressing immediate execution of a history point function
    var tempSuppress = false;

    function getKey(hash) {
        return "jpvsHist" + location.pathname + "#" + hash;
    }

    function loadAndExecHash(hash) {
        //Load and call the function associated to the given history point (hash url)
        var serializedCall = historyPoints[getKey(hash)];
        if (serializedCall)
            jpvs.Function.deserializeCall(serializedCall);
    }

    function saveHash(hash, args, action) {
        //Serialize the function call for later execution (when the user hits the browser back button)
        var serializedCall = jpvs.Function.serializeCall(args, action);
        historyPoints[getKey(hash)] = serializedCall;
    }

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
            //If the temporary "suppress execution" flag is on, we ignore this single "hash change" event
            if (tempSuppress) {
                tempSuppress = false;
                return;
            }

            //Otherwise, we execute the history point function
            var hashWithoutSharp = getHashWithoutSharp();
            navigateToHistoryPoint(hashWithoutSharp);
        };

        eventsHooked = true;
    }

    function setStartingHistoryPoint(argsArray, action) {
        //Make sure we are listening to history events
        ensureEventsAreHooked();

        //Save the action for later execution when the user goes back in the browser history
        //The action is associated to the page name without hash
        saveHash("", argsArray, action);

        //Execute the action immediately
        loadAndExecHash("");
    }

    function addHistoryPoint(argsArray, action, suppressImmediateExecution) {
        //Make sure we are listening to history events
        ensureEventsAreHooked();

        //Create a unique hash url
        var hashWithoutSharp = jpvs.randomString(10);
        var url = "#" + hashWithoutSharp;

        //Associate it with the callback
        saveHash(hashWithoutSharp, argsArray, action);

        //Now navigate to the url, so the url goes into the browser history, so the "hashchange" event is triggered, 
        //so "navigateToHistoryPoint(hashWithoutSharp)" is called, so the action is (optionally) executed
        //To suppress this immediate execution, we raise a temporary flag
        if (suppressImmediateExecution)
            tempSuppress = true;

        window.location = url;
    }

    function navigateToHistoryPoint(hashWithoutSharp) {
        //Get the action and execute it
        loadAndExecHash(hashWithoutSharp);
    }

    function reloadCurrentHistoryPoint() {
        //Make sure we are listening to history events
        ensureEventsAreHooked();

        var hashWithoutSharp = getHashWithoutSharp();
        navigateToHistoryPoint(hashWithoutSharp);
    }

    jpvs.History = {
        setStartingHistoryPoint: setStartingHistoryPoint,
        addHistoryPoint: addHistoryPoint,
        reloadCurrentHistoryPoint: reloadCurrentHistoryPoint
    };

})();
