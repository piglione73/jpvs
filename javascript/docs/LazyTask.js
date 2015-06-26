window.jpvs = window.jpvs || {};


jpvs.runLazyTask = function (taskID, delayMillisec, taskFunction) {
    /// <summary>Schedules or reschedules a task to run after "delayMillisec". The task is uniquely identified by the given "taskID".
    /// The "taskFunction" is scheduled to run "delayMillisec" after calling this function. However, if during the delayMillisec wait period
    /// this function is called again, then the previously scheduled run of "taskFunction" is canceled and rescheduled "delayMillisec" from now.</summary>
    /// <param name="taskID" type="String">ID that will be attached to this task.</param>
    /// <param name="delayMillisec" type="Number">Delay in milliseconds, after which the lazy task will be run.</param>
    /// <param name="taskFunction" type="Function">Function that represents the task to be run.</param>
};

jpvs.cancelLazyTask = function (taskID) {
    /// <summary>Cancels a scheduled lazy task.</summary>
    /// <param name="taskID" type="String">ID that will be attached to this task.</param>
};
