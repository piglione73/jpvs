window.jpvs = window.jpvs || {};



jpvs.runTask = function (flagAsync, task, onSuccess, onProgress, onError) {
    /// <summary>Runs a task function synchronously or asynchronously. Utility function that simply acts as a proxy to
    /// either jpvs.runBackgroundTask or jpvs.runForegroundTask.</summary>
    /// <param name="flagAsync" type="Boolean">Set to true for launching the task via jpvs.runBackgroundTask; set to false for 
    /// launching the task via jpvs.runForegroundTask.</param>
    /// <param name="task" type="Function">Must have this signature: function task(ctx) {}. It will be called multiple times. 
    /// On each call, it should execute a very small part of the job in order to yield control as soon as possible. 
    /// The ctx parameter can be freely used for storing execution state or any other data useful to the task itself. 
    /// At the end, the task function may set some value into ctx.returnValue and this value will be passed on to the
    /// onSuccess callback. The task function can return three types of values:
    /// null/undefined/false means the task is complete. In this case, the task function will never get called again. 
    /// If it returns true, it means the task is not complete. In this case, the task function will be called again with default
    /// settings of CPU usage and uninterrupted run time duration. 
    /// Otherwise, it can return an object like this (all is optional): 
    /// { cpu: a number between 0 and 1, minRunTimeMs: minimum number of milliseconds of uninterrupted run time before yielding 
    /// control back to the caller, progress: any object }. In this case, the task function will be called again. The "cpu" parameter 
    /// indicates the average desired CPU usage. For example, a value of 0.1 means the task must occupy 10% of the CPU. 
    /// A value of 30 for the "minRunTimeMs" parameter specifies that, for at least 30 ms, the task function must run without 
    /// interruptions (without yielding control). The "progress" parameter, if any, can be a string/number/object useful for 
    /// signaling progress to the onProgress callback.</param>
    /// <param name="onSuccess" type="Function">Optional callback function that will be called upon successful completion.
    /// Signature: function onSuccess(ret) {}, where "ret" is the final task return value, taken from ctx.returnValue.</param>
    /// <param name="onProgress" type="Function">Optional callback function that will receive progress information.
    /// Signature: function onProgress(progress) {}, where "progress" is the progress parameter optionally returned into the "task"
    /// return value along with "cpu" and "minRunTimeMs". This callback will be called only for non-null progress values.</param>
    /// <param name="onError" type="Function">Optional callback function that will receive exceptions in case of abnormal
    /// termination. Signature: function onError(e) {}, where "e" is the exception/error object thrown by the task function and
    /// can be an object of any type.</param>
};

jpvs.runBackgroundTask = function (task, onSuccess, onProgress, onError) {
    /// <summary>Runs a task function asynchronously. Calls the task function multiple times and with a desired level
    /// of CPU usage until the task function signals that the task is complete.</summary>
    /// <param name="task" type="Function">Must have this signature: function task(ctx) {}. It will be called multiple times. 
    /// On each call, it should execute a very small part of the job in order to yield control as soon as possible. 
    /// The ctx parameter can be freely used for storing execution state or any other data useful to the task itself. 
    /// At the end, the task function may set some value into ctx.returnValue and this value will be passed on to the
    /// onSuccess callback. The task function can return three types of values:
    /// null/undefined/false means the task is complete. In this case, the task function will never get called again. 
    /// If it returns true, it means the task is not complete. In this case, the task function will be called again with default
    /// settings of CPU usage and uninterrupted run time duration. 
    /// Otherwise, it can return an object like this (all is optional): 
    /// { cpu: a number between 0 and 1, minRunTimeMs: minimum number of milliseconds of uninterrupted run time before yielding 
    /// control back to the caller, progress: any object }. In this case, the task function will be called again. The "cpu" parameter 
    /// indicates the average desired CPU usage. For example, a value of 0.1 means the task must occupy 10% of the CPU. 
    /// A value of 30 for the "minRunTimeMs" parameter specifies that, for at least 30 ms, the task function must run without 
    /// interruptions (without yielding control). The "progress" parameter, if any, can be a string/number/object useful for 
    /// signaling progress to the onProgress callback.</param>
    /// <param name="onSuccess" type="Function">Optional callback function that will be called upon successful completion.
    /// Signature: function onSuccess(ret) {}, where "ret" is the final task return value, taken from ctx.returnValue.</param>
    /// <param name="onProgress" type="Function">Optional callback function that will receive progress information.
    /// Signature: function onProgress(progress) {}, where "progress" is the progress parameter optionally returned into the "task"
    /// return value along with "cpu" and "minRunTimeMs". This callback will be called only for non-null progress values.</param>
    /// <param name="onError" type="Function">Optional callback function that will receive exceptions in case of abnormal
    /// termination. Signature: function onError(e) {}, where "e" is the exception/error object thrown by the task function and
    /// can be an object of any type.</param>
};

jpvs.runForegroundTask = function (task, onSuccess, onProgress, onError) {
    /// <summary>Runs a task function synchronously. This function is primarily meant to allow executing a task function in
    /// foreground. In case a job is written as a task function but the task has to be run as an ordinary function call,
    /// this function is the way to go.</summary>
    /// <param name="task" type="Function">Must have this signature: function task(ctx) {}. It will be called multiple times. 
    /// On each call, it should execute a very small part of the job in order to yield control as soon as possible. 
    /// The ctx parameter can be freely used for storing execution state or any other data useful to the task itself. 
    /// At the end, the task function may set some value into ctx.returnValue and this value will be passed on to the
    /// onSuccess callback. The task function can return three types of values:
    /// null/undefined/false means the task is complete. In this case, the task function will never get called again. 
    /// If it returns true, it means the task is not complete. In this case, the task function will be called again with default
    /// settings of CPU usage and uninterrupted run time duration. 
    /// Otherwise, it can return an object like this (all is optional): 
    /// { cpu: a number between 0 and 1, minRunTimeMs: minimum number of milliseconds of uninterrupted run time before yielding 
    /// control back to the caller, progress: any object }. In this case, the task function will be called again. The "cpu" parameter 
    /// indicates the average desired CPU usage. For example, a value of 0.1 means the task must occupy 10% of the CPU. 
    /// A value of 30 for the "minRunTimeMs" parameter specifies that, for at least 30 ms, the task function must run without 
    /// interruptions (without yielding control). The "progress" parameter, if any, can be a string/number/object useful for 
    /// signaling progress to the onProgress callback.</param>
    /// <param name="onSuccess" type="Function">Optional callback function that will be called upon successful completion.
    /// Signature: function onSuccess(ret) {}, where "ret" is the final task return value, taken from ctx.returnValue.</param>
    /// <param name="onProgress" type="Function">Optional callback function that will receive progress information.
    /// Signature: function onProgress(progress) {}, where "progress" is the progress parameter optionally returned into the "task"
    /// return value along with "cpu" and "minRunTimeMs". This callback will be called only for non-null progress values.</param>
    /// <param name="onError" type="Function">Optional callback function that will receive exceptions in case of abnormal
    /// termination. Signature: function onError(e) {}, where "e" is the exception/error object thrown by the task function and
    /// can be an object of any type.</param>
    /// <returns type="any">The task's return value, taken from the ctx.returnValue. It is the same value passed to the
    /// optional onSuccess callback.</returns>
};
