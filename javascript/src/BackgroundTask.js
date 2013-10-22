/* JPVS
Module: tasks
Classes: 
Depends: core
*/

(function () {

    //Default run settings
    var defaultCpu = 0.5;
    var defaultMinRunTimeMs = 50;


    jpvs.runBackgroundTask = function (task, onSuccess, onProgress, onError) {
        //Start the task runner, that runs until task termination
        setTimeout(taskRunner(task, onSuccess, onProgress, onError), 0);
    };


    function taskRunner(task, onSuccess, onProgress, onError) {
        var minRunTimeMs = defaultMinRunTimeMs;

        //Return a reference to the "run" function
        return run;

        //Runner function, runs until task termination
        //In case of exception in the "task" function, the task is terminated
        //The "task" function returns info about how to continue running the task
        function run() {
            try {
                //Run the task for at least minRunTime milliseconds
                var end = new Date().getTime() + minRunTimeMs;
                while (true) {
                    //Run once and analyze the return code
                    var info = task();
                    var infoDecoded = analyzeTaskRetCode(info);

                    //Let's see what to do
                    if (infoDecoded.keepRunning) {
                        //Task wants to keep running
                        //If we are within the minRunTimeMs, then we may repeat the loop
                        //Otherwise we schedule the task for later
                        var now = new Date().getTime();
                        if (new Date().getTime() < end) {
                            //We may run again without yielding control
                            //NOP
                        }
                        else {
                            //The minRunTimeMs has elapsed
                            //Let's schedule the task using the provided task settings
                            minRunTimeMs = infoDecoded.minRunTimeMs;
                            var lastDuration = now - start;
                            var delay = lastDuration * (1 - infoDecoded.cpu) / infoDecoded.cpu;
                            setTimeout(run, delay);

                            //Let's signal progress, if available, whatever "progress" means
                            if (onProgress && infoDecoded.progress)
                                onProgress(infoDecoded.progress);

                            return;
                        }
                    }
                    else {
                        //Task doesn't need to run again
                        //Let's signal success and exit
                        if (onSuccess)
                            onSuccess();

                        return;
                    }
                }

            }
            catch (e) {
                //In case of errors, the task ends and the onError callback, if any, is called
                if (onError)
                    onError(e);
            }
        }
    }

    /*
    The task function can return:
        - null, undefined, false: means "task completed"
        - true: means "please run me again"
        - object with info about progress and task settings

    The object can be like this (all is optional):
    {
        cpu: value between 0 and 1,
        minRunTimeMs: how long to run before yielding control for a while,
        progress: string or object or number (anything is passed on to onProgress)
    }
    */
    function analyzeTaskRetCode(info) {
        //See what to do next
        if (info === null || info === undefined || info === false) {
            //Task said it finished
            //No more scheduling
            return {
                keepRunning: false
            };
        }
        else if (info === true) {
            //Task said it needs to continue running but provided no info as to how it wants to be run
            //No progress information either
            //Let's run with default settings
            return {
                keepRunning: true,
                cpu: defaultCpu,
                minRunTimeMs: defaultMinRunTimeMs
            };
        }
        else {
            //Task said it needs to continue running and provided some info as to how it wants to be run
            return {
                keepRunning: true,
                cpu: info.cpu || defaultCpu,
                minRunTimeMs: info.minRunTimeMs || defaultMinRunTimeMs,
                progress: info.progress
            };
        }
    }

})();
