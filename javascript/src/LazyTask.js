(function () {

    var taskMap = {};

    jpvs.lazily = function (taskFunction) {
        jpvs.runLazyTask(taskFunction.toString(), 500, taskFunction);
    };

    jpvs.runLazyTask = function (taskID, delayMillisec, taskFunction) {
        if (!taskFunction)
            return;

        //If a timer is already running, then clear it
        jpvs.cancelLazyTask(taskID);

        //Then schedule (or reschedule) after delayMillisec
        taskMap[taskID] = setTimeout(run, delayMillisec);

        function run() {
            //Before launching the task function, let's delete the timeout ID
            delete taskMap[taskID];

            //Run the task
            if (taskFunction)
                taskFunction();
        }
    };

    jpvs.cancelLazyTask = function (taskID) {
        //If a timer is already running, then clear it
        var timeoutID = taskMap[taskID];
        if (timeoutID !== null && timeoutID !== undefined)
            clearTimeout(timeoutID);

        delete taskMap[taskID];
    };

})();
