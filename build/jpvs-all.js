var jpvs = (function () {
    function loadJS(url, callback) {
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        var script = document.createElement("script");
        script.src = url;

        // Handle Script loading
        var done = false;

        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                done = true;
                callback();
            }
        };

        // Use insertBefore instead of appendChild to circumvent an IE6 bug.
        head.insertBefore(script, head.firstChild);
    }

    function setAdd(list, item) {
        var found = false;
        for (var i in list) {
            var x = list[i];
            if (x == item) {
                found = true;
                break;
            }
        }

        if (!found) {
            list.push(item);
            return true;
        }
        else
            return false;
    }

    function resolveDependencies(classes, modules) {
        //The following comment is a placeholder. During the build process it will be replaced with a dependency tree
        //of all files, classes and modules.
        /* $JPVSTREE$ */

        //Start from classes and get a list of modules
        var mods = [];
        if (classes) {
            for (var i in classes) {
                var cls = classes[i];
                var mod = tree.ClassToModule[cls];
                setAdd(mods, mod);
            }
        }

        //Next, add modules
        if (modules) {
            for (var i in modules) {
                var mod = modules[i];
                setAdd(mods, mod);
            }
        }

        //Finally, let's add all dependencies
        var loopAgain = true;
        while (loopAgain) {
            loopAgain = false;
            for (var i in mods) {
                var mod = mods[i];
                var depends = tree.ModuleToDepends[mod];
                for (var j in depends) {
                    var depend = depends[j];
                    if (setAdd(mods, depend))
                        loopAgain = true;
                }
            }
        }

        //Now we have all required modules
        //Let's determine the files to load
        var jpvsBaseUrl = jpvs.baseUrl || "jpvs";

        var files = [];
        for (var i in mods) {
            var mod = mods[i];
            var fileGroup = tree.ModuleToFiles[mod];
            for (var j in fileGroup) {
                var file = fileGroup[j];
                setAdd(files, jpvsBaseUrl + "/" + file);
            }
        }

        //Return in reverse order
        files.reverse();
        return files;
    }

    return function (classesAndModules, onready) {
        //Variable number of parameters
        if (!classesAndModules) {
            //No params
        }
        else if (typeof (classesAndModules) == "function") {
            //One param: callback
            onready = classesAndModules;
            $(document).ready(function () {
                jpvs.createAllWidgets();
                onready(jpvs.widgets);
            });
        }
        else {
            //Two params: classesAndModules, onready
            //Javascript files to load
            var files = resolveDependencies(classesAndModules.classes, classesAndModules.modules);

            function loadAllJS() {
                if (!files.TotalCount)
                    files.TotalCount = files.length;

                var firstJS = files.shift();
                if (firstJS) {
                    setTimeout(function () {
                        loadJS(firstJS, loadAllJS);
                    }, 10);
                }
                else {
                    //Done
                    jpvs.createAllWidgets();

                    if (onready)
                        onready(jpvs.widgets);
                }
            }

            $(document).ready(loadAllJS);
        }
    };
})();
;


(function () {

    // shim layer with setTimeout fallback
    var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
        window.setTimeout(callback, 1000 / 60);
    };

    jpvs.requestAnimationFrame = function () {
        //Ensure we call with this = window
        requestAnimFrame.apply(window, arguments);
    }

    //Animation queue
    var queue = [];
    var running = false;
    var currentAnim = null;

    /*
    Can be called as: jpvs.animate(animationFunction) 
    or as jpvs.animate(params, animationFunction)
    */
    jpvs.animate = function (params, animationFunction) {
        //Parameter extraction
        var t0 = (params && params.t0 != null) ? params.t0 : 0;
        var t1 = (params && params.t1 != null) ? params.t1 : 1;
        var step = Math.abs((params && params.step) || 0);
        var duration = Math.abs((params && params.duration) || 1000);
        var easingFunc = (params && params.easingFunction) || harmonicEasing;
        var animFunc = animationFunction || params;

        //Enqueue the animation
        queue.push({
            t0: t0, t1: t1, step: step, duration: duration,
            animFunc: animFunc,
            easingFunc: easingFunc,
            startTime: null,
            endTime: null
        });

        //Ensure it will be executed
        ensureStarted();
    };

    function ensureStarted() {
        if (!running) {
            requestAnimFrame(animFrame);
            running = true;
        }
    }

    function animFrame() {
        //Get the current animation
        if (currentAnim == null) {
            if (queue.length > 0) {
                //Pop the first element (FIFO queue)
                currentAnim = queue.shift();
            }
            else {
                //No more items in the queue
                running = false;
                return;
            }
        }

        //Materialize the current frame of the current animation
        try {
            //Current frame time
            var curTime = new Date().getTime();

            //We need to know the animation start time
            if (currentAnim.startTime == null) {
                currentAnim.startTime = curTime;
                currentAnim.endTime = currentAnim.startTime + currentAnim.duration;
            }

            if (currentAnim.step) {
                //Discrete animation: go from t0 to t1 with this "step"
                var t = getAnimationTimeDiscrete(curTime);
                currentAnim.animFunc(t);
            }
            else {
                //Continuous animation: simply go from t0 to t1 as smoothly as possible
                var t = getAnimationTimeContinuous(curTime);
                currentAnim.animFunc(t);
            }

            //If current animation finished, set it to null
            if (curTime >= currentAnim.endTime)
                currentAnim = null;
        }
        finally {
            //Schedule next frame
            requestAnimFrame(animFrame);
        }
    }

    /*
    Calculate the current animation time for continuous animations by applying the easing function
    */
    function getAnimationTimeContinuous(curTime) {
        if (curTime <= currentAnim.startTime)
            return currentAnim.t0;
        else if (curTime >= currentAnim.endTime)
            return currentAnim.t1;
        else
            return currentAnim.easingFunc(currentAnim.startTime, currentAnim.endTime, currentAnim.t0, currentAnim.t1, curTime);
    }

    /*
    Calculate the current animation time for discrete animations by applying the step
    */
    function getAnimationTimeDiscrete(curTime) {
        var t0 = currentAnim.t0;
        var t1 = currentAnim.t1;
        var step = currentAnim.step;
        var s = currentAnim.startTime;
        var e = currentAnim.endTime;

        //How many steps between t0 and t1?
        var nSteps = Math.ceil(Math.abs((t1 - t0) / step));
        var sign = t1 > t0 ? 1 : -1;

        //Divide the total duration in nSteps parts
        var timeStep = (e - s) / nSteps;

        //Determine the step index
        var stepIndex = Math.floor((curTime - s) / timeStep);

        if (curTime <= s)
            return t0;
        else if (curTime >= e)
            return t1;
        else
            return t0 + sign * stepIndex * step;
    }

    /*
    Easing functions for continuous animations
    */
    function harmonicEasing(startTime, endTime, t0, t1, curTime) {
        var normTime = (curTime - startTime) / (endTime - startTime);
        var normT = 0.5 - Math.cos(normTime * Math.PI) / 2;
        var t = t0 + normT * (t1 - t0);
        return t;
    }

    function linearEasing(startTime, endTime, t0, t1, curTime) {
        var normTime = (curTime - startTime) / (endTime - startTime);
        var normT = normTime;
        var t = t0 + normT * (t1 - t0);
        return t;
    }

    //Publish some preset easing functions
    jpvs.animate.harmonicEasing = harmonicEasing;
    jpvs.animate.linearEasing = linearEasing;


    /*
    Simple function for flashing a CSS class on a DOM element
    */
    jpvs.flashClass = function (element, cssClass, duration, count, leaveOnTime) {
        var $elem = $(element);
        var N = count || 2;
        var T1 = 2 * N;

        //Flash and leave the CSS class on
        jpvs.animate({
            t0: 0,
            t1: T1,
            step: 1,
            duration: duration || 1000
        }, function (t) {
            if (t % 2 == 0)
                $elem.addClass(cssClass);
            else
                $elem.removeClass(cssClass);
        });

        //Then, at the end, wait for "leaveOnTime" and switch the CSS class off
        jpvs.animate({
            t0: 0,
            t1: 1,
            step: 1,
            duration: leaveOnTime || 2000
        }, function (t) {
            if (t == 1)
                $elem.removeClass(cssClass);
        });

    };

})();
;


(function () {

    //Default run settings
    var defaultCpu = 0.5;
    var defaultMinRunTimeMs = 50;


    jpvs.runTask = function (flagAsync, task, onSuccess, onProgress, onError) {
        if (flagAsync)
            return jpvs.runBackgroundTask(task, onSuccess, onProgress, onError);
        else
            return jpvs.runForegroundTask(task, onSuccess, onProgress, onError);
    };

    jpvs.runBackgroundTask = function (task, onSuccess, onProgress, onError) {
        //Start the task runner, that runs asynchronously until task termination
        var taskFunctions = taskRunnerAsync(task, onSuccess, onProgress, onError);

        setTimeout(taskFunctions.run, 0);

        //Returns an object containing a "function cancel() {}", that can be used to interrupt the task at any moment
        return { cancel: taskFunctions.cancel };
    };

    jpvs.runForegroundTask = function (task, onSuccess, onProgress, onError) {
        //Run the task synchronously from start to end
        //As a convenience, pass the return value as a real return value
        return taskRunner(task, onSuccess, onProgress, onError);
    };


    function taskRunner(task, onSuccess, onProgress, onError) {
        //Run from start to end, never yielding control back to the caller
        //Useful for running a task much like an ordinary function call
        //Let's make a data context available to the task
        //The task can do whatever it wants with this object. Useful for storing execution state.
        var ctx = {};

        try {
            //Run the task
            while (true) {
                //Run once and analyze the return code
                var info = task(ctx);
                var infoDecoded = analyzeTaskRetCode(info);

                //Let's see what to do
                if (infoDecoded.keepRunning) {
                    //Task wants to keep running
                    //Let's signal progress, if available, whatever "progress" means
                    if (onProgress && infoDecoded.progress)
                        onProgress(infoDecoded.progress);
                }
                else {
                    //Task doesn't need to run again
                    //Let's signal success and exit
                    if (onSuccess)
                        onSuccess(ctx.returnValue);

                    //As a convenience, pass the return value as a real return value
                    return ctx.returnValue;
                }
            }

        }
        catch (e) {
            //In case of errors, the task ends and the onError callback, if any, is called
            if (onError)
                onError(e);
        }
    }

    function taskRunnerAsync(task, onSuccess, onProgress, onError) {
        //Let's make a data context available to the task
        //The task can do whatever it wants with this object. Useful for storing execution state.
        var ctx = {};

        //We want to exit immediately on the first iteration, so we load the task settings right away
        var minRunTimeMs = 0;

        //Flag used for cancelling the task
        var mustCancel = false;

        //Return a reference to the "run" and "cancel" functions
        return { run: run, cancel: cancel };


        //Cancel function
        function cancel() {
            //Simply turn on the flag, so the task stops working
            mustCancel = true;
        }

        //Runner function, runs until task termination
        //In case of exception in the "task" function, the task is terminated
        //The "task" function returns info about how to continue running the task
        function run() {
            //If we must stop, then just exit and don't schedule anything more, so this task stops executing immediately
            if (mustCancel)
                return;

            try {
                //Run the task for at least minRunTime milliseconds
                var start = new Date().getTime();
                var end = start + minRunTimeMs;
                while (!mustCancel) {
                    //Run once and analyze the return code
                    var info = task(ctx);
                    var infoDecoded = analyzeTaskRetCode(info);

                    //Let's see what to do
                    if (infoDecoded.keepRunning) {
                        //Task wants to keep running
                        //If we are within the minRunTimeMs, then we may repeat the loop
                        //Otherwise we schedule the task for later
                        var now = new Date().getTime();
                        if (now < end) {
                            //We may run again without yielding control
                            //NOP
                        }
                        else {
                            //The minRunTimeMs has elapsed
                            //Let's reschedule the task using the provided task settings
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
                            onSuccess(ctx.returnValue);

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
                minRunTimeMs: defaultMinRunTimeMs,
                progress: null
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
;


(function () {
    /*
    Copyright (c) 2008 Fred Palmer fred.palmer_at_gmail.com

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
    */
    function StringBuffer() {
        this.buffer = [];
    }

    StringBuffer.prototype.append = function append(string) {
        this.buffer.push(string);
        return this;
    };

    StringBuffer.prototype.toString = function toString() {
        return this.buffer.join("");
    };

    var Base64 = {
        codex: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

        encode: function (input) {
            var output = new StringBuffer();

            var enumerator = new Utf8EncodeEnumerator(input);
            while (enumerator.moveNext()) {
                var chr1 = enumerator.current;

                enumerator.moveNext();
                var chr2 = enumerator.current;

                enumerator.moveNext();
                var chr3 = enumerator.current;

                var enc1 = chr1 >> 2;
                var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                var enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                }
                else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output.append(this.codex.charAt(enc1) + this.codex.charAt(enc2) + this.codex.charAt(enc3) + this.codex.charAt(enc4));
            }

            return output.toString();
        },

        decode: function (input) {
            var output = new StringBuffer();

            var enumerator = new Base64DecodeEnumerator(input);
            while (enumerator.moveNext()) {
                var charCode = enumerator.current;

                if (charCode < 128)
                    output.append(String.fromCharCode(charCode));
                else if ((charCode > 191) && (charCode < 224)) {
                    enumerator.moveNext();
                    var charCode2 = enumerator.current;

                    output.append(String.fromCharCode(((charCode & 31) << 6) | (charCode2 & 63)));
                }
                else {
                    enumerator.moveNext();
                    var charCode2 = enumerator.current;

                    enumerator.moveNext();
                    var charCode3 = enumerator.current;

                    output.append(String.fromCharCode(((charCode & 15) << 12) | ((charCode2 & 63) << 6) | (charCode3 & 63)));
                }
            }

            return output.toString();
        }
    };


    function Utf8EncodeEnumerator(input) {
        this._input = input;
        this._index = -1;
        this._buffer = [];
    }

    Utf8EncodeEnumerator.prototype = {
        current: Number.NaN,

        moveNext: function () {
            if (this._buffer.length > 0) {
                this.current = this._buffer.shift();
                return true;
            }
            else if (this._index >= (this._input.length - 1)) {
                this.current = Number.NaN;
                return false;
            }
            else {
                var charCode = this._input.charCodeAt(++this._index);

                // "\r\n" -> "\n"
                //
                if ((charCode == 13) && (this._input.charCodeAt(this._index + 1) == 10)) {
                    charCode = 10;
                    this._index += 2;
                }

                if (charCode < 128) {
                    this.current = charCode;
                }
                else if ((charCode > 127) && (charCode < 2048)) {
                    this.current = (charCode >> 6) | 192;
                    this._buffer.push((charCode & 63) | 128);
                }
                else {
                    this.current = (charCode >> 12) | 224;
                    this._buffer.push(((charCode >> 6) & 63) | 128);
                    this._buffer.push((charCode & 63) | 128);
                }

                return true;
            }
        }
    };

    function Base64DecodeEnumerator(input) {
        this._input = input;
        this._index = -1;
        this._buffer = [];
    }

    Base64DecodeEnumerator.prototype = {
        current: 64,

        moveNext: function () {
            if (this._buffer.length > 0) {
                this.current = this._buffer.shift();
                return true;
            }
            else if (this._index >= (this._input.length - 1)) {
                this.current = 64;
                return false;
            }
            else {
                var enc1 = Base64.codex.indexOf(this._input.charAt(++this._index));
                var enc2 = Base64.codex.indexOf(this._input.charAt(++this._index));
                var enc3 = Base64.codex.indexOf(this._input.charAt(++this._index));
                var enc4 = Base64.codex.indexOf(this._input.charAt(++this._index));

                var chr1 = (enc1 << 2) | (enc2 >> 4);
                var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                var chr3 = ((enc3 & 3) << 6) | enc4;

                this.current = chr1;

                if (enc3 != 64)
                    this._buffer.push(chr2);

                if (enc4 != 64)
                    this._buffer.push(chr3);

                return true;
            }
        }
    };

    jpvs.encodeUtf8Base64 = function (str) {
        return Base64.encode(str);
    };

    jpvs.decodeBase64Utf8 = function (str) {
        return Base64.decode(str);
    };

})();
;


(function () {
    jpvs.resetAllBindings = function () {
        changeMonitorQueue.clearAll();
        disableChangeMonitor();
    };

    jpvs.bindContainer = function (container, dataObject, onChangeDetected, dataBindingAttrName) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = jpvs.getElementIfWidget(container);

        //We want to two-way bind every element (ordinary element or jpvs widget) to dataObject
        //Let's look for elements that specify a binding in attribute "data-bind"
        jpvs.bindElements(container.find("*"), dataObject, onChangeDetected, dataBindingAttrName);
    };

    jpvs.bindElements = function (elements, dataObject, onChangeDetected, dataBindingAttrName) {
        if (!elements)
            return;

        //We want to two-way bind every element (ordinary element or jpvs widget) to dataObject
        //Let's look for elements that specify a binding in attribute "data-bind"
        for (var i = 0; i < elements.length; i++) {
            //Loop over all elements and see if they need binding
            var obj = elements[i];
            var $this = $(obj);

            //Let's read the "data-bind" attribute (or another name if specified)
            var dataBind = $this.data(dataBindingAttrName || "bind");
            if (dataBind) {
                //If "data-bind" is specified, apply it
                jpvs.bind($this, dataObject, dataBind, onChangeDetected);
            }
        }
    };

    jpvs.bind = function (element, dataObject, dataBind, onChangeDetected) {
        enableChangeMonitor();

        if (!dataObject)
            return;

        //Let's parse the "data-bind" attribute into a list of bindings and put them in place
        var items = $.trim(dataBind).split(",");
        $.each(items, function (i, item) {
            var subitems = item.split("=");
            var elementPropertyName = $.trim(subitems[0]);
            var objectPropertyName = $.trim(subitems[1]);
            bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName, onChangeDetected);
        });
    };

    jpvs.findElementsBoundTo = function (dataObject, objectPropertyName) {
        var elementsOrWidgets = [];
        //Search for all relations having this idTo
        var idTo = getDataObjectBindingID(dataObject) + "/" + objectPropertyName;
        $.each(changeMonitorQueue.relations, function (key, item) {
            if (item.idTo == idTo) {
                elementsOrWidgets.push(item.element);
            }
        });

        return elementsOrWidgets;
    };

    function bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName, onChangeDetected) {
        //First copy from dataObject to element
        var getter = getterDataObjectProperty(dataObject, objectPropertyName);
        var setter = setterElementProperty(element, elementPropertyName);
        setter(getter());

        //Let's setup a two-way binding
        //From element to dataObject
        var relation = {
            idFrom: getElementBindingID(element) + "/" + elementPropertyName,
            idTo: getDataObjectBindingID(dataObject) + "/" + objectPropertyName
        };
        onElementPropertyChange(relation, element, elementPropertyName, setterDataObjectProperty(dataObject, objectPropertyName), onChangeDetected);

        //From dataObject to element
        relation = {
            idTo: getElementBindingID(element) + "/" + elementPropertyName,
            idFrom: getDataObjectBindingID(dataObject) + "/" + objectPropertyName
        };
        onDataObjectPropertyChange(relation, dataObject, objectPropertyName, element, setterElementProperty(element, elementPropertyName), onChangeDetected);
    }

    function getElementBindingID(element) {
        var bid = element.data("jpvs.binding.id");
        if (!bid) {
            bid = jpvs.randomString(20);
            element.data("jpvs.binding.id", bid);
        }

        return bid;
    }

    function getDataObjectBindingID(dataObject) {
        var bid = dataObject["jpvs.binding.id"];
        if (!bid) {
            bid = jpvs.randomString(20);
            dataObject["jpvs.binding.id"] = bid;
        }

        return bid;
    }

    function onElementPropertyChange(relation, element, elementPropertyName, onChangeAction, onChangeDetected) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the element property
        var getter = getterElementProperty(element, elementPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        changeMonitorQueue.put(relation.idFrom, relation.idTo, element, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            if (onChangeAction(value)) {
                //And signal the event (towards the data object) only if the value has changed
                //(the onChangeAction returns true if the value has changed)
                if (onChangeDetected)
                    onChangeDetected(false, true);
            }
        });
    }

    function onDataObjectPropertyChange(relation, dataObject, objectPropertyName, element, onChangeAction, onChangeDetected) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the dataObject property
        var getter = getterDataObjectProperty(dataObject, objectPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        changeMonitorQueue.put(relation.idFrom, relation.idTo, element, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            if (onChangeAction(value)) {
                //And signal the event (towards the element) only if the value has changed
                //(the onChangeAction returns true if the value has changed)
                if (onChangeDetected)
                    onChangeDetected(true, false);
            }
        });
    }

    function decodeObjectPropertySpec(objectPropertySpec) {
        var objectPropertyName = objectPropertySpec;
        var mustInvert = false;

        //Special case: if the objectPropertyName starts with ! we have to invert the value
        if (objectPropertySpec.indexOf("!") == 0) {
            //Inversion required
            mustInvert = true;
            objectPropertyName = objectPropertySpec.substring(1);
        }

        return {
            name: objectPropertyName,
            mustInvert: mustInvert,

            translate: translateFunc
        };

        function translateFunc(val) {
            return this.mustInvert ? !val : val;
        }
    }

    function getterDataObjectProperty(dataObject, objectPropertySpec) {
        //Handle special object property syntax
        var objectPropertyInfo = decodeObjectPropertySpec(objectPropertySpec);

        //Read the data object property
        var prop = dataObject[objectPropertyInfo.name];
        if (typeof (prop) == "function") {
            //It's a jpvs.property; the getter must read from the property
            return function () {
                var val = prop();
                return objectPropertyInfo.translate(val);
            };
        }
        else {
            //It's a normal value; the getter must simply read the current value
            return function () {
                var val = dataObject[objectPropertyInfo.name];
                return objectPropertyInfo.translate(val);
            };
        }
    }

    //These setters must return true if they change the value
    function setterDataObjectProperty(dataObject, objectPropertySpec) {
        //Handle special object property syntax
        var objectPropertyInfo = decodeObjectPropertySpec(objectPropertySpec);

        //Set the data object property
        var prop = dataObject[objectPropertyInfo.name];
        if (typeof (prop) == "function") {
            //It's a jpvs.property; the setter must assign the value to the property
            return function (value) {
                var oldValue = prop();
                var valueTranslated = objectPropertyInfo.translate(value);

                prop(valueTranslated);
                return !valueEquals(valueTranslated, oldValue);
            };
        }
        else {
            //It's a normal value; the setter must overwrite it with the new one
            return function (value) {
                var oldValue = dataObject[objectPropertyInfo.name];
                var valueTranslated = objectPropertyInfo.translate(value);

                dataObject[objectPropertyInfo.name] = valueTranslated;
                return !valueEquals(valueTranslated, oldValue);
            };
        }
    }

    function getterElementProperty(element, elementPropertyName) {
        //If element is a widget, let's first try to use it as a widget by accessing its properties
        var widget = jpvs.find(element);
        if (widget) {
            //Let's see if widget has a property with that name
            var prop = widget[elementPropertyName];
            if (typeof (prop) == "function") {
                //It's a jpvs.property; the getter must read the value from the property
                return function () {
                    return prop.call(widget);
                };
            }
        }

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes or jQuery
        //functions or pseudo-properties
        if (elementPropertyName.toLowerCase().substring(0, 7) == "jquery.") {
            //jQuery function
            return function () {
                return element[elementPropertyName.substring(7)]();
            };
        }
        else if (elementPropertyName == "#visible") {
            //"visible" pseudo-property
            return function () {
                return element.css("display") != "none" && element.css("visibility") != "hidden";
            };
        }
        else if (elementPropertyName.substring(0, 1) == "#") {
            //Starts with # but not among the allowed ones
            alert("Invalid jpvs data-binding directive: " + elementPropertyName);
        }
        else {
            //Generic attribute
            return function () {
                return element.attr(elementPropertyName);
            };
        }
    }

    //These setters must return true if the new value is different from the old value
    function setterElementProperty(element, elementPropertyName) {
        //If element is a widget, let's first try to use it as a widget by accessing its properties
        var widget = jpvs.find(element);
        if (widget) {
            //Let's see if widget has a property with that name
            var prop = widget[elementPropertyName];
            if (typeof (prop) == "function") {
                //It's a jpvs.property; the setter must assign the value to the property
                return function (value) {
                    //We want to assign it only if it is different, so we don't trigger side effects
                    if (!valueEquals(value, prop.call(widget))) {
                        prop.call(widget, value);
                        return true;
                    }
                    else
                        return false;
                };
            }
        }

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes or jQuery
        //functions or pseudo-properties
        if (elementPropertyName.toLowerCase().substring(0, 7) == "jquery.") {
            //jQuery function
            return function (value) {
                //We want to assign it only if it is different, so we don't trigger side effects
                if (!valueEquals(value, element[elementPropertyName.substring(7)]())) {
                    element[elementPropertyName.substring(7)](value);
                    return true;
                }
                else
                    return false;
            };
        }
        else if (elementPropertyName == "#visible") {
            //"visible" pseudo-property
            return function (value) {
                var oldValue = element.css("display") != "none" && element.css("visibility") != "hidden";
                if (value)
                    element.show();
                else
                    element.hide();

                return value != oldValue;
            };
        }
        else if (elementPropertyName.substring(0, 1) == "#") {
            //Starts with # but not among the allowed ones
            alert("Invalid jpvs data-binding directive: " + elementPropertyName);
        }
        else {
            //Generic attribute
            return function (value) {
                //We want to assign it only if it is different, so we don't trigger side effects
                if (!valueEquals(value, element.attr(elementPropertyName))) {
                    element.attr(elementPropertyName, value);
                    return true;
                }
                else
                    return false;
            };
        }
    }

    //Function used to determine if a value has changed or if it is equal to its old value
    function valueEquals(a, b) {
        return jpvs.equals(a, b);
    }

    var chgMonitorThread;

    function enableChangeMonitor() {
        if (!chgMonitorThread) {
            chgMonitorThread = setInterval(changeMonitor, 200);
        }
    }

    function disableChangeMonitor() {
        if (chgMonitorThread) {
            clearInterval(chgMonitorThread);
            chgMonitorThread = null;
        }
    }

    function ChangeMonitorQueue() {
        this.relations = {};
    }

    ChangeMonitorQueue.prototype.clearAll = function () {
        this.relations = {};
    };

    ChangeMonitorQueue.prototype.put = function (idFrom, idTo, element, getter, onChangeAction) {
        this.relations[idFrom + "§" + idTo] = {
            idFrom: idFrom,
            idTo: idTo,
            element: element,
            getter: getter,
            onChangeAction: onChangeAction,
            curValue: getter()
        };
    };

    var changeMonitorQueue = new ChangeMonitorQueue();

    function changeMonitor() {
        //Let's process the queue looking for changes
        var changes;
        var changedSomething = true;
        while (changedSomething) {
            changes = {};
            changedSomething = false;
            $.each(changeMonitorQueue.relations, function (key, item) {
                var newValue = item.getter();
                if (!valueEquals(newValue, item.curValue)) {
                    //Change detected: let's set the changed flag
                    changes[item.idFrom] = item.getter;
                    changedSomething = true;
                }
            });

            //Now, we know what changed. Let's propagate the new values one at a time
            $.each(changes, function (idFrom, getter) {
                var newValue = getter();

                //Let's apply the newValue to all the relations starting from idFrom
                $.each(changeMonitorQueue.relations, function (key, item) {
                    if (item.idFrom == idFrom) {
                        //Let's apply the value to this relation's destination
                        item.onChangeAction(newValue);

                        //And set the curValue of the source
                        item.curValue = newValue;
                    }
                });
            });
        }
    }

})();
;


(function () {
    //If X is a jpvs widget, get the jQuery object representing the main content element of X
    //Otherwise, return X
    function toElement(X) {
        if (!X)
            return X;

        if (X.getMainContentElement)
            return X.getMainContentElement();
        else
            return $(X);
    }

    jpvs.getElementIfWidget = toElement;

    //All widget definitions
    jpvs.widgetDefs = [];

    //All widgets, by ID and by element
    jpvs.widgets = {};

    jpvs.find = function (selector) {
        var elem = $(selector);
        if (elem.length == 0)
            return null;
        else if (elem.length == 1)
            return elem.data("jpvs-widget");
        else {
            var widgets = [];
            elem.each(function () {
                widgets.push($(this).data("jpvs-widget"));
            });

            //Add an "each" method for easily iterating over the returned widgets
            widgets.each = function (action) {
                for (var i = 0; i < widgets.length; i++) {
                    var w = widgets[i];
                    action.call(w, w);
                }
            };

            return widgets;
        }
    };

    jpvs.states = {
        HOVER: "Hover",
        FOCUS: "Focus",
        ERROR: "Error",
        DISABLED: "Disabled"
    };

    jpvs.property = function (propdef) {
        return function (value, flagAsync, onSuccess, onProgress, onError) {
            if (value === undefined) {
                //Get property value (synchronous style)
                return propdef.get.call(this);
            }
            else {
                //Set property value (synchronous/asynchronous style)
                //For synchronous, no callbacks
                //For asynchronous, use callbacks if specified
                //We may have set and/or setTask or none and thus we have a few cases
                if (flagAsync) {
                    //Asynchronous setter --> we prefer setTask
                    if (propdef.setTask) {
                        //Real asynchronous setter (task version)
                        //Get setter task function
                        var task = propdef.setTask.call(this, value);

                        //Now we have a task that knows how to set the property value
                        jpvs.runBackgroundTask(task, onSuccess, onProgress, onError);
                    }
                    else if (propdef.set) {
                        //Dummy asynchronous setter (actually it's just synchronous but with the callback)
                        try {
                            propdef.set.call(this, value);
                            if (onSuccess)
                                onSuccess();
                        }
                        catch (e) {
                            if (onError)
                                onError(e);
                        }
                    }
                    else {
                        //Neither set nor setTask --> nothing to set                
                        //Just call the onSuccess callback
                        if (onSuccess)
                            onSuccess();
                    }
                }
                else {
                    //Synchronous setter --> we prefer set
                    if (propdef.set) {
                        //Real synchronous setter, no callbacks
                        propdef.set.call(this, value);
                    }
                    else if (propdef.setTask) {
                        //Synchronous setter but with a task (we launch it as a foreground task)
                        //Get setter task function
                        var task = propdef.setTask.call(this, value);

                        //Now we have a task that knows how to set the property value
                        //No callbacks
                        jpvs.runForegroundTask(task);
                    }
                    else {
                        //Neither set nor setTask --> nothing to set                
                        //No callbacks
                        //NO OPERATION
                    }
                }

                //At the end always return this for chaining
                return this;
            }
        };
    };

    jpvs.currentLocale = (function () {
        var curLoc = "en";

        return jpvs.property({
            get: function () { return curLoc; },
            set: function (value) {
                //JPVS locale
                curLoc = value;

                //Set "moment" library to same locale
                moment.locale(curLoc);
            }
        });
    })();

    jpvs.event = function (widget) {
        return new jpvs.Event(widget);
    };

    jpvs.makeWidget = function (widgetDef) {
        //Keep track of all widget definitions for function createAllWidgets
        jpvs.widgetDefs.push(widgetDef);

        //Widget
        var fn = widgetDef.widget;
        if (!fn)
            throw "Missing widget field in widget definition";

        //Widget creator
        if (!widgetDef.create)
            throw "Missing create function in widget definition";

        //Widget initialization
        if (!widgetDef.init)
            throw "Missing init function in widget definition";

        //Widget name
        fn.__WIDGET__ = widgetDef.type;
        if (!fn.__WIDGET__)
            throw "Missing type field in widget definition";

        //Widget CSS class
        if (!widgetDef.cssClass)
            throw "Missing cssClass field in widget definition";

        //Static methods
        fn.create = create_static(widgetDef);
        fn.attach = attach_static(widgetDef);

        //Instance methods
        fn.prototype.toString = function () { return this.__WIDGET__; };
        fn.prototype.attach = attach(widgetDef);
        fn.prototype.destroy = destroy(widgetDef);
        fn.prototype.focus = focus(widgetDef);
        fn.prototype.addState = addState(widgetDef);
        fn.prototype.removeState = removeState(widgetDef);
        fn.prototype.getMainContentElement = getMainContentElement(widgetDef);

        fn.prototype.id = jpvs.property({
            get: function () { return this.element.attr("id"); },
            set: function (value) { this.element.attr("id", value); }
        });

        fn.prototype.ensureId = function () {
            if (this.id() && this.id() != "")
                return;
            else
                this.id(jpvs.randomString(20));
        };

        //Additional prototype methods defined in "widgetDef"
        if (widgetDef.prototype) {
            $.each(widgetDef.prototype, function (memberName, member) {
                fn.prototype[memberName] = member;
            });
        }

        function create_static(widgetDef) {
            return function (selector) {
                var objs = [];
                selector = selector || document.body;

                //The "selector" may also be a jpvs widget. The following line handles this case
                selector = toElement(selector);

                $(selector).each(function (i, elem) {
                    var obj = widgetDef.create(elem);
                    objs.push(widgetDef.widget.attach(obj));
                });

                if (objs.length == 1)
                    return objs[0];
                else if (objs.length == 0)
                    return undefined;
                else
                    return objs;
            };
        }

        function attach_static(widgetDef) {
            return function (selector) {
                return new widgetDef.widget(selector);
            };
        }

        function attach(widgetDef) {
            return function (selector) {
                if (!selector)
                    return;

                //The "selector" may also be a jpvs widget. The following line handles this case
                selector = toElement(selector);

                this.__WIDGET__ = widgetDef.type;
                this.element = $(selector);

                //Decorate with CSS
                this.element.addClass("Widget");
                this.element.addClass(widgetDef.cssClass);

                //Initialize widget behavior
                init(this);
                widgetDef.init.call(this, this);

                //Put in collection
                jpvs.widgets[this.element.attr("id")] = this;
                this.element.data("jpvs-widget", this);
            };
        }

        function destroy(widgetDef) {
            return function () {
                var execDefault = true;

                if (widgetDef.destroy)
                    execDefault = widgetDef.destroy.call(this, this);

                if (execDefault) {
                    //The default behavior is to remove the element from the DOM.
                    //The default behavior is suppressed
                    this.element.remove();
                }
            };
        }

        function getMainContentElement(widgetDef) {
            return function () {
                //If the widget definition defines a "getMainContentElement" function, let's call it
                if (widgetDef.getMainContentElement)
                    return widgetDef.getMainContentElement.call(this, this);

                //Otherwise, the default behavior: let's return THE "element"
                return this.element;
            };
        }

        function init(W) {
            //Hovering
            W.element.hover(function () {
                W.addState(jpvs.states.HOVER);
            }, function () {
                W.removeState(jpvs.states.HOVER);
            });

            //Focusing
            W.element.focusin(function () {
                W.addState(jpvs.states.FOCUS);
            });

            W.element.focusout(function () {
                W.removeState(jpvs.states.FOCUS);
            });
        }

        function focus(widgetDef) {
            return function () {
                if (widgetDef.focus)
                    widgetDef.focus.call(this, this);
                else
                    this.element.focus();

                return this;
            };
        }

        function addState(wd) {
            return function (state) {
                this.element.addClass("Widget-" + state);
                this.element.addClass(wd.cssClass + "-" + state);

                return this;
            };
        }

        function removeState(wd) {
            return function (state) {
                this.element.removeClass("Widget-" + state);
                this.element.removeClass(wd.cssClass + "-" + state);

                return this;
            };
        }
    };


    jpvs.createAllWidgets = function () {
        $("*").each(function () {
            //Loop over all elements and attach a widget, as appropriate
            var obj = this;
            var $this = $(obj);
            var type = $this.data("jpvsType");
            if (type) {
                //If "data-jpvs-type" is specified, apply it
                var widget = jpvs[type];
                if (widget) {
                    widget.attach(this);
                    return;
                }
            }

            //If no "data-jpvs-type" is specified or if didn't manage to attach anything, then select the first appropriate widget, if any,
            //and attach it (default behavior)
            $.each(jpvs.widgetDefs, function (i, wd) {
                //Let's see if "wd" is an appropriate widget definition for "obj"
                if (wd.canAttachTo && wd.canAttachTo(obj)) {
                    //Yes, the widget said it can be attached to "obj"
                    wd.widget.attach(obj);
                    return false;
                }
            });
        });
    };


    jpvs.write = function (container, text) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        if (text) {
            //Handle multiple lines
            text = text.replace("\r", "");
            var lines = text.split("\n");
            if (lines.length == 1)
                $(container).append(document.createTextNode(lines[0]));
            else if (lines.length > 1) {
                $.each(lines, function (i, line) {
                    $(container).append(document.createTextNode(line));
                    $(container).append(document.createElement("br"));
                });
            }
        }
    };

    jpvs.writeln = function (container, text) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        jpvs.write(container, text);
        $(container).append(document.createElement("br"));
    };

    jpvs.writeTag = function (container, tagName, text) {
        if (!container)
            return;
        if (!tagName)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        var tag = document.createElement(tagName);
        $(container).append(tag);
        jpvs.write(tag, text);

        return $(tag);
    };

    jpvs.applyTemplate = function (container, template, dataItem) {
        if (!container)
            return;
        if (!template)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        /*
        When used with DataGrid, the template might be in the form { isHeader: true, template: .... }
        */
        if (template.template)
            return jpvs.applyTemplate(container, template.template, dataItem);

        /*
        The template might be a string, in which case we just write it
        */
        if (typeof (template) == "string") {
            jpvs.write(container, template);
            return;
        }

        /*
        Or it could be in the form: { fieldName: "ABC", tagName: "TAG", css: {}, selector: function(fieldValue, dataItem) {} }.
        Extract dataItem.ABC and write it as text (optionally in the specified tag name).
        */
        if (template.fieldName) {
            var fieldValue = dataItem && dataItem[template.fieldName];
            if (template.selector)
                fieldValue = template.selector(fieldValue, dataItem);
            else
                fieldValue = fieldValue && fieldValue.toString();

            if (template.tagName)
                jpvs.writeTag(container, template.tagName, fieldValue);
            else
                jpvs.write(container, fieldValue);

            //Apply CSS by means of jQuery.css()
            if (template.css)
                container.css(template.css);

            return;
        }

        /*
        Or it could be a function. Call it with this = container.
        */
        if (typeof (template) == "function")
            return template.call($(container), dataItem);

        /*
        Don't know what to do here.
        */
        jpvs.alert("JPVS Error", "The specified template is not valid.");
    };

    /*
    This function handles extraction of data from various types of data sources and returns data asynchronously to a callback.
    The object passed to the callback is as follows: 
    {
    total: total number of records in the full data set,
    start: offset in the data set of the first record returned in the "data" field,
    count: number of records returned in the "data" field; this is <= total,
    data: array with the returned records
    }

    Parameter "start" is optional. When not specified (null or undefined), 0 is implied.
    Parameter "count" is optional. When not specified (null or undefined), the entire data set is returned.
    Parameter "options" is optional and may contain sorting/filtering options. When not specified, the default sort/filter is intended.
    */
    jpvs.readDataSource = function (data, start, count, options, callback) {
        if (!data) {
            //No data source provided. Return no data.
            returnNoData();
        }
        else if (typeof (data) == "function") {
            //The data source is a function. It might be either synchronous or asynchronous.
            //Let's try to call it and see what comes back. Pass whatever comes back to our internalCallback function.
            var ret = data(start, count, options, internalCallback);

            if (ret === undefined) {
                //No return value. The function is probably asynchronous. The internalCallback will receive the data.
            }
            else if (ret === null) {
                //The function explicitly returned null. Means "no data". Let's return no data.
                returnNoData();
            }
            else {
                //The function explicitly returned something. That's the data we are looking for. Let's pass it to the internal callback
                internalCallback(ret);
            }
        }
        else if (data.length) {
            //"data" is a static collection of records, not a function. We are supposed to return records between start and start+count
            var tot = data.length;
            var sliceStart = Math.max(0, start || 0);
            var dataPortion;
            if (count === undefined || count === null) {
                //Get from start to end
                dataPortion = data.slice(sliceStart);
            }
            else {
                //Get from start to start+count
                var sliceCount = Math.max(0, count || 0);
                var sliceEnd = sliceStart + sliceCount;
                dataPortion = data.slice(sliceStart, sliceEnd);
            }

            callback({
                total: tot,
                start: sliceStart,
                count: dataPortion.length,
                data: dataPortion
            });
        }
        else {
            //"data" is not an array-like object. Let's return no data
            returnNoData();
        }

        function returnNoData() {
            callback({
                total: 0,
                start: 0,
                count: 0,
                data: []
            });
        }

        function internalCallback(val) {
            /*
            "val" is the return value of the "data" function. It might be a plain array or it might be structured as a partial data set.
            */
            if (val.total && val.data) {
                //Return it directly
                callback({
                    total: val.total,
                    start: val.start || 0,
                    count: val.data.length || 0,
                    data: val.data
                });
            }
            else if (val.length) {
                //The function returned an array. We must assume this is the entire data set, since we have no info as to which part it is.
                callback({
                    total: val.length,
                    start: 0,
                    count: val.length,
                    data: val
                });
            }
            else {
                //No data or unknown format
                returnNoData();
            }
        }
    };


    jpvs.showDimScreen = function (delayMilliseconds, fadeInDuration, template) {
        //Schedule creation
        if (jpvs.showDimScreen.timeout)
            return;

        jpvs.showDimScreen.timeout = setTimeout(create, delayMilliseconds != null ? delayMilliseconds : 500);

        function create() {
            jpvs.showDimScreen.timeout = null;

            if (jpvs.showDimScreen.element)
                return;

            //Create a DIV that covers the entire window
            jpvs.showDimScreen.element = jpvs.writeTag("body", "div").addClass("DimScreen").css({
                position: "fixed",
                top: "0px", left: "0px", width: "100%", height: "100%",
                display: "none"
            });

            //If provided, we can use a custom template for filling the DIV
            jpvs.applyTemplate(jpvs.showDimScreen.element, template);

            //Finally, fade in the DIV
            jpvs.showDimScreen.element.fadeIn(fadeInDuration != null ? fadeInDuration : 250);
        }
    };

    jpvs.hideDimScreen = function (fadeOutDuration) {
        //If we are still waiting for the timeout to elapse, simply cancel the timeout
        if (jpvs.showDimScreen.timeout) {
            clearTimeout(jpvs.showDimScreen.timeout);
            jpvs.showDimScreen.timeout = null;
        }

        //If a screen dimmer is present, fade it out and remove it
        if (jpvs.showDimScreen.element) {
            var x = jpvs.showDimScreen.element;
            jpvs.showDimScreen.element = null;
            x.fadeOut(fadeOutDuration != null ? fadeOutDuration : 250, function () { x.remove(); });
        }
    };

    jpvs.fitInWindow = function (element) {
        if (!element)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = toElement(element);

        //Measure the element, relative to the document
        var pos = element.offset();
        var x = pos.left;
        var y = pos.top;
        var w = element.outerWidth();
        var h = element.outerHeight();

        //Measure the window, relative to the document and account for scrolling
        var wnd = $(window);
        var wx = wnd.scrollLeft();
        var wy = wnd.scrollTop();
        var ww = wnd.width();
        var wh = wnd.height();

        //Now move x and y, trying to make sure "element" [valMin, valMax] is entirely visible in the window [min, max]
        var dx = translate(wx, wx + ww, x, x + w);
        var dy = translate(wy, wy + wh, y, y + h);

        if (dx != 0 || dy != 0) {
            var newX = x + dx;
            var newY = y + dy;

            element.show().css({
                position: "absolute",
                left: newX + "px",
                top: newY + "px"
            });
        }

        function translate(min, max, valMin, valMax) {
            if (valMin < min)
                return min - valMin;
            else if (valMax > max)
                return max - valMax;
            else
                return 0;
        }
    };

    jpvs.fixTableHeader = function (element) {
        if (!element)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = toElement(element);

        //Let's find the element's scrolling container (the first ancestor that has overflow: auto/scroll/hidden)
        var scrollingContainer = element;
        while (true) {
            scrollingContainer = scrollingContainer.parent();
            var test = scrollingContainer[0].nodeName;
            if (!scrollingContainer || scrollingContainer.length == 0 || scrollingContainer[0].nodeName.toLowerCase() == "body") {
                //We have just climbed up to the body, so we have no scrolling container (we scroll the window)
                scrollingContainer = null;
                break;
            } else {
                var overflow = scrollingContainer.css("overflow");
                if (overflow == "auto" || overflow == "scroll" || overflow == "hidden") {
                    //We have found it
                    break;
                }
            }
        }

        //Measure all tbody columns
        var colWidths = [];
        element.find("tbody > tr:first").each(function () {
            $(this).children("td").each(function (i, td) {
                colWidths[i] = $(td).outerWidth();
            });
        });

        //Set fixed table layout and explicitly set columns widths
        var sumOfAllCols = 0;
        $.each(colWidths, function (i, colWidth) {
            sumOfAllCols += colWidth;
        });

        element.css({
            "table-layout": "fixed",
            "width": sumOfAllCols + "px"
        });

        element.children("colgroup, col").remove();

        var colgroup = jpvs.writeTag(element, "colgroup");
        $.each(colWidths, function (i, colWidth) {
            jpvs.writeTag(colgroup, "col").css("width", colWidth + "px");
        });

        //Split the table into two tables. The first one contains the thead, the second the tbody
        var header = element.clone().attr("id", element.attr("id") + "_header");
        header.insertBefore(element);

        header.children("tbody, tfoot").remove();
        element.children("caption, thead").remove();

        //No margin between the two tables
        header.css("margin-bottom", "0px");
        element.css("margin-top", "0px");

        //Placeholder, for keeping other things in place when we use absolute positioning for the header
        var headerPlaceHolder = jpvs.writeTag(element.parent(), "div");
        headerPlaceHolder.insertBefore(element);

        headerPlaceHolder.css({
            width: sumOfAllCols + "px",
            height: header.outerHeight() + "px"
        });

        //On scroll, decide where to put the header
        var yHeaderRTSC;        //Relative To Scrolling Container (or window)
        var calcX, calcY;       //Functions that calculate (x, y) when we must float the header
        measurePosition();

        (scrollingContainer || $(window)).resize(measurePosition).scroll(refreshHeaderPosition);

        //Let's return an object that allows code manipulation (manual refreshing, for now)
        var deactivated = false;

        return {
            refresh: function () {
                //Re-measure and reposition
                measurePosition();
            },

            deactivate: function () {
                deactivated = true;

                //Clean things and move thead back into place; then delete the cloned table
                headerPlaceHolder.remove();
                var thead = header.children("thead");
                var tbody = element.children("tbody");
                thead.insertBefore(tbody);
                element.css("margin-top", header.css("margin-top"));
                header.remove();
            }
        };


        function measurePosition() {
            if (deactivated)
                return;

            //Before measuring, let's reposition the header into its natural location
            setNormal();

            var position = scrollingContainer && scrollingContainer.css("position");
            var absolute = (position == "absolute" || position == "fixed" || position == "relative");

            //From Relative To Offset Parent...
            var xHeaderRTOP = header.position().left;
            var yHeaderRTOP = header.position().top;
            var yScrollingContainerRTOP = 0;
            if (scrollingContainer) {
                if (!absolute)
                    yScrollingContainerRTOP = scrollingContainer.position().top;

                //Also account for scrolling
                xHeaderRTOP += scrollingContainer.scrollLeft();
                yHeaderRTOP += scrollingContainer.scrollTop();
            }

            //...to Relative To Scrolling Container
            yHeaderRTSC = yHeaderRTOP - yScrollingContainerRTOP;

            //Table margins and border sizes in pixels, so we can subtract them when absolute positioning
            var xDelta = parseFloat(header.css("margin-left")) + parseFloat(header.css("border-left-width"));
            var yDelta = parseFloat(header.css("margin-top")) + parseFloat(header.css("border-top-width"));

            //Functions for applying the floating position
            calcY = function () {
                if (scrollingContainer) {
                    if (absolute)
                        return scrollingContainer.scrollTop() - yDelta;
                    else
                        return yScrollingContainerRTOP - yDelta;
                }
                else
                    return $(window).scrollTop() - yDelta;
            };

            calcX = function () {
                if (scrollingContainer)
                    return xHeaderRTOP;
                else
                    return xHeaderRTOP;
            };

            //At the end, let's restore the correct positioning based on scroll state
            refreshHeaderPosition();
        }

        function getScrollingContainerScrollState() {
            var $scr = scrollingContainer || $(window);

            return {
                top: $scr.scrollTop(),
                left: $scr.scrollLeft()
            };
        }

        function refreshHeaderPosition() {
            if (deactivated)
                return;

            //If the header is scrolling upwards out of the container, then fix the header, otherwise leave it in the
            //original position
            var scroll = getScrollingContainerScrollState();
            if (scroll.top > yHeaderRTSC)
                setFloating();
            else
                setNormal();
        }

        function setNormal() {
            headerPlaceHolder.hide();
            header.css({
                position: "static"
            });
        }

        function setFloating() {
            //Float the header
            headerPlaceHolder.show();
            header.css({
                position: "absolute",
                top: calcY() + "px",
                left: calcX() + "px",
                "z-index": 99999
            });
        }
    };

})();
;


jpvs.Event = function (widget) {
    //The result of "new jpvs.Event(...)" is the object "obj", which has props "widgets" and "handlers" and can also be called as a function
    //(the "bind" function)
    var obj = function (handlerName, handler) {
        return obj.bind(handlerName, handler);
    };

    obj.bind = jpvs.Event.prototype.bind;
    obj.unbind = jpvs.Event.prototype.unbind;
    obj.fire = jpvs.Event.prototype.fire;

    obj.widget = widget;
    obj.handlers = {};
    return obj;
};

jpvs.Event.prototype.bind = function (handlerName, handler) {
    if (!handler) {
        handler = handlerName;
        handlerName = new Date().toString();
    }

    this.handlers[handlerName] = handler;

    return this.widget;
};

jpvs.Event.prototype.unbind = function (handlerName) {
    delete this.handlers[handlerName];
    return this.widget;
};

jpvs.Event.prototype.fire = function (widget, handlerName, params, browserEvent) {
    if (handlerName)
        return fireHandler(this.handlers[handlerName]);
    else {
        var ret = true;
        for (var hn in this.handlers) {
            var h = this.handlers[hn];
            var ret2 = fireHandler(h);

            //Combine the return values of all handlers. If any returns false, we return false
            ret = ret && ret2;
        }

        return ret;
    }

    function fireHandler(handler) {
        if (handler) {
            if (widget)
                widget.currentBrowserEvent = browserEvent;

            var hret = handler.call(widget, params);

            if (widget)
                widget.currentBrowserEvent = null;
            return hret;
        }
    }
};
;


(function () {

    function getBody(sourceCode) {
        var i = sourceCode.indexOf("{");
        var j = sourceCode.lastIndexOf("}");
        return sourceCode.substring(i + 1, j);
    }

    function getArgs(sourceCode) {
        var i = sourceCode.indexOf("(");
        var j = sourceCode.indexOf(")");

        //Split on commas and trim
        var argNames = sourceCode.substring(i + 1, j).split(",");
        for (var k = 0; k < argNames.length; k++)
            argNames[k] = $.trim(argNames[k]);

        if (argNames.length == 1 && argNames[0] == "")
            return [];
        else
            return argNames;
    }

    function serializeCall(argsArray, func) {
        var functionSourceCode = func.toString();
        var functionBody = getBody(functionSourceCode);
        var functionArgs = getArgs(functionSourceCode);

        var call = {
            args: argsArray,
            argNames: functionArgs,
            body: functionBody
        };

        var serializedCall = jpvs.toJSON(call);
        return serializedCall;
    }

    function deserializeCall(serializedCall) {
        var call = jpvs.parseJSON(serializedCall);

        //Recreate the function using the Function constructor
        var args = call.argNames;
        args.push(call.body);
        var func = Function.constructor.apply(null, args);

        //Now call the function and return its return value
        return func.apply(null, call.args);
    }

    jpvs.Function = {
        serializeCall: serializeCall,
        deserializeCall: deserializeCall
    };

})();
;


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
;


/**
* jQuery JSON Plugin
* version: 2.3 (2011-09-17)
*
* This document is licensed as free software under the terms of the
* MIT License: http://www.opensource.org/licenses/mit-license.php
*
* Brantley Harris wrote this plugin. It is based somewhat on the JSON.org
* website's http://www.json.org/json2.js, which proclaims:
* "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
* I uphold.
*
* It is also influenced heavily by MochiKit's serializeJSON, which is
* copyrighted 2005 by Bob Ippolito.
*/
(function () {

    jpvs.parseJSON = function (x) {
        return $.parseJSON(x);
    };

    var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g,
		meta = {
		    '\b': '\\b',
		    '\t': '\\t',
		    '\n': '\\n',
		    '\f': '\\f',
		    '\r': '\\r',
		    '"': '\\"',
		    '\\': '\\\\'
		};

    /**
    * jpvs.toJSON
    * Converts the given argument into a JSON respresentation.
    *
    * @param o {Mixed} The json-serializable *thing* to be converted
    *
    * If an object has a toJSON prototype, that will be used to get the representation.
    * Non-integer/string keys are skipped in the object, as are keys that point to a
    * function.
    *
    */
    jpvs.toJSON = typeof JSON === 'object' && JSON.stringify
		? JSON.stringify
		: function (o) {

		    if (o === null) {
		        return 'null';
		    }

		    var type = typeof o;

		    if (type === 'undefined') {
		        return undefined;
		    }
		    if (type === 'number' || type === 'boolean') {
		        return '' + o;
		    }
		    if (type === 'string') {
		        return quoteString(o);
		    }
		    if (type === 'object') {
		        if (typeof o.toJSON === 'function') {
		            return jpvs.toJSON(o.toJSON());
		        }
		        if (o.constructor === Date) {
		            var month = o.getUTCMonth() + 1,
					day = o.getUTCDate(),
					year = o.getUTCFullYear(),
					hours = o.getUTCHours(),
					minutes = o.getUTCMinutes(),
					seconds = o.getUTCSeconds(),
					milli = o.getUTCMilliseconds();

		            if (month < 10) {
		                month = '0' + month;
		            }
		            if (day < 10) {
		                day = '0' + day;
		            }
		            if (hours < 10) {
		                hours = '0' + hours;
		            }
		            if (minutes < 10) {
		                minutes = '0' + minutes;
		            }
		            if (seconds < 10) {
		                seconds = '0' + seconds;
		            }
		            if (milli < 100) {
		                milli = '0' + milli;
		            }
		            if (milli < 10) {
		                milli = '0' + milli;
		            }
		            return '"' + year + '-' + month + '-' + day + 'T' +
					hours + ':' + minutes + ':' + seconds +
					'.' + milli + 'Z"';
		        }
		        if (o.constructor === Array) {
		            var ret = [];
		            for (var i = 0; i < o.length; i++) {
		                ret.push(jpvs.toJSON(o[i]) || 'null');
		            }
		            return '[' + ret.join(',') + ']';
		        }
		        var name,
				val,
				pairs = [];
		        for (var k in o) {
		            type = typeof k;
		            if (type === 'number') {
		                name = '"' + k + '"';
		            } else if (type === 'string') {
		                name = quoteString(k);
		            } else {
		                // Keys must be numerical or string. Skip others
		                continue;
		            }
		            type = typeof o[k];

		            if (type === 'function' || type === 'undefined') {
		                // Invalid values like these return undefined
		                // from toJSON, however those object members
		                // shouldn't be included in the JSON string at all.
		                continue;
		            }
		            val = jpvs.toJSON(o[k]);
		            pairs.push(name + ':' + val);
		        }
		        return '{' + pairs.join(',') + '}';
		    }
		};

    function quoteString(string) {
        if (string.match(escapeable)) {
            return '"' + string.replace(escapeable, function (a) {
                var c = meta[a];
                if (typeof c === 'string') {
                    return c;
                }
                c = a.charCodeAt();
                return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) + '"';
        }
        return '"' + string + '"';
    }

})();
;


(function () {

    var taskMap = {};

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
;


(function () {

    var chars = "QWERTYUIOPLKJHGFDSAZXCVBNM1234567890";
    var N = chars.length;
    var M = 10 * N;

    jpvs.randomString = function (len) {
        var s = "";
        for (var i = 0; i < len; i++) {
            var c = Math.floor(Math.random() * M) % N;
            var ch = chars[c];
            s += ch;
        }

        return s;
    };

})();
;


jpvs.Resources = {
    images: {
		empty16x16: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA2SURBVDhPpcixEQAgAAMh9186LkDhnwUNZ9sXZsEsmAWzYBbMglkwC2bBLJgFs2AWzIL5bucCxa39H+iOy+4AAAAASUVORK5CYII=",
        loading: "data:image/gif;base64,R0lGODlhGAAIAPcAAAAAAP8A3ICAgP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCgABACwAAAAAGAAIAAAIRAADCBxIsKBBggASKhSocGGAhgkZCpgoAADDARgHWHyYUaNEihsBdAw58uNEkhlRYgxJseLFlC9XMoQ4s2FNhwdz5gwIACH5BAkKAAEALAAAAAAYAAgAAAhDAAMIHEiwoEGCABIqFKhwYYCGCRkOmDgAAEMBGAVYfEixokSKGwFk1PhxYsiOIUeeBFnS40OVLUNCZDjzYc2DOHEGBAAh+QQJCgABACwAAAAAGAAIAAAIQwADCBxIsKBBggASKhSocGGAhgkZDpg4AIBEihYfCtgoICMAihUvTvTIsaPIkA9BkuToUeXJlRs9QmQ482HNgzhxBgQAIfkECQoAAQAsAAAAABgACAAACEMAAwgcSLCgQYIAEioUqHBhgIYJGQ6YOAAAQwEYBVh8SLGiRIobAWTU+HFiyI4hR54EWdLjQ5UtQ0JkOPNhzYM4cQYEADs=",

        closeButton: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADzSURBVDhPY2BmZv7EwMDwn1zMyMrK+uXnz5/7gQaQDJiYmHyYSNaFpgHDAD09PSuQyRcvXuRCVtvW1iYHEgfRKGaAvPDv37/NyBgUHjo6Om9hYufPn98LEmtpabmIrg6rF1avXn38ypUrQjDbYmNjDYAGvquqqnqE4WVsLgDZEhUVdQ9kK4wGuQKbS/HGAig8QC4BuSg4OPgtuu0EYwGkGaRp/fr1ErhiC2c0gmwH+Rtk+7JlyxTXrl0rjNUQbGEACm2Q/2H+hoUDtjBgQDcAX5QhRy3IMHDyRzYAphldIUgx0CvHYLECcwmIP/B5gYHS7AwAM9IzlWy9T8kAAAAASUVORK5CYII=",
        closeButtonHover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAENSURBVDhPY9TW1v6rqqrKxEAGuHHjBgOjo6Pjn717994lQz+Dk5OTGlk2I1uGYcDs2bNlm5qa1N6+fcuKrPDUqVP8IHEQjdeA1NTUxyAF69atk4ApBBm2Y8cOcQ8Pj5dmZmYf8RoAkoyMjHzy/PlzTphtIMMkJSW/o2sGqcUaBsBY+WZkZPQBZOuWLVvEQIYFBQW9wBbQOAPRx8fnFcjWc+fOCYBcJCws/JskA0CKQTaD6Js3b/LgimacLgDFBsgFINtBrrh9+zYX0S4ABR7M37DwWL58uQxRBiBHGczfoPAAaQa5Ct0QFC+ANE+dOlURW5TBohYUK8iGDHxeYFRRUfkrIyNDVqZ68OABAwDuhIRQ92DTiAAAAABJRU5ErkJggg==",

        subMenuMarker: "data:image/gif;base64,R0lGODlhBAAHAPAAAAAAAP///yH5BAEAAAEALAAAAAAEAAcAAAIIRA4WaeyrVCgAOw==",

        dataGridColumnButton: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAP0lEQVQoU2NsaGjYwkAIgBT9//8/ChcGGwI1CWQaVgxXBDIFmyKQOIoidIUw6zEUwRQiuw+rInQPwBWBGPgwACtpkpAwaQ17AAAAAElFTkSuQmCC",
        dataGridColumnButtonHover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAPklEQVQoU2NsaGj4z0AIgBQBAYjAisGGQE0CmYYVwxWBTMGmCCSOoghdIcx6DEUwhcjuw6oI3QNwRSAGPgwAytOhjjbmr7UAAAAASUVORK5CYII=",

        moveButton: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADlSURBVHjapFLRDsIgDLxuU598WvgAfdXo/3+Xr7BaGDDoGDGxySUb9NrrFQLu2IIFSwEnB44EqGHDPbPFAMh9QCJzJp/My39zUTCT129gWjtXXSPJSfVMkH9Lmoy19a1VIMkV4kdyzmqEODCzV6CJSyN5T04xKdkNw6DJHE0LMcSuvCUdKaiCiwLe7Tcu2XGXcQ1nITljNk/M5pGLiBST9o3GCHI+klKQupM3MY7giVr6oXwoD9JuLfXcbpHjFlzzhf0aw0berSoYVhjYK5AeUC2TNh51RIw9hdy9lC2EVfwTXwEGAJ3OoklJmLc2AAAAAElFTkSuQmCC",

        nodeClosed: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuNtCDrVoAAABrSURBVDhP7ZI9CsAgDEY9fM7g6iReJYcIuAXUwSN8kkLHgj+FLs0cHo+XOPfPYwFmRu8d24lijEgpIee8BzFArRUhBIjIOsQApl9KgfcerbU1yA0wiKqCiC6j6SavGBw3OLrC8R9Mx/p8cQCaS2KwCQA20AAAAABJRU5ErkJggg==",
        nodeOpen: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuNtCDrVoAAABCSURBVDhPY2AYBfQJgV27dv3v6Oj4T5ZtIM1qampgTLIBMM2RkZGkG4CsmWQD0DWTbAAowGD+htFkByLJATcCNQAAuT01LwirJNQAAAAASUVORK5CYII=",
        nodeNoChildren: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuNtCDrVoAAABlSURBVDhP7ZAxCoAhCIW7/zl0ChcHIQiiwQt0IX9sCNoy+LcEF/F9Pl9Kr/5JgIgMAAwRV4uIHV9zYSllCcYYExQC+HKt1VR1Cq8ALmbmO0BrbVnuvcdeyDlvAbp9nx1n8BZjCXzXd1UGM4buRAAAAABJRU5ErkJggg==",

        down: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAkJSURBVHhe7d3Pp99XHsfxyyyGMmQxlDKLEoYsSildlOxCCLMIJXQRSgmhdBFK6aIMpbuQRSghi1BKFkMpswhDmcUwf1Lfr+l0Ok1O76/v5/P9nPM5jwfPTRe533vv5zScT855nwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6/t99bfq35KGK2s3a/ggN6rWHy6p77J2F/F11foCkvrscbWYq9W/qtYXktRXWatZs4v6rGp9MUl9lbW6uCvVP6rWF5TUR1mjWaur+KBqfVFJfXSnWs3vqudV6wtL2raszazRVb1Xtb64pG17tzqKR1XrA0japofV0fyp8lpQ6qOsxazJo/qkan0YScft4+ro/lD9vWp9IEnHKWswa3ETt6vWh5J0nLIGN5NXDt9UrQ8mad2eVZt7u2p9OEnrlrXXhS+r1geUtE5Zc914o/pn1fqgkpYta+31qiv3q9aHlbRs96ru5Oqh76vWB5a0TN9VB1/ztZZbVetDS1qmm1XXnlatDy7psJ5U3btWtT68pMuXf++ftTWEL6rWNyHpcn1eDeOP1Q9V6xuRdLFyzVfW1FA+rFrfjKSLdbcajqlC0uFlDa1+zddaTBWSDut6NbRMKGl9Y5JOL1fvDc9UIeniZc28We2CqULSxXpQ7UauLDJVSDpfL6rNrvlaSyaWtL5ZSb/u/Wp3TBWSzu7batjXfmfJ5JLWNy3pp96pdi0TTFrfuDR7X1W7Z6qQ9Gq55itX600hk0xaPwRp1nKl3jRMFZJ+KWvhtWoqpgpJP5Wr9KaTVx2ZbNL6gUizlCv0pmWqkGbvrWpqpgpp1nJ13vRMFdKM5cq84a75WksmnbR+SNJe+6jiv0wV0kzlmq9up/tsxVQhzVKuyqMhk09aPzBpL+WKPH6DqULaczkDkyvyOEUmoLR+eNLo5Wo8zpBXI64P097KM32l4hxMFdLeypV4nJOpQtpTuQpvt9d8rSUTUVo/TGm0chUel2CqkEYvV+BxSaYKaeTy7OYKPA7wadX64Uq9l6vvOJCpQhqxXPO1u+k+WzFVSKOVK+9YSF6hZGJK6wct9VauumNhpgpplHLVHSswVUi9lyvuWEleqbg+TL2WZ/P1ihWZKqRey9V2rMxUIfXYd5Vrvo7EVCH11s2KIzJVSL2Uq+w4MlOF1EP59/65yo4N/LVq/VKkY5Ur7NhIXrl4LaityhkV0302ZqqQtupuxcby6iWvYFq/IGmtcmWda746kVcwrV+StFa5so6OmCqkY/WoojN5FeP6MK1dnrE3KzpkqpDW7kFFp0wV0pq9qFzz1TlThbRW71d0Lq9mTBXS0uVKOq/9BmGqkJbunYqBmCqkpfqqYjB5VeO1oA4tZ03eqBiQqUI6tPsVgzJVSIeUq+deqxhYXt20frnSWd2qGJypQrpMTyt2wlQhXbS3KnYkr3Jav2jp5b6o2BlThXSefqhc87VTpgrprD6q2Km80jFVSL9VzpCY7rNzf6lav3zpRsUETBXSy+XsCJPIK57WQ6A5y5mRqxUTMVVIP/dZxWRMFVLKWZErFRPKK5/WQ6F5ulMxKVOF5u555ZqvyZkqNG85IwKmCk3Ywwr+48+V68PmKb/rnA2B/zFVaJ5yJgR+xVShOcpZENN9aLpbtR4a7afbFTSZKrTvcgYETvVe1Xp4NH5vV3CmR1XrAdK4fVnBuZgqtK9y5iNnP+DcHlSth0njda+CC8mrohdV64HSOOWsh2u+uBRThcYvZz3gUkwVGruc8YCDvFO1Hi71XTZxr1VwMFOFxitnO2ARpgqNVc50mO7Dou5XrYdN/ZUzHbAoU4XGKGc5XPPFKkwV6r/rFazmadV68LR9OcMBqzJVqM/y2i9nOGB1pgr1V85uwFHkZNkPVetB1PHLmQ3XfHFUpgr1U85swFGZKtRHOavhtR+buFG1Hkodr5zVgM18XbUeTK1fzmjApkwV2qaczXijgs19VrUeUq1XzmZAF65Upgodr5zJyNkM6IapQsfrVgVdyauo51XrgdVy5SwGdMlUofXLWQzolqlC6/VFBV0zVWidcvbCNV8M4ZOq9RDr8uXsBQzBVKFlyzVfpvswFFOFlitnLmAoeS34TdV6oHX+HlcwJFOFDiubqVcrGJapQpcvZyxgaDmxZqrQxcvZipyxgOGZKnTx7lSwCzm59n3VetD1ajlT4ZovdiUn2FoPu17t3Qp2x1Shs3tYwS6ZKnR6ee2XUeywWznR1nr4dXLycQW7lhNtpgq9Wq75Mt2HKZgq9Gq3K5hCTrblhFtrIczYswqmYqrQL71dwXRMFTo5+bKCKeWk28zXh+WMREatw7Rmnip0r4KpzTpVKKPVXfMF5YOqtUj23M0KKLNNFXpSAf9nlqlC2fS8VgEvmWGq0OcV0JCTcHt+LZjNTtN94BR7niqUEerAKXIiLifjWgto5HL2wTVfcA45GddaRCN3vQLOYW9ThbK5CVxATsi1FtNoZVMzI9OBC8pJudaiGqkHFXAJo08Vyoh013zBAUaeKpQR6cABcmJuxKlC31Ze+8ECRpwqlNHowEJGmiqUkejAgnKCrrXYeiubltm8BBY2wlShbFoCK+h9qlDOMGQUOrCSD6vW4uuhbFYCK+p1qlA2KYEj6HGqUEafA0fyuGotxC3K5iRwRL1MFcqmpGu+YAM9TBXKqHNgAzlpt+VUoWxGmu4DG7pTtRbnMcpmJLChraYKZRMS6MC7VWuRrlU2H7MJCXTiYdVarGuUzUegI8eaKpRNx4w0BzrzcdVatEuWTUegQ2tPFcpmo2u+oGNrThXKZiPQsfwN/axqLeBDyiYjMIClpwplczGbjMAglpwqlM1FYCBLTRXKpqLpPjCge1VrUV+kbCoCAzp0qlA2E4GBHTJVKJuJwOCeVK0FflrZRAR24KJThbJ5+HoF7MTnVWuxt8rmIbAjubjzPNeHfVe55gt26DxThW5WwA6dNVUom4XAjl2vWos//94/m4XAzrWmCmWTEJjAy1OFsjloug9M5NPq5/8B3M1/AObx81ShbAq65gsmlAs+sykITMjf/AAAAAAAAAAAAAAAAAAAAAAAABs4OfkRfHZoUdIEJXsAAAAASUVORK5CYII=",
        minus: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAXhSURBVHhe7dQxahhADEXBnN0nzI0cpxCkeM0mGCI0A6/53RbaH5+fn5KOlqOkG+Uo6UY5SrpRjpJulKOkG+Uo6UY5SrpRjpJulKOkG+Uo6UY5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOX4HX35+OqnpL/qo+7qX8vxO/r9gD8eI+ktH4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHS4//MDAHbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPutUdKNcpR0oxwl3ShHSTfKUdKNcpR0oxwl3ShHSTfKUdKNcpR0oxwl3ShHSTfKUdKNcpR0oxwlXejzxy+8PqQAvdktbgAAAABJRU5ErkJggg==",
        plus: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAZsSURBVHhe7dTBCRBnFIVR67AoF5bkNkWkpXRknpBFJB+EoF4I/3lwNnc3M8z34evXr8CjcgTekCPwhhyBN+QIvCFH4A05Am/IEXhDjsAbcgTekCPwhhyBN+QIvCFH4A05Am/IEXhDjsAbcgTekCPwhhyBN+QIvCFH4A05Am/IEXhDjsAbcgTekCPwhhyBN+TIxt2n8wf/8LHeFz9fjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEc27gSgCcBIjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEc27gSgCcBIjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5Pgr3H0+X/jO76d+gNf9dup9vexz/Vc/Ksdf4a+HqI8N/Lsv9V/9qBx/hW8P8LeHAf4bAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA87H8fgM/fHoLv/H7qY7/ut1Pv62Wf67/6UTmycffp1A/wuo/1vvj5cmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEc27gSgCcBIjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEc27gSgCcBIjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEfgDTkCb8gReEOOwBtyBN6QI/CGHIE35Ai8IUfgDTkCb8gReEOOwBtyBN6QI/CGHIE35Ai8IUfgDTkCb8gReEOOwAu+fvgTWMJbNXr94sMAAAAASUVORK5CYII=",
        up: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAk4SURBVHhe7d3P5+5lHsfxmMUQw1kMh5hFxNAiIs4izi4OMYuIQ4tDxCGixSGiRQzR7tAiIlpERIshYhYxxCyG+ZN6vzrnzJzq+p5zf+/v/bmvH5/Hg6fJbPr++Fz5+lz3db2fAQAAAAAAAAAAAAAAAAAAAAAAYCB/ePi/wA7drm4++EdgT/5U/av6R+UvAdiZD6r/PuxO/g9gH16o/lM9+g9A/hL4cwXswOfVo8X/qI8qYHF56ffbxZ/yF8GLFbCoP1Z56df6D0D6sgIW9XbVWviPd6sCFpOXfHnZ11r0j/d9lb8UgIXkJV9rwbe6WwGLyMu91kK/qH9X1ytgAXm511roT+qTCpjc61VrgR/SyxUwqbzM+6FqLe5D+roCJpWXea2FfZneqIDJPFflZV5rUV+mf1Y5OQhMJC/xWgv6mN6rgEnk5V1rIR9bzgn8pQIGl8s98vKutZCv0v0KGFxe2rUW8Cm6UQGDysu6vLRrLd5T9F3l+jAYVF7WtRbuKctFosBg8pLu8Wu+tionCq9VwEDykq61YLfowwoYRF7OtRbqVuUvjVwsCnSWl3J5OddaqFuWi0WBzvJSrrVAz9FrFdDJo+k+rcV5jnLBqOvDoJO8jGstzHP2TgWc2W+n+/Tqp8pUITiz1nSfXn1cAWeSl2+thdizlypgY0+b7tOrrypgY4dM9+lVLiAFNpKXbXnp1lp8I5STiM9WwAbysq218Ebq3Qo4sctO9+lVLiLNhaTACeUlW2vBjdinFXAiV5nu06tXKuCKrjrdp1ffVq4PgyvKS7XWApuhNyvgSKea7tOrHytTheBIp5zu06t7FXBJp57u06ucWHy+Ag6Ul2ffVK0FNWOfVcCBtpzu06ubFfAUW0/36VVOMNoWhKd4v2otoBW6UwEXONd0n17lAlPXh8EF8rKstXBW6qMK+I1Xq9aCWa38hZOTjcBDvab79OrLCnjoraq1UFbuVgW7l1HbPaf79Or7ylQhdm+E6T69ulvBbo0y3adXOel4vYJd+qJqLYw9lROPsDsjTvfpVU4+wm6MOt2nV19XsBsZqd1aCHsuJyBheaNP9+lVTkC6PozlzTDdp1fvVbCsjNBuPfh6ULZEcyISljTTdJ9e3a9gOTNO9+nVjQqWkZHZM0736VVORro+jGXMPN2nV7crmN7s0316lROSOSkJU8uo7NYDrqeXk5IwrYzIbj3YOqxsC+bEJExntek+vfq8gulkNHbrgdbly8lJmEY+057R2K2HWZcvJyddH8Y0Vp7u06ucoIThZRT2nq/52qqcoDRViOHtYbpPr3KSEoa1l+k+PcuJShjO3qb79ConKmE4GX3demB1+nKyEoax1+k+vcr1YTlhCUPY83SfXuWEJXT318q23/nLCcuctISuTPfpV05aQjem+/QvJy7h7PLZ9Iy4bj2UOl/fVq4P4+xM9xmnnLyEs8lIa9N9xiknL00V4mz+XrUeRPXrXgWbM91nzLIVm5OYsCnTfcYtJzFhM3+rWg+exulmBSeXz57nM+ith07jlOvDbAtycqb7zFNOZsLJZGS16T7zlJOZrg/jZEz3ma+PKrgy033mLNuCL1ZwtLxMymfNWw+Yxu/LCo5mus/83arg0kz3WaOc2DRViEvLZ8tbD5Tm624FBzPdZ62yhZsTnHAQ033W65MKnsp0n3V7uYILZdsvnyVvPTyav68ruJDpPuv3RgW/k8+Om+6zfjnR6fowfiefHW89MFqv9yr4H9N99lV+1znhCb/IZ8ZbD4rW7X4Fv3xWvPWAaP1uVOyY6T777rvK9WE7ZrqPblfsUD4b7povZev3WsXOmO6jR31YsSOm++jxsi34QsVO5DPhrQdB++3zih0w3UcX9VrFwkz30ZPKSVDXhy0snwFv/eKlR2VrmAWZ7qND+qkyVWhBpvvo0D6uWEg+8936RUsXla1iFmC6j47pq4oFmO6jY3u9YmK5+sk1Xzq2bBln65hJfVC1frHSob1bMSHTfXSKsnX8XMVk8tnu1i9UumzZQmYiN6vWL1I6tlcqJmC6j7YoW8muD5vA21XrFyhdtWwpMzDTfbRlP1amCg3MdB9t3b2KAb1Y2fbT1uUZyxYzgzHdR+fqs4qBmO6jc5etZgZguo96lK1m24IDuFu1fkHS1t2p6Mh0H/UsW86uD+vIdB/1LlvPdPBy1fqFSOcs24LZgubMTPfRKGULmjN6o2r9IqReZSuaM8hnsU330WhlK9pUoTMw3Uejli1pNmS6j0Yuz2a2ptnI/ar1g5dG6ZOKDZjuo1nKFjUnZLqPZipb1JzQ7ar1g5ZGLVvVnIDpPpqxbFW7PuwETPfRrGXLmit4oXLNl2Ytz262rjmS6T6avWxdcwTTfbRK2cLmEvKZatN9tErfVa4PuwTTfbRa2crmAKb7aMXyTF+reArTfbRqH1Y8Qa5Wav3gpBXKtmC2trmA6T5avWxt0/B61fqBSav1WsVjsu33Q9X6YUmrlS1u14c9xnQf7a13KspzlWu+tLd+qkwVKrlCqfUDklbv42rXTPfR3nup2qV8Ntp0H+29r6pdMt1HelC2wHfFdB/p/2UtPFvthuk+0q97t9qFXJHkmi/p12UrPFviyzPdR2r3abU0032kJ/dKtaRs++VqpNY3LelBmYC15PVhpvtIh/VmtRTTfaTD+7FaaqpQrkJqfaOS2t2rlmC6j3T5smaer6Znuo90XJ9VU8vVR61vTNJhZULWlEz3ka5e1tCU24Km+0in6U41lVx1lCuPWt+MpMuVLfSprg/LVUetb0TScWVi1hRM95FOX7YFs7aGlyuOWt+ApKuVyVlDM91H2rZb1ZBM95G27/tqyKlCudKo9QVLOm2ZpDUU032k85W1dr0ahuk+0nnLmhuC6T5Sn7L2uspnlL+pWl+cpG3LZK2uTPeR+pY12IXpPlL/sga7XB/2ftX6giSdt0zaOivTfaRxylrMmjybXFXU+kIk9SkTt87i1ar1BUjqWyZvbcp0H2ncsjY3vT7srar1L5Y0RpnAtYlrlek+0thljWatnpzpPtIcZa2elOk+0jxlrWbNnswXVetfJGnMMpHrJEz3keYsa/dKTPeR5i1rd8jrwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgQs888zP/xGhRUBjJvgAAAABJRU5ErkJggg=="
    }
};
;


(function () {

    var KEY_SESSIONID = "jpvs.SessionID";
    var sessionID;

    jpvs.getSessionID = function () {
        if (!sessionID) {
            //If not here, try to load it from sessionStorage
            try {
                sessionID = sessionStorage[KEY_SESSIONID];
            }
            catch (e) {
            }
        }

        if (!sessionID) {
            //If still not here, create a new one...
            sessionID = jpvs.randomString(50);

            //... and try to save it
            try {
                sessionStorage[KEY_SESSIONID] = sessionID;
            }
            catch (e) {
            }
        }

        //Now we certainly have it, although we might have not been able to save it into the sessionStorage in very old browsers
        return sessionID;
    };

})();
;


(function () {

    jpvs.addGestureListener = function (element, params, onGesture) {
        //Some sane defaults
        params = params || {};
        params.tapMaxDistance = params.tapMaxDistance || 15;
        params.longTapThreshold = params.longTapThreshold || 500;
        params.doubleTapThreshold = params.doubleTapThreshold || 250;
        params.rotationThreshold = params.rotationThreshold || (10 * Math.PI / 180);     //10deg

        params.allowedEventTargets = params.allowedEventTargets || function (target) {
            //Elements A, INPUT, SELECT, BUTTON are not allowed
            //Elements decorated with class "jpvs-Ignore-Touch" are not allowed
            //Also, any descendant of any of the above is not allowed
            return !$(target).is("a, a *, select, select *, input, input *, button, button *, .jpvs-Ignore-Touch, .jpvs-Ignore-Touch *");
        };

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = jpvs.getElementIfWidget(element);

        //Let's subscribe to touch events for the element
        element.on("touchstart", onTouch);
        element.on("touchmove", onTouch);
        element.on("touchend", onTouch);
        element.on("touchcancel", onTouch);

        //We want to track fingers
        var fingers = {};

        //We track shortTaps so we can decide if a shortTap is a doubleTap
        var lastShortTap = null;


        function onTouch(e) {
            //Get the touch event from the jQuery event
            var te = e.originalEvent;

            //We want to work on allowed target only. On not allowed targets we simply ignore the event, as if we didn't even attach an event handler
            if (!params.allowedEventTargets(te.target))
                return;

            //Event timestamp
            var now = new Date().getTime();

            //Let's track fingers
            trackFingers();

            //Now that we have the up-to-date finger situation, let's try to identify gestures
            identifyGestures();

            //Block propagation/default behavior
            e.stopPropagation();
            e.preventDefault();
            return false;

            //Utilities
            function callOnGesture(evt) {
                if (onGesture)
                    onGesture(evt);
            }

            function identifyGestures() {
                //Convert fingers to array
                var f = [];
                for (var i in fingers) {
                    var finger = fingers[i];
                    f.push(finger);
                }

                //Now look at fingers
                if (f.length == 1) {
                    //Single-finger gesture. See if it's dragging
                    var totalDx = f[0].current.clientX - f[0].start.clientX;
                    var totalDy = f[0].current.clientY - f[0].start.clientY;
                    var totalDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
                    if (totalDistance > params.tapMaxDistance) {
                        //This finger is dragging (and will be until removed)
                        f[0].dragging = true;
                    }

                    //If dragging, then fire event
                    if (f[0].dragging) {
                        var evt = {
                            target: f[0].start.target,
                            isDrag: true,
                            dragX: f[0].current.clientX - f[0].previous.clientX,
                            dragY: f[0].current.clientY - f[0].previous.clientY,
                            totalDragX: f[0].current.clientX - f[0].start.clientX,
                            totalDragY: f[0].current.clientY - f[0].start.clientY,

                            current: {
                                clientX: f[0].current.clientX,
                                clientY: f[0].current.clientY,
                                pageX: f[0].current.pageX,
                                pageY: f[0].current.pageY
                            },

                            start: {
                                clientX: f[0].start.clientX,
                                clientY: f[0].start.clientY,
                                pageX: f[0].start.pageX,
                                pageY: f[0].start.pageY
                            }
                        };

                        evt.toString = function () {
                            return "Drag: " + this.dragX + "; " + this.dragY + " - Total drag: " + this.totalDragX + "; " + this.totalDragY;
                        };

                        callOnGesture(evt);
                    }
                }
                else if (f.length == 2) {
                    //Double-finger gesture. See if it's zooming/rotating
                    //Let's measure the distance between the two fingers and the segment angle
                    var initialSegmentDx = f[0].start.clientX - f[1].start.clientX;
                    var initialSegmentDy = f[0].start.clientY - f[1].start.clientY;
                    var initialSegmentLength = Math.sqrt(initialSegmentDx * initialSegmentDx + initialSegmentDy * initialSegmentDy);
                    var initialSegmentAngle = Math.atan2(initialSegmentDy, initialSegmentDx);

                    var segmentDx = f[0].current.clientX - f[1].current.clientX;
                    var segmentDy = f[0].current.clientY - f[1].current.clientY;
                    var segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);
                    var segmentAngle = Math.atan2(segmentDy, segmentDx);

                    var previousSegmentDx = f[0].previous.clientX - f[1].previous.clientX;
                    var previousSegmentDy = f[0].previous.clientY - f[1].previous.clientY;
                    var previousSegmentLength = Math.sqrt(previousSegmentDx * previousSegmentDx + previousSegmentDy * previousSegmentDy);
                    var previousSegmentAngle = Math.atan2(previousSegmentDy, previousSegmentDx);

                    //See if we must activate rotation/zooming
                    var deltaLength = segmentLength - initialSegmentLength;
                    var deltaAngle = segmentAngle - initialSegmentAngle;

                    if (Math.abs(deltaAngle) > params.rotationThreshold) {
                        //The two fingers are rotating (and will be until removed)
                        f[0].rotating = true;
                        f[1].rotating = true;

                        //Attach the same rotate tracker object
                        var rotateTracker = f[0].rotateTracker || f[1].rotateTracker || {};
                        f[0].rotateTracker = rotateTracker;
                        f[1].rotateTracker = rotateTracker;
                    }

                    if (Math.abs(deltaLength) > params.tapMaxDistance) {
                        //The two fingers are zooming (and will be until removed)
                        f[0].zooming = true;
                        f[1].zooming = true;

                        //Attach the same zoom tracker object
                        var zoomTracker = f[0].zoomTracker || f[1].zoomTracker || {};
                        f[0].zoomTracker = zoomTracker;
                        f[1].zoomTracker = zoomTracker;
                    }

                    //If rotating, then fire event
                    if (f[0].rotating && f[1].rotating) {
                        var evt = {
                            target1: f[0].start.target,
                            target2: f[1].start.target,
                            isRotate: true,
                            angle: segmentAngle - previousSegmentAngle,
                            totalAngle: segmentAngle - initialSegmentAngle,

                            current1: {
                                clientX: f[0].current.clientX,
                                clientY: f[0].current.clientY,
                                pageX: f[0].current.pageX,
                                pageY: f[0].current.pageY
                            },

                            start1: {
                                clientX: f[0].start.clientX,
                                clientY: f[0].start.clientY,
                                pageX: f[0].start.pageX,
                                pageY: f[0].start.pageY
                            },

                            current2: {
                                clientX: f[1].current.clientX,
                                clientY: f[1].current.clientY,
                                pageX: f[1].current.pageX,
                                pageY: f[1].current.pageY
                            },

                            start2: {
                                clientX: f[1].start.clientX,
                                clientY: f[1].start.clientY,
                                pageX: f[1].start.pageX,
                                pageY: f[1].start.pageY
                            }
                        };

                        evt.toString = function () {
                            return "Rotate: " + this.angle + " - Total angle: " + this.totalAngle;
                        };

                        //Track the total angle also on the finger object, so on end rotate we can signal the total angle applied
                        f[0].rotateTracker.totalAngle = evt.totalAngle;
                        f[0].rotateTracker.target1 = evt.target1;
                        f[0].rotateTracker.target2 = evt.target2;
                        f[0].rotateTracker.start1 = evt.start1;
                        f[0].rotateTracker.start2 = evt.start2;
                        f[0].rotateTracker.current1 = evt.current1;
                        f[0].rotateTracker.current2 = evt.current2;

                        callOnGesture(evt);
                    }

                    //If zooming, then fire event
                    if (f[0].zooming && f[1].zooming) {
                        var evt = {
                            target1: f[0].start.target,
                            target2: f[1].start.target,
                            isZoom: true,
                            zoomFactor: segmentLength / previousSegmentLength,
                            totalZoomFactor: segmentLength / initialSegmentLength,

                            current1: {
                                clientX: f[0].current.clientX,
                                clientY: f[0].current.clientY,
                                pageX: f[0].current.pageX,
                                pageY: f[0].current.pageY
                            },

                            start1: {
                                clientX: f[0].start.clientX,
                                clientY: f[0].start.clientY,
                                pageX: f[0].start.pageX,
                                pageY: f[0].start.pageY
                            },

                            current2: {
                                clientX: f[1].current.clientX,
                                clientY: f[1].current.clientY,
                                pageX: f[1].current.pageX,
                                pageY: f[1].current.pageY
                            },

                            start2: {
                                clientX: f[1].start.clientX,
                                clientY: f[1].start.clientY,
                                pageX: f[1].start.pageX,
                                pageY: f[1].start.pageY
                            }
                        };

                        evt.toString = function () {
                            return "Zoom: " + this.zoomFactor + " - Total zoom: " + this.totalZoomFactor;
                        };

                        //Track the total zoom also on the finger object, so on end zoom we can signal the total zoom factor applied
                        f[0].zoomTracker.totalZoomFactor = evt.totalZoomFactor;
                        f[0].zoomTracker.target1 = evt.target1;
                        f[0].zoomTracker.target2 = evt.target2;
                        f[0].zoomTracker.start1 = evt.start1;
                        f[0].zoomTracker.start2 = evt.start2;
                        f[0].zoomTracker.current1 = evt.current1;
                        f[0].zoomTracker.current2 = evt.current2;

                        callOnGesture(evt);
                    }
                }
            }

            function trackFingers() {
                var identifiers = {};
                for (var i = 0; i < te.touches.length; i++) {
                    var touch = te.touches[i];
                    var finger = fingers[touch.identifier];
                    identifiers[touch.identifier] = true;

                    //If it's a new touch, let's create the finger
                    if (!finger) {
                        finger = {
                            start: {
                                target: touch.target,
                                time: now,
                                clientX: touch.clientX,
                                clientY: touch.clientY,
                                pageX: touch.pageX,
                                pageY: touch.pageY
                            },
                            current: {
                                target: touch.target,
                                time: now,
                                clientX: touch.clientX,
                                clientY: touch.clientY,
                                pageX: touch.pageX,
                                pageY: touch.pageY
                            }
                        };

                        fingers[touch.identifier] = finger;
                    }

                    //Save previous values
                    finger.previous = finger.current;

                    //Let's now set the current values
                    finger.current = {
                        target: touch.target,
                        time: now,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        pageX: touch.pageX,
                        pageY: touch.pageY
                    };
                }

                //Remove fingers that are no longer active
                for (var identifier in fingers) {
                    if (!identifiers[identifier]) {
                        //This finger is no longer on screen
                        var finger = fingers[identifier];
                        delete fingers[identifier];

                        if (finger.rotating) {
                            //End of rotate
                            var evt = {
                                target1: finger.rotateTracker.target1,
                                target2: finger.rotateTracker.target2,
                                isRotate: false,
                                isEndRotate: true,
                                totalAngle: finger.rotateTracker.totalAngle,

                                start1: finger.rotateTracker.start1,
                                start2: finger.rotateTracker.start2,
                                current1: finger.rotateTracker.current1,
                                current2: finger.rotateTracker.current2
                            };

                            evt.toString = function () {
                                return "End of rotation: total angle " + this.totalAngle;
                            };

                            callOnGesture(evt);
                        }

                        if (finger.zooming) {
                            //End of zoom
                            var evt = {
                                target1: finger.zoomTracker.target1,
                                target2: finger.zoomTracker.target2,
                                isZoom: false,
                                isEndZoom: true,
                                totalZoomFactor: finger.zoomTracker.totalZoomFactor,

                                start1: finger.zoomTracker.start1,
                                start2: finger.zoomTracker.start2,
                                current1: finger.zoomTracker.current1,
                                current2: finger.zoomTracker.current2
                            };

                            evt.toString = function () {
                                return "End of zoom: total factor " + this.totalZoomFactor;
                            };

                            callOnGesture(evt);
                        }

                        if (finger.dragging) {
                            //End of drag
                            var evt = {
                                target: finger.start.target,
                                isDrag: false,
                                isEndDrag: true,
                                totalDragX: finger.current.clientX - finger.start.clientX,
                                totalDragY: finger.current.clientY - finger.start.clientY,

                                current: {
                                    clientX: finger.current.clientX,
                                    clientY: finger.current.clientY,
                                    pageX: finger.current.pageX,
                                    pageY: finger.current.pageY
                                },

                                start: {
                                    clientX: finger.start.clientX,
                                    clientY: finger.start.clientY,
                                    pageX: finger.start.pageX,
                                    pageY: finger.start.pageY
                                }
                            };

                            evt.toString = function () {
                                return "End of drag";
                            };

                            callOnGesture(evt);
                        }

                        if (!finger.rotating && !finger.zooming && !finger.dragging) {
                            //Let's see if it was a tap (short/long)
                            if (te.touches.length == 0) {
                                var dx = finger.current.clientX - finger.start.clientX;
                                var dy = finger.current.clientY - finger.start.clientY;
                                var distance = Math.sqrt(dx * dx + dy * dy);
                                if (distance < params.tapMaxDistance) {
                                    //It's a tap because the finger didn't move away too much
                                    //Let's see if it was a short tap or a long tap
                                    var dt = now - finger.start.time;
                                    var evt = {
                                        target: finger.start.target,
                                        isTap: true,
                                        isLongTap: dt >= params.longTapThreshold,

                                        clientX: finger.start.clientX,
                                        clientY: finger.start.clientY,
                                        pageX: finger.start.pageX,
                                        pageY: finger.start.pageY
                                    };

                                    //Let's see if it's a double-tap
                                    if (!evt.isLongTap) {
                                        //Short tap
                                        if (lastShortTap) {
                                            dt = finger.start.time - lastShortTap.time;
                                            if (dt < params.doubleTapThreshold) {
                                                //It's close in time. For this short tap to be a double tap, it must also be close in space.
                                                dx = finger.start.clientX - lastShortTap.clientX;
                                                dy = finger.start.clientY - lastShortTap.clientY;
                                                var distance = Math.sqrt(dx * dx + dy * dy);
                                                if (distance < params.tapMaxDistance) {
                                                    //OK, this is a double tap
                                                    evt.isDoubleTap = true;
                                                    lastShortTap = null;
                                                }
                                            }
                                        }

                                        //If it is not a double tap, it is a simple short tap
                                        if (!evt.isDoubleTap) {
                                            //In this case, we keep track of it
                                            lastShortTap = {
                                                time: now,
                                                clientX: finger.start.clientX,
                                                clientY: finger.start.clientY
                                            };
                                        }
                                    }
                                    else {
                                        //Long tap, so let's forget the lastShortTap
                                        lastShortTap = null;
                                    }

                                    evt.toString = function () {
                                        return "Tap: " + (this.isLongTap ? "long" : "short") + " - " + (this.isDoubleTap ? "double" : "simple");
                                    };

                                    callOnGesture(evt);
                                }
                            }
                        }
                    }
                }
            }
        }
    };

})();
;


(function () {
    //We use "HTML Clean for jQuery" plugin but we don't want it to strip empty <p></p> paragraphs, so
    //we use a different definition of tagAllowEmpty
    var jpvsTagAllowEmpty = ["p", "th", "td"];

    /*
    HTML Clean for jQuery   
    Anthony Johnston
    http://www.antix.co.uk    
    
    version 1.3.0

    $Revision: 67 $

    requires jQuery http://jquery.com   

    Use and distibution http://www.opensource.org/licenses/bsd-license.php

    2010-04-02 allowedTags/removeTags added (white/black list) thanks to David Wartian (Dwartian)
    2010-06-30 replaceStyles added for replacement of bold, italic, super and sub styles on a tag
    2012-04-30 allowedAttributes added, an array of attributed allowed on the elements
    */
    (function ($) {
        $.fn.htmlClean = function (options) {
            // iterate and html clean each matched element
            return this.each(function () {
                var $this = $(this);
                if (this.value) {
                    this.value = $.htmlClean(this.value, options);
                } else {
                    this.innerHTML = $.htmlClean(this.innerHTML, options);
                }
            });
        };

        // clean the passed html
        $.htmlClean = function (html, options) {
            options = $.extend({}, $.htmlClean.defaults, options);

            var tagsRE = /<(\/)?(\w+:)?([\w]+)([^>]*)>/gi;
            var attrsRE = /(\w+)=(".*?"|'.*?'|[^\s>]*)/gi;

            var tagMatch;
            var root = new Element();
            var stack = [root];
            var container = root;
            var protect = false;

            if (options.bodyOnly) {
                // check for body tag
                if (tagMatch = /<body[^>]*>((\n|.)*)<\/body>/i.exec(html)) {
                    html = tagMatch[1];
                }
            }
            html = html.concat("<xxx>"); // ensure last element/text is found
            var lastIndex;

            while (tagMatch = tagsRE.exec(html)) {
                var tag = new Tag(tagMatch[3], tagMatch[1], tagMatch[4], options);

                // add the text
                var text = html.substring(lastIndex, tagMatch.index);
                if (text.length > 0) {
                    var child = container.children[container.children.length - 1];
                    if (container.children.length > 0
                        && isText(child = container.children[container.children.length - 1])) {
                        // merge text
                        container.children[container.children.length - 1] = child.concat(text);
                    } else {
                        container.children.push(text);
                    }
                }
                lastIndex = tagsRE.lastIndex;

                if (tag.isClosing) {
                    // find matching container
                    if (pop(stack, [tag.name])) {
                        stack.pop();
                        container = stack[stack.length - 1];
                    }
                } else {
                    // create a new element
                    var element = new Element(tag);

                    // add attributes
                    var attrMatch;
                    while (attrMatch = attrsRE.exec(tag.rawAttributes)) {

                        // check style attribute and do replacements
                        if (attrMatch[1].toLowerCase() == "style"
                        && options.replaceStyles) {

                            var renderParent = !tag.isInline;
                            for (var i = 0; i < options.replaceStyles.length; i++) {
                                if (options.replaceStyles[i][0].test(attrMatch[2])) {

                                    if (!renderParent) {
                                        tag.render = false;
                                        renderParent = true;
                                    }
                                    container.children.push(element); // assumes not replaced
                                    stack.push(element);
                                    container = element; // assumes replacement is a container
                                    // create new tag and element
                                    tag = new Tag(options.replaceStyles[i][1], "", "", options);
                                    element = new Element(tag);
                                }
                            }
                        }

                        if (tag.allowedAttributes != null
                            && (tag.allowedAttributes.length == 0
                            || $.inArray(attrMatch[1], tag.allowedAttributes) > -1)) {
                            element.attributes.push(new Attribute(attrMatch[1], attrMatch[2]));
                        }
                    }
                    // add required empty ones
                    $.each(tag.requiredAttributes, function () {
                        var name = this.toString();
                        if (!element.hasAttribute(name)) element.attributes.push(new Attribute(name, ""));
                    });

                    // check for replacements
                    for (var repIndex = 0; repIndex < options.replace.length; repIndex++) {
                        for (var tagIndex = 0; tagIndex < options.replace[repIndex][0].length; tagIndex++) {
                            var byName = typeof (options.replace[repIndex][0][tagIndex]) == "string";
                            if ((byName && options.replace[repIndex][0][tagIndex] == tag.name)
                                || (!byName && options.replace[repIndex][0][tagIndex].test(tagMatch))) {
                                // don't render this tag
                                tag.render = false;
                                container.children.push(element);
                                stack.push(element);
                                container = element;

                                // render new tag, keep attributes
                                tag = new Tag(options.replace[repIndex][1], tagMatch[1], tagMatch[4], options);
                                element = new Element(tag);
                                element.attributes = container.attributes;

                                repIndex = options.replace.length; // break out of both loops
                                break;
                            }
                        }
                    }

                    // check container rules
                    var add = true;
                    if (!container.isRoot) {
                        if (container.tag.isInline && !tag.isInline) {
                            add = false;
                        } else if (container.tag.disallowNest && tag.disallowNest
                                && !tag.requiredParent) {
                            add = false;
                        } else if (tag.requiredParent) {
                            if (add = pop(stack, tag.requiredParent)) {
                                container = stack[stack.length - 1];
                            }
                        }
                    }

                    if (add) {
                        container.children.push(element);

                        if (tag.toProtect) {
                            // skip to closing tag
                            while (tagMatch2 = tagsRE.exec(html)) {
                                var tag2 = new Tag(tagMatch2[3], tagMatch2[1], tagMatch2[4], options);
                                if (tag2.isClosing && tag2.name == tag.name) {
                                    element.children.push(RegExp.leftContext.substring(lastIndex));
                                    lastIndex = tagsRE.lastIndex;
                                    break;
                                }
                            }
                        } else {
                            // set as current container element
                            if (!tag.isSelfClosing && !tag.isNonClosing) {
                                stack.push(element);
                                container = element;
                            }
                        }
                    }
                }
            }

            // render doc
            return $.htmlClean.trim(render(root, options).join(""));
        };

        // defaults
        $.htmlClean.defaults = {
            // only clean the body tagbody
            bodyOnly: true,
            // only allow tags in this array, (white list), contents still rendered
            allowedTags: [],
            // remove tags in this array, (black list), contents still rendered
            removeTags: ["basefont", "center", "dir", "font", "frame", "frameset", "iframe", "isindex", "menu", "noframes", "s", "strike", "u"],
            // array of [attributeName], [optional array of allowed on elements] e.g. [["id"], ["style", ["p", "dl"]]] // allow all elements to have id and allow style on 'p' and 'dl'
            allowedAttributes: [],
            // array of attribute names to remove on all elements in addition to those not in tagAttributes e.g ["width", "height"]
            removeAttrs: [],
            // array of [className], [optional array of allowed on elements] e.g. [["aClass"], ["anotherClass", ["p", "dl"]]]
            allowedClasses: [],
            // format the result
            format: false,
            // format indent to start on
            formatIndent: 0,
            // tags to replace, and what to replace with, tag name or regex to match the tag and attributes 
            replace: [
            [["b", "big"], "strong"],
            [["i"], "em"]
        ],
            // styles to replace with tags, multiple style matches supported, inline tags are replaced by the first match blocks are retained
            replaceStyles: [
            [/font-weight:\s*bold/i, "strong"],
            [/font-style:\s*italic/i, "em"],
            [/vertical-align:\s*super/i, "sup"],
            [/vertical-align:\s*sub/i, "sub"]
        ]
        };

        function applyFormat(element, options, output, indent) {
            if (!element.tag.isInline && output.length > 0) {
                output.push("\n");
                for (i = 0; i < indent; i++) output.push("\t");
            }
        }

        function render(element, options) {
            var output = [], empty = element.attributes.length == 0, indent;
            var openingTag = this.name.concat(element.tag.rawAttributes == undefined ? "" : element.tag.rawAttributes);

            // don't render if not in allowedTags or in removeTags
            var renderTag
            = element.tag.render
                && (options.allowedTags.length == 0 || $.inArray(element.tag.name, options.allowedTags) > -1)
                && (options.removeTags.length == 0 || $.inArray(element.tag.name, options.removeTags) == -1);

            if (!element.isRoot && renderTag) {
                // render opening tag
                output.push("<");
                output.push(element.tag.name);
                $.each(element.attributes, function () {
                    if ($.inArray(this.name, options.removeAttrs) == -1) {
                        var m = RegExp(/^(['"]?)(.*?)['"]?$/).exec(this.value);
                        var value = m[2];
                        var valueQuote = m[1] || "\"";

                        // check for classes allowed
                        if (this.name == "class") {
                            value =
                            $.grep(value.split(" "), function (c) {
                                return $.grep(options.allowedClasses, function (a) {
                                    return a[0] == c && (a.length == 1 || $.inArray(element.tag.name, a[1]) > -1);
                                }).length > 0;
                            })
                            .join(" ");
                            valueQuote = "\"";
                        }

                        if (value != null && (value.length > 0 || $.inArray(this.name, element.tag.requiredAttributes) > -1)) {
                            output.push(" ");
                            output.push(this.name);
                            output.push("=");
                            output.push(valueQuote);
                            output.push(value);
                            output.push(valueQuote);
                        }
                    }
                });
            }

            if (element.tag.isSelfClosing) {
                // self closing 
                if (renderTag) output.push(" />");
                empty = false;
            } else if (element.tag.isNonClosing) {
                empty = false;
            } else {
                if (!element.isRoot && renderTag) {
                    // close
                    output.push(">");
                }

                var indent = options.formatIndent++;

                // render children
                if (element.tag.toProtect) {
                    var outputChildren = $.htmlClean.trim(element.children.join("")).replace(/<br>/ig, "\n");
                    output.push(outputChildren);
                    empty = outputChildren.length == 0;
                } else {
                    var outputChildren = [];
                    for (var i = 0; i < element.children.length; i++) {
                        var child = element.children[i];
                        var text = $.htmlClean.trim(textClean(isText(child) ? child : child.childrenToString()));
                        if (isInline(child)) {
                            if (i > 0 && text.length > 0
                        && (startsWithWhitespace(child) || endsWithWhitespace(element.children[i - 1]))) {
                                outputChildren.push(" ");
                            }
                        }
                        if (isText(child)) {
                            if (text.length > 0) {
                                outputChildren.push(text);
                            }
                        } else {
                            // don't allow a break to be the last child
                            if (i != element.children.length - 1 || child.tag.name != "br") {
                                if (options.format) applyFormat(child, options, outputChildren, indent);
                                outputChildren = outputChildren.concat(render(child, options));
                            }
                        }
                    }
                    options.formatIndent--;

                    if (outputChildren.length > 0) {
                        if (options.format && outputChildren[0] != "\n") applyFormat(element, options, output, indent);
                        output = output.concat(outputChildren);
                        empty = false;
                    }
                }

                if (!element.isRoot && renderTag) {
                    // render the closing tag
                    if (options.format) applyFormat(element, options, output, indent - 1);
                    output.push("</");
                    output.push(element.tag.name);
                    output.push(">");
                }
            }

            // check for empty tags
            if (!element.tag.allowEmpty && empty) { return []; }

            return output;
        }

        // find a matching tag, and pop to it, if not do nothing
        function pop(stack, tagNameArray, index) {
            index = index || 1;
            if ($.inArray(stack[stack.length - index].tag.name, tagNameArray) > -1) {
                return true;
            } else if (stack.length - (index + 1) > 0
                && pop(stack, tagNameArray, index + 1)) {
                stack.pop();
                return true;
            }
            return false;
        }

        // Element Object
        function Element(tag) {
            if (tag) {
                this.tag = tag;
                this.isRoot = false;
            } else {
                this.tag = new Tag("root");
                this.isRoot = true;
            }
            this.attributes = [];
            this.children = [];

            this.hasAttribute = function (name) {
                for (var i = 0; i < this.attributes.length; i++) {
                    if (this.attributes[i].name == name) return true;
                }
                return false;
            };

            this.childrenToString = function () {
                return this.children.join("");
            };

            return this;
        }

        // Attribute Object
        function Attribute(name, value) {
            this.name = name;
            this.value = value;

            return this;
        }

        // Tag object
        function Tag(name, close, rawAttributes, options) {
            this.name = name.toLowerCase();

            this.isSelfClosing = $.inArray(this.name, tagSelfClosing) > -1;
            this.isNonClosing = $.inArray(this.name, tagNonClosing) > -1;
            this.isClosing = (close != undefined && close.length > 0);

            this.isInline = $.inArray(this.name, tagInline) > -1;
            this.disallowNest = $.inArray(this.name, tagDisallowNest) > -1;
            this.requiredParent = tagRequiredParent[$.inArray(this.name, tagRequiredParent) + 1];
            this.allowEmpty = $.inArray(this.name, tagAllowEmpty) > -1;

            this.toProtect = $.inArray(this.name, tagProtect) > -1;

            this.rawAttributes = rawAttributes;
            this.requiredAttributes = tagAttributesRequired[$.inArray(this.name, tagAttributesRequired) + 1];

            if (options) {
                if (!options.tagAttributesCache) options.tagAttributesCache = [];
                if ($.inArray(this.name, options.tagAttributesCache) == -1) {
                    var cacheItem = tagAttributes[$.inArray(this.name, tagAttributes) + 1].slice(0);

                    // add extra ones from options
                    for (var i = 0; i < options.allowedAttributes.length; i++) {
                        var attrName = options.allowedAttributes[i][0];
                        if ((
                            options.allowedAttributes[i].length == 1
                            || $.inArray(this.name, options.allowedAttributes[i][1]) > -1
                            ) && $.inArray(attrName, cacheItem) == -1) {
                            cacheItem.push(attrName);
                        }
                    }

                    options.tagAttributesCache.push(this.name);
                    options.tagAttributesCache.push(cacheItem);
                }

                this.allowedAttributes = options.tagAttributesCache[$.inArray(this.name, options.tagAttributesCache) + 1];
            }

            this.render = true;

            return this;
        }

        function startsWithWhitespace(item) {
            while (isElement(item) && item.children.length > 0) { item = item.children[0] }
            return isText(item) && item.length > 0 && $.htmlClean.isWhitespace(item.charAt(0));
        }
        function endsWithWhitespace(item) {
            while (isElement(item) && item.children.length > 0) { item = item.children[item.children.length - 1] }
            return isText(item) && item.length > 0 && $.htmlClean.isWhitespace(item.charAt(item.length - 1));
        }
        function isText(item) { return item.constructor == String; }
        function isInline(item) { return isText(item) || item.tag.isInline; }
        function isElement(item) { return item.constructor == Element; }
        function textClean(text) {
            return text
            .replace(/&nbsp;|\n/g, " ")
            .replace(/\s\s+/g, " ");
        }

        // trim off white space, doesn't use regex
        $.htmlClean.trim = function (text) {
            return $.htmlClean.trimStart($.htmlClean.trimEnd(text));
        };
        $.htmlClean.trimStart = function (text) {
            return text.substring($.htmlClean.trimStartIndex(text));
        };
        $.htmlClean.trimStartIndex = function (text) {
            for (var start = 0; start < text.length - 1 && $.htmlClean.isWhitespace(text.charAt(start)); start++);
            return start;
        };
        $.htmlClean.trimEnd = function (text) {
            return text.substring(0, $.htmlClean.trimEndIndex(text));
        };
        $.htmlClean.trimEndIndex = function (text) {
            for (var end = text.length - 1; end >= 0 && $.htmlClean.isWhitespace(text.charAt(end)); end--);
            return end + 1;
        };
        // checks a char is white space or not
        $.htmlClean.isWhitespace = function (c) { return $.inArray(c, whitespace) != -1; };

        // tags which are inline
        var tagInline = [
        "a", "abbr", "acronym", "address", "b", "big", "br", "button",
        "caption", "cite", "code", "del", "em", "font",
        "hr", "i", "input", "img", "ins", "label", "legend", "map", "q",
        "s", "samp", "select", "small", "span", "strike", "strong", "sub", "sup",
        "tt", "u", "var"];
        var tagDisallowNest = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "th", "td"];

        //The tags that are allowed to be empty can be changed by JPVS
        var tagAllowEmpty = jpvsTagAllowEmpty || ["th", "td"];

        var tagRequiredParent = [
        null,
        "li", ["ul", "ol"],
        "dt", ["dl"],
        "dd", ["dl"],
        "td", ["tr"],
        "th", ["tr"],
        "tr", ["table", "thead", "tbody", "tfoot"],
        "thead", ["table"],
        "tbody", ["table"],
        "tfoot", ["table"]
        ];
        var tagProtect = ["script", "style", "pre", "code"];
        // tags which self close e.g. <br />
        var tagSelfClosing = ["br", "hr", "img", "link", "meta"];
        // tags which do not close
        var tagNonClosing = ["!doctype", "?xml"];
        // attributes allowed on tags
        var tagAttributes = [
            ["class"],  // default, for all tags not mentioned
            "?xml", [],
            "!doctype", [],
            "a", ["accesskey", "class", "href", "name", "title", "rel", "rev", "type", "tabindex"],
            "abbr", ["class", "title"],
            "acronym", ["class", "title"],
            "blockquote", ["cite", "class"],
            "button", ["class", "disabled", "name", "type", "value"],
            "del", ["cite", "class", "datetime"],
            "font", ["face", "size", "color"],
            "form", ["accept", "action", "class", "enctype", "method", "name"],
            "input", ["accept", "accesskey", "alt", "checked", "class", "disabled", "ismap", "maxlength", "name", "size", "readonly", "src", "tabindex", "type", "usemap", "value"],
            "img", ["alt", "class", "height", "src", "width"],
            "ins", ["cite", "class", "datetime"],
            "label", ["accesskey", "class", "for"],
            "legend", ["accesskey", "class"],
            "link", ["href", "rel", "type"],
            "meta", ["content", "http-equiv", "name", "scheme", "charset"],
            "map", ["name"],
            "optgroup", ["class", "disabled", "label"],
            "option", ["class", "disabled", "label", "selected", "value"],
            "q", ["class", "cite"],
            "script", ["src", "type"],
            "select", ["class", "disabled", "multiple", "name", "size", "tabindex"],
            "style", ["type"],
            "table", ["class", "summary"],
            "th", ["class", "colspan", "rowspan"],
            "td", ["class", "colspan", "rowspan"],
            "textarea", ["accesskey", "class", "cols", "disabled", "name", "readonly", "rows", "tabindex"]
        ];
        var tagAttributesRequired = [[], "img", ["alt"]];
        // white space chars
        var whitespace = [" ", " ", "\t", "\n", "\r", "\f"];

    })(jQuery);


    /*
    Wrapper for the jquery-clean plugin above
    */
    jpvs.cleanHtml = function (html, options) {
        //Default options are for cleaning HTML code typically written in javascript HTML editor controls
        var defaultOptions = {
            bodyOnly: false,
            allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6", "br", "hr", "div", "span", "img", "p", "font", "ul", "ol", "li", "i", "em", "b", "strong", "u", "sup", "sub", "table", "thead", "tbody", "tfoot", "tr", "td", "th"],
            removeTags: [null],
            // array of [attributeName], [optional array of allowed on elements] e.g. [["id"], ["style", ["p", "dl"]]] // allow all elements to have id and allow style on 'p' and 'dl'
            allowedAttributes: [["style"], ["align"], ["src", ["img"]]],
            // array of attribute names to remove on all elements in addition to those not in tagAttributes e.g ["width", "height"]
            removeAttrs: [],
            // array of [className], [optional array of allowed on elements] e.g. [["aClass"], ["anotherClass", ["p", "dl"]]]
            allowedClasses: [],
            // format the result
            format: false,
            // format indent to start on
            formatIndent: 0,
            // tags to replace, and what to replace with, tag name or regex to match the tag and attributes 
            replace: [
                [["b", "big"], "strong"],
                [["i"], "em"]
            ],
            // styles to replace with tags, multiple style matches supported, inline tags are replaced by the first match blocks are retained
            replaceStyles: [
                [/font-weight:\s*bold/i, "strong"],
                [/font-style:\s*italic/i, "em"],
                [/vertical-align:\s*super/i, "sup"],
                [/vertical-align:\s*sub/i, "sub"]
            ]
        };

        //Now clean
        return jQuery.htmlClean(html || "", options || defaultOptions);
    };

    jpvs.stripHtml = function (html) {
        //Options that allow no tags
        var options = {
            bodyOnly: false,
            allowedTags: [null],
            removeTags: [],
            // array of [attributeName], [optional array of allowed on elements] e.g. [["id"], ["style", ["p", "dl"]]] // allow all elements to have id and allow style on 'p' and 'dl'
            allowedAttributes: [],
            // array of attribute names to remove on all elements in addition to those not in tagAttributes e.g ["width", "height"]
            removeAttrs: [],
            // array of [className], [optional array of allowed on elements] e.g. [["aClass"], ["anotherClass", ["p", "dl"]]]
            allowedClasses: [],
            // format the result
            format: false,
            // format indent to start on
            formatIndent: 0,
            // tags to replace, and what to replace with, tag name or regex to match the tag and attributes 
            replace: [],
            // styles to replace with tags, multiple style matches supported, inline tags are replaced by the first match blocks are retained
            replaceStyles: []
        };

        //Now clean
        return jQuery.htmlClean(html || "", options);
    };

})();
;


/*
****************************************
SVG-to-JSON parser
****************************************



EXAMPLE

Given this SVG image:

<svg xmlns="http://www.w3.org/2000/svg">
<circle cx="100" cy="50" r="40" style="stroke:brown;stroke-width:5;fill:#00FF00" />
</svg> 

The following call:

var svg = SvgParser.parseString("<svg xmlns=\"http://www.w3.org/2000/svg\">\n\t<circle cx=\"100\" cy=\"50\" r=\"40\" style=\"stroke:brown;stroke-width:5;fill:green\" />\n</svg>");

yields the following JSON object:

svg = {
ids:{},
elements: [
{
name: "circle",
children: [],
cx: 100,
cy: 50,
r: 40,
stroke: { color: { r: 165, g: 42, b: 42, a: 1 } },
stroke-width: 5,
fill: { color: { r: 0, g: 128, b: 0, a: 1 } }
}
]
};

*/
var SvgParser = (function () {

    var BLACK = { r: 0, g: 0, b: 0, a: 1 };

    var ColorData = {
        aliceblue: '#F0F8FF',
        antiquewhite: '#FAEBD7',
        aquamarine: '#7FFFD4',
        azure: '#F0FFFF',
        beige: '#F5F5DC',
        bisque: '#FFE4C4',
        black: '#000000',
        blanchedalmond: '#FFEBCD',
        blue: '#0000FF',
        blueviolet: '#8A2BE2',
        brown: '#A52A2A',
        burlywood: '#DEB887',
        cadetblue: '#5F9EA0',
        chartreuse: '#7FFF00',
        chocolate: '#D2691E',
        coral: '#FF7F50',
        cornflowerblue: '#6495ED',
        cornsilk: '#FFF8DC',
        crimson: '#DC143C',
        cyan: '#00FFFF',
        darkblue: '#00008B',
        darkcyan: '#008B8B',
        darkgoldenrod: '#B8860B',
        darkgray: '#A9A9A9',
        darkgreen: '#006400',
        darkgrey: '#A9A9A9',
        darkkhaki: '#BDB76B',
        darkmagenta: '#8B008B',
        darkolivegreen: '#556B2F',
        darkorange: '#FF8C00',
        darkorchid: '#9932CC',
        darkred: '#8B0000',
        darksalmon: '#E9967A',
        darkseagreen: '#8FBC8F',
        darkslateblue: '#483D8B',
        darkslategray: '#2F4F4F',
        darkslategrey: '#2F4F4F',
        darkturquoise: '#00CED1',
        darkviolet: '#9400D3',
        deeppink: '#FF1493',
        deepskyblue: '#00BFFF',
        dimgray: '#696969',
        dimgrey: '#696969',
        dodgerblue: '#1E90FF',
        firebrick: '#B22222',
        floralwhite: '#FFFAF0',
        forestgreen: '#228B22',
        gainsboro: '#DCDCDC',
        ghostwhite: '#F8F8FF',
        gold: '#FFD700',
        goldenrod: '#DAA520',
        green: '#008000',
        grey: '#808080',
        greenyellow: '#ADFF2F',
        honeydew: '#F0FFF0',
        hotpink: '#FF69B4',
        indianred: '#CD5C5C',
        indigo: '#4B0082',
        ivory: '#FFFFF0',
        khaki: '#F0E68C',
        lavender: '#E6E6FA',
        lavenderblush: '#FFF0F5',
        lawngreen: '#7CFC00',
        lemonchiffon: '#FFFACD',
        lightblue: '#ADD8E6',
        lightcoral: '#F08080',
        lightcyan: '#E0FFFF',
        lightgoldenrodyellow: '#FAFAD2',
        lightgreen: '#90EE90',
        lightgrey: '#D3D3D3',
        lightpink: '#FFB6C1',
        lightsalmon: '#FFA07A',
        lightseagreen: '#20B2AA',
        lightskyblue: '#87CEFA',
        lightslategray: '#778899',
        lightslategrey: '#778899',
        lightsteelblue: '#B0C4DE',
        lightyellow: '#FFFFE0',
        limegreen: '#32CD32',
        linen: '#FAF0E6',
        magenta: '#FF00FF',
        mediumaquamarine: '#66CDAA',
        mediumblue: '#0000CD',
        mediumorchid: '#BA55D3',
        mediumpurple: '#9370DB',
        mediumseagreen: '#3CB371',
        mediumslateblue: '#7B68EE',
        mediumspringgreen: '#00FA9A',
        mediumturquoise: '#48D1CC',
        mediumvioletred: '#C71585',
        midnightblue: '#191970',
        mintcream: '#F5FFFA',
        mistyrose: '#FFE4E1',
        moccasin: '#FFE4B5',
        navajowhite: '#FFDEAD',
        oldlace: '#FDF5E6',
        olivedrab: '#6B8E23',
        orange: '#FFA500',
        orangered: '#FF4500',
        orchid: '#DA70D6',
        palegoldenrod: '#EEE8AA',
        palegreen: '#98FB98',
        paleturquoise: '#AFEEEE',
        palevioletred: '#DB7093',
        papayawhip: '#FFEFD5',
        peachpuff: '#FFDAB9',
        peru: '#CD853F',
        pink: '#FFC0CB',
        plum: '#DDA0DD',
        powderblue: '#B0E0E6',
        red: '#FF0000',
        rosybrown: '#BC8F8F',
        royalblue: '#4169E1',
        saddlebrown: '#8B4513',
        salmon: '#FA8072',
        sandybrown: '#F4A460',
        seagreen: '#2E8B57',
        seashell: '#FFF5EE',
        sienna: '#A0522D',
        skyblue: '#87CEEB',
        slateblue: '#6A5ACD',
        slategray: '#708090',
        slategrey: '#708090',
        snow: '#FFFAFA',
        springgreen: '#00FF7F',
        steelblue: '#4682B4',
        tan: '#D2B48C',
        thistle: '#D8BFD8',
        tomato: '#FF6347',
        turquoise: '#40E0D0',
        violet: '#EE82EE',
        wheat: '#F5DEB3',
        whitesmoke: '#F5F5F5',
        yellow: '#FFFF00',
        yellowgreen: '#9ACD32'
    };



    function parseString(s) {
        //Parse as XML
        var doc = XmlParser.parseString(s, transform);
        if (doc)
            return {
                ids: doc.__$ids$__,
                elements: doc.children
            };
        else
            return null;
    }

    function transform(node, rootNode) {
        //Fill the "ids" field in rootNode along the way
        if (!rootNode.__$ids$__)
            rootNode.__$ids$__ = {};

        if (node.attributes.id)
            rootNode.__$ids$__[node.attributes.id] = node;

        //Strip comments from children
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.name == "#COMMENT") {
                //Remove
                node.children.splice(i--, 1);
            }
        }

        //Remove value
        delete node.value;

        //Pull attributes out and remove the attributes object
        for (var i in node.attributes) {
            var attr = node.attributes[i];
            processAttribute(node, i, attr);
        }

        delete node.attributes;

        function processAttribute(destination, name, value) {
            if (name == "style")
                processStyle(destination, value);
            else if (name == "fill")
                processFill(destination, value);
            else if (name == "stroke")
                processStroke(destination, value);
            else if (name == "d")
                processPathDefinition(destination, value);
            else {
                //Transfer to destination
                var endsWithPercent = /%$/g.test(value);
                var valueAsNumber = parseFloat(value);
                var valueIsNumber = isFinite(valueAsNumber) && !endsWithPercent;
                destination[name] = valueIsNumber ? valueAsNumber : value;
            }
        }

        function processPathDefinition(destination, value) {
            var pd = parsePathDefinition(value);
            destination.d = pd;
        }

        function processFill(destination, value) {
            //Special case: none
            if (!value) {
                destination.fill = {};
                return;
            }

            value = trim(value);
            if (value == "" || value.toLowerCase() == "none") {
                destination.fill = {};
                return;
            }

            //Value is a color or gradient
            var urlRegEx = /^url *\( *#(.+) *\) *$/gi;
            var result = urlRegEx.exec(value);

            if (result) {
                //Reference to a gradient
                var gradientId = result[1];

                //Let us assume that the "gradientId" has already been encountered in the 
                //document (i.e., the "defs" element is before all shapes in the SVG document)
                var grad = rootNode.__$ids$__[gradientId];
                if (grad.name == "linearGradient") {
                    //Linear gradient
                    var x1 = parseNumberOrPercentage(grad.x1);
                    var x2 = parseNumberOrPercentage(grad.x2);
                    var y1 = parseNumberOrPercentage(grad.y1);
                    var y2 = parseNumberOrPercentage(grad.y2);

                    destination.fill = {
                        linearGradient: {
                            x1: x1,
                            y1: y1,
                            x2: x2,
                            y2: y2,
                            stops: []
                        }
                    };

                    //Parse stops
                    for (var i in grad.children) {
                        var stop = grad.children[i];
                        if (stop.name != "stop")
                            continue;

                        var offset = stop.offset;
                        var color = parseColor(stop["stop-color"]);
                        var opacity = stop["stop-opacity"];

                        if (opacity != null)
                            color.a *= opacity;

                        destination.fill.linearGradient.stops.push({
                            color: color,
                            offset: offset
                        });
                    }
                }
                else {
                    //Not supported yet
                }
            }
            else {
                //Solid color
                destination.fill = { color: parseColor(value) };
            }
        }

        function parseNumberOrPercentage(x) {
            if (/%$/g.test(x)) {
                //Ends with %
                return parseFloat(x.substring(0, x.length - 1)) / 100;
            }
            else
                return parseFloat(x);
        }

        function processStroke(destination, value) {
            //Special case: none
            if (!value) {
                destination.stroke = {};
                return;
            }

            value = trim(value);
            if (value == "" || value.toLowerCase() == "none") {
                destination.stroke = {};
                return;
            }

            //Value is a color
            destination.stroke = { color: parseColor(value) };
        }

        function processStyle(destination, value) {
            value = trim(value);
            var parts = value.split(";");

            for (var i in parts) {
                var part = parts[i];

                //Split part (name: value)
                var subparts = part.split(":");
                var stylePartName = trim(subparts[0]);
                var stylePartValue = trim(subparts[1]);

                //Apply as a normal attribute specified outside of "style"
                processAttribute(destination, stylePartName, stylePartValue);
            }
        }
    }

    function trim(str) {
        return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    function parseColor(color) {
        //No color ---> return default color (black)
        if (!color)
            return BLACK;

        color = trim(color);

        if (color == "")
            return BLACK;

        if ((/^#/gi).test(color))
            return parseHexColor(color.substring(1));
        else if ((/^RGB[^A]/gi).test(color))
            return parseRGBColor(color.substring(3));
        else if ((/^RGBA/gi).test(color))
            return parseRGBAColor(color.substring(4));
        else {
            //Try as a color name
            color = color.toLowerCase();
            color = ColorData[color];
            return parseColor(color);
        }

        function parseHexColor(color) {
            color = trim(color);

            if (color.length == 3) {
                //ABC must be interpreted as AABBCC
                color = String.fromCharCode(color.charCodeAt(0), color.charCodeAt(0), color.charCodeAt(1), color.charCodeAt(1), color.charCodeAt(2), color.charCodeAt(2));
            }

            //Now we have six hex digits
            return {
                r: parseInt(color.substring(0, 2), 16),
                g: parseInt(color.substring(2, 4), 16),
                b: parseInt(color.substring(4, 6), 16),
                a: 1
            };
        }

        function parseRGBColor(color) {
            color = trim(color);
            if ((/^\(.*\)$/gi).test(color)) {
                //Starts with ( and ends with )
                color = color.substring(1, color.length - 1);

                //Now we only have numbers
                var parts = trim(color).split(",");
                var r = parseInt(parts[0]);
                var g = parseInt(parts[1]);
                var b = parseInt(parts[2]);
                var a = 1;

                return { r: r, g: g, b: b, a: a };
            }
            else
                return BLACK;
        }

        function parseRGBAColor(color) {
            color = trim(color);
            if ((/^\(.*\)$/gi).test(color)) {
                //Starts with ( and ends with )
                color = color.substring(1, color.length - 1);

                //Now we only have numbers
                var parts = trim(color).split(",");
                var r = parseInt(parts[0]);
                var g = parseInt(parts[1]);
                var b = parseInt(parts[2]);
                var a = parseFloat(parts[3]);

                return { r: r, g: g, b: b, a: a };
            }
            else
                return BLACK;
        }
    }

    var NUMERIC_CHARS = "1234567890.-+";
    var ALPHA_CHARS = "qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM";

    function parsePathDefinition(d) {
        //Empty or no definition --> return null
        if (!d)
            return null;

        d = trim(d);
        if (d == "")
            return null;

        //States
        var START = 0;
        var READ_PARAMS = 1;
        var IN_PARAM = 2;

        //Otherwise, parse
        var commands = [];
        var curCmd, curParam;
        var state = START;

        for (var i = 0; i < d.length; i++) {
            var c = d[i];

            if (state == START) {
                if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else {
                    //Ignore any other char
                }
            }
            else if (state == READ_PARAMS) {
                if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a new command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else if (NUMERIC_CHARS.indexOf(c) >= 0) {
                    //Numeric char: here starts a parameter
                    curParam = c;
                    state = IN_PARAM;
                }
                else {
                    //Ignore any other char
                }
            }
            else if (state == IN_PARAM) {
                if (NUMERIC_CHARS.indexOf(c) >= 0) {
                    //Numeric char: here continues the current parameter
                    curParam += c;
                }
                else if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a new command
                    //First, end processing the current param
                    curCmd.params.push(parseFloat(curParam));
                    curParam = null;

                    //Then start the new command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else {
                    //Any other char means we are done reading this parameter
                    //First, end processing the current param
                    curCmd.params.push(parseFloat(curParam));
                    curParam = null;

                    //Then go back to waiting for a new param or a new command
                    state = READ_PARAMS;
                }
            }
        }

        //At the end, end processing the current param, if any
        if (curParam)
            curCmd.params.push(parseFloat(curParam));

        return commands;
    }


    return {
        parseString: parseString,
        parseColor: parseColor,
        parsePathDefinition: parsePathDefinition
    };

})();;


/*
****************************************
XML-to-JSON parser
****************************************



EXAMPLE

Given this XML document:

<books>
<book title="The red apple" />

Random text...

<book title="The Javascript Language" />
</books>


The following call:

var doc = XmlParser.parseString("<books>\n\t<book title=\"The red apple\"/>\n\n\tRandom text...\n\n\t<book title=\"The Javascript Language\" />\n</books>");

yields the following JSON object:

doc = {
name: "books",
attributes: {},
value: null,
children: [
{
name: "book",
attributes: { title: "The red apple" },
value: null,
children: []
},
{
name: "#TEXT",
attributes: { },
value: "Random text...",
children: []
},
{
name: "book",
attributes: { title: "The Javascript Language" },
value: null,
children: []
}
]
}

*/
var XmlParser = (function () {

    var OutOfTag = 0,
        TagName = 1,
        WaitForAttributeName = 2,
        AttributeName = 3,
        WaitForAttributeValue = 4,
        AttributeValue = 5,
        WaitForElementEnd = 6,
        Comment = 7;


    function trim(str) {
        return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    function createEmptyNode() {
        return {
            name: "",
            attributes: {},
            children: [],
            value: null
        };
    }

    function createTextNode(text) {
        return {
            name: "#TEXT",
            attributes: {},
            children: [],
            value: text
        };
    }

    function parseString(s, nodeTransform, preserveWhiteSpace) {
        //No string --> return null
        if (!s || s == "")
            return null;

        //String present, let's parse
        var state = OutOfTag;
        var nodeStack = [];
        var curNode, curAttrName, curAttrValue, curText = "", curComment = "";

        for (var i = 0; i < s.length; i++) {
            var c = s[i];

            if (state == OutOfTag) {
                //Tag not yet found, look for "<"
                if (c == "<") {
                    //Tag is starting, prepare for reading the tag name
                    state = TagName;

                    //If we have text accumulated, then emit a text node and append it to the current node
                    if (!preserveWhiteSpace)
                        curText = trim(curText);

                    if (curText.length > 0) {
                        var textNode = createTextNode(curText);
                        curNode.children.push(textNode);
                    }

                    //Reset the accumulated text
                    curText = "";

                    //Create a new node and add it as a child to the current node, if any
                    var oldCurNode = curNode;
                    curNode = createEmptyNode();
                    nodeStack.push(curNode);

                    if (oldCurNode)
                        oldCurNode.children.push(curNode);
                }
                else {
                    //Any other char is plain text
                    curText += c;
                }
            }
            else if (state == TagName) {
                //We are now reading the tag name
                //Stop at the first blank or or "/" or ">"
                if (c == " ") {
                    //End of tag name, look for attributes
                    state = WaitForAttributeName;
                }
                else if (c == "/") {
                    if (curNode.name == "") {
                        //This is a closing tag (</example>) and we have just read the slash, let's keep on reading the name
                        curNode.closing = true;
                    }
                    else {
                        //This is a slash after a tag name
                        //End of tag, no children, let's wait for the closing ">"
                        state = WaitForElementEnd;
                    }
                }
                else if (c == ">") {
                    //End of tag
                    state = OutOfTag;

                    //Let's see what to do with the node stack
                    if (curNode.closing) {
                        //Just finished reading a closing tag
                        //Let's remove this and pop it from the stack
                        if (nodeStack.length > 1) {
                            nodeStack.pop();
                            curNode = nodeStack[nodeStack.length - 1];

                            //The closing tag itself is not a child of the parent: let's pop it off
                            curNode.children.pop();
                        }

                        //Now go up one level (to the parent) because we have just closed an element
                        if (nodeStack.length > 1) {
                            nodeStack.pop();
                            curNode = nodeStack[nodeStack.length - 1];
                        }
                    }
                    else {
                    }
                }
                else {
                    //Still reading the tag name
                    curNode.name += c;

                    //See if this is a comment
                    if (curNode.name == "!--") {
                        //This is not an element but a comment
                        //Let's go to comment mode
                        curComment = "";
                        state = Comment;
                    }
                }
            }
            else if (state == WaitForAttributeName) {
                if (c == " ") {
                    //Still waiting for attribute name
                }
                else if (c == "/") {
                    //End of tag, no children
                    state = WaitForElementEnd;
                }
                else if (c == ">") {
                    //End of tag
                    state = OutOfTag;
                }
                else {
                    //Here an attribute name starts
                    state = AttributeName;
                    curAttrName = c;
                    curAttrValue = "";
                }
            }
            else if (state == AttributeName) {
                if (c == "=") {
                    //End of attribute name, wait for value
                    state = WaitForAttributeValue;
                }
                else {
                    //Still reading the attribute name
                    curAttrName += c;
                }
            }
            else if (state == WaitForAttributeValue) {
                //Only " or blank is valid here
                if (c == " ") {
                    //Keep waiting
                }
                else if (c == "\"") {
                    //Opened quote: now we prepare to read the value
                    state = AttributeValue;
                }
                else {
                    //Not valid
                    throwInvalidChar();
                }
            }
            else if (state == AttributeValue) {
                //We are in the attribute value: keep reading until a closing quote
                if (c == "\"") {
                    //Closing quote, let's wait for a possible next attribute
                    state = WaitForAttributeName;

                    //Add the attribute name/value to the collection
                    curNode.attributes[trim(curAttrName)] = curAttrValue;
                }
                else {
                    //Part of value
                    curAttrValue += c;
                }
            }
            else if (state == WaitForElementEnd) {
                //Found "/", so now the only acceptable char is > or blank
                if (c == " ") {
                    //Keep waiting
                }
                else if (c == ">") {
                    //Tag closed
                    state = OutOfTag;

                    //This also closes the current node
                    if (nodeStack.length > 1) {
                        nodeStack.pop();
                        curNode = nodeStack[nodeStack.length - 1];
                    }
                }
                else {
                    //Not valid
                    throwInvalidChar();
                }
            }
            else if (state == Comment) {
                //We are in a comment, so let's accumulate the chars into the comment string
                curComment += c;

                //Let's determine when the comment finishes
                if ((/-->$/gi).test(curComment)) {
                    //The comment ends here
                    //Let's strip the comment closing sequence "-->" and the blanks
                    curComment = trim(curComment.substring(0, curComment.length - 3));

                    //Let's now update curNode
                    curNode.name = "#COMMENT";
                    curNode.value = curComment;

                    //End of node
                    nodeStack.pop();
                    curNode = nodeStack[nodeStack.length - 1];
                    state = OutOfTag;
                }
            }
            else
                throwUnexpectedState();
        }

        //End: transform all nodes if required
        var doc = nodeStack[0] || null;
        if (nodeTransform)
            transformRecursively(doc);

        return doc;


        function transformRecursively(node) {
            if (node) {
                //Transform the node...
                nodeTransform(node, doc);

                //... and all its children
                if (node.children) {
                    for (var i in node.children) {
                        var child = node.children[i];
                        transformRecursively(child);
                    }
                }
            }
        }

        function throwInvalidChar() {
            throw "Invalid character: " + c;
        }

        function throwUnexpectedState() {
            throw "Unexpected parser state: " + state;
        }
    }

    return {
        parseString: parseString
    };

})();;


/*
*************************************************
Storage (backed by localStorage/sessionStorage)
*************************************************



EXAMPLE

var d1 = jpvs.Storage.getDomain(localStorage, "Domain 1");
var d2 = jpvs.Storage.getDomain(sessionStorage, "Domain 2");

d1.setItem(0, { col1: "Val 1", col2: "Val2", col3: [ "A", "B", "C" ] });
d1.setItem(1, { col1: "Val 1b", col2: "Val2b" });

d2.setItem(0, { A: "AAA", "B": "BBB" });

d1.each(function(item, i) {
...
});

d1.removeItem(0);

var first = d1.getItem(0);
var N = d1.getCount();
*/
(function () {

    var KEY_PREFIX = "jpvs.Storage.";
    var KEY_PREFIX_LEN = KEY_PREFIX.length;

    function getObject(storage, key, defaultObj) {
        var objAsString = storage[KEY_PREFIX + key];
        if (!objAsString)
            return defaultObj;

        var obj = $.parseJSON(objAsString);
        return obj;
    }

    function setObject(storage, key, obj) {
        var objAsString = jpvs.toJSON(obj);
        storage[KEY_PREFIX + key] = objAsString;
    }

    function removeObject(storage, key) {
        storage.removeItem(KEY_PREFIX + key);
    }

    function eachObject(storage, action) {
        var N = storage.length;
        for (var i = 0; i < N; i++) {
            var entireKey = storage.key(i);
            if (entireKey.indexOf(KEY_PREFIX) != 0)
                continue;

            var key = entireKey.substring(KEY_PREFIX_LEN);
            var valueAsString = storage.getItem(key);
            var value = $.parseJSON(valueAsString);

            if (action(key, value) === false)
                return;
        }
    }

    function getItemKey(domainName, itemIndex) {
        return domainName + "." + itemIndex;
    }

    /*
    Domain class
    */
    function Domain(storage, domain) {
        this.storage = storage;
        this.id = domain.id;
        this.name = domain.name;
    }


    /*
    Get 1 + max(itemIndex)
    */
    Domain.prototype.getCount = function () {
        if (this.deleted)
            return 0;

        var prefix = this.name + ".";
        var prefixLen = prefix.length;

        var N = 0;
        eachObject(this.storage, function (key, value) {
            if (key.indexOf(prefix) == 0) {
                var index = key.substring(prefixLen);
                var nIndex = parseInt(index);
                if (isFinite(nIndex))
                    N = Math.max(N, nIndex + 1);
            }
        });

        return N;
    };

    Domain.prototype.getItem = function (itemIndex) {
        if (this.deleted)
            return null;

        var key = getItemKey(this.name, itemIndex);
        var item = getObject(this.storage, key, null);
        return item;
    };

    Domain.prototype.setItem = function (itemIndex, item) {
        if (this.deleted)
            return;

        var key = getItemKey(this.name, itemIndex);
        setObject(this.storage, key, item);
    };

    Domain.prototype.removeItem = function (itemIndex) {
        if (this.deleted)
            return;

        var key = getItemKey(this.name, itemIndex);
        removeObject(this.storage, key);
    };

    Domain.prototype.removeAllItems = function () {
        if (this.deleted)
            return;

        var N = this.getCount();
        for (var i = 0; i < N; i++)
            this.removeItem(i);
    };

    Domain.prototype.listItems = function () {
        if (this.deleted)
            return [];

        var list = [];
        this.each(function (i, item) {
            list.push(item);
        });
        return list;
    };

    Domain.prototype.each = function (action) {
        if (this.deleted)
            return;

        var N = this.getCount();
        for (var i = 0; i < N; i++) {
            if (action(i, this.getItem(i)) === false)
                return;
        }
    };

    Domain.prototype.deleteDomain = function () {
        if (this.deleted)
            return;

        this.removeAllItems();

        //Remove the entry from the list of domains
        var domains = getObject(this.storage, "Domains", {});
        delete domains[this.id];
        setObject(this.storage, "Domains", domains);

        //Deactivate this
        this.deleted = true;
    };

    jpvs.Storage = {
        listDomains: function (storage) {
            var domains = getObject(storage, "Domains", {});
            var objs = [];
            $.each(domains, function (key, d) {
                objs.push(new Domain(storage, d));
            });

            return objs;
        },

        getDomain: function (storage, domainName) {
            //See if the domain is already there
            var domains = getObject(storage, "Domains", {});
            var found;
            $.each(domains, function (id, d) {
                if (d.name == domainName) {
                    found = new Domain(storage, d);
                    return false;
                }
            });

            if (found)
                return found;

            //Not found in list, let's create it now
            var newD = {
                id: jpvs.randomString(20),
                name: domainName
            };

            var newDomObj = new Domain(storage, newD);

            //Let's add it back into the list of domains
            domains[newD.id] = newD;

            setObject(storage, "Domains", domains);

            return newDomObj;
        }
    };
})();
;


(function () {

    jpvs.equals = function (x, y) {
        //If the objects are strictly equal, no other work is required
        if (x === y)
            return true;

        //Nulls
        if (x === null && y === null)
            return true;
        else if (x === null && y !== null)
            return false;
        else if (x !== null && y === null)
            return false;

        //Undefineds
        if (x === undefined && y === undefined)
            return true;
        else if (x === undefined && y !== undefined)
            return false;
        else if (x !== undefined && y === undefined)
            return false;

        //Booleans
        if (x === true && y === true)
            return true;
        else if (x === true && y !== true)
            return false;
        else if (x !== true && y === true)
            return false;

        if (x === false && y === false)
            return true;
        else if (x === false && y !== false)
            return false;
        else if (x !== false && y === false)
            return false;

        //Object typeof: if different, the object can't be equal
        if (typeof (x) != typeof (y))
            return false;

        //Objects have the same typeof
        //Numbers
        if (typeof (x) == "number") {
            //NaNs
            if (isNaN(x) && isNaN(y))
                return true;
            else if (isNaN(x) && !isNaN(y))
                return false;
            else if (!isNaN(x) && isNaN(y))
                return false;

            return x == y;
        }

        //Strings
        if (typeof (x) == "string")
            return x == y;

        //Objects and arrays
        if (x.length !== undefined && y.length !== undefined) {
            //Arrays
            return arraysEqual(x, y);
        }
        else if (x.length !== undefined && y.length === undefined) {
            //Array and object
            return false;
        }
        else if (x.length === undefined && y.length !== undefined) {
            //Object and array
            return false;
        }
        else {
            //Objects
            return objectsEqual(x, y);
        }

    };

    function arraysEqual(x, y) {
        if (x.length != y.length)
            return false;

        //Same length, then all elements must be equal
        for (var i = 0; i < x.length; i++) {
            var xVal = x[i];
            var yVal = y[i];
            if (!jpvs.equals(xVal, yVal))
                return false;
        }

        //No reason to say x and y are different
        return true;
    }

    function objectsEqual(x, y) {
        //If dates, special treatment
        if (x.getTime && y.getTime) {
            //Both dates
            return x.getTime() == y.getTime();
        }
        else if (!x.getTime && y.getTime) {
            //Not "both dates"
            return false;
        }
        else if (x.getTime && !y.getTime) {
            //Not "both dates"
            return false;
        }

        //All members of x must exist in y and be equal
        var alreadyChecked = {};
        for (var key in x) {
            var xVal = x[key];
            var yVal = y[key];
            if (!jpvs.equals(xVal, yVal))
                return false;

            alreadyChecked[key] = true;
        }

        //Other way round; for speed, exclude those already checked
        for (var key in y) {
            if (alreadyChecked[key])
                continue;

            var xVal = x[key];
            var yVal = y[key];
            if (!jpvs.equals(xVal, yVal))
                return false;
        }

        //No reason to say x and y are different
        return true;
    }

})();
;


(function () {

    jpvs.filter = function (array, filteringRules) {
        //Create a copy of the array and filter
        var ret = [];
        for (var i = 0; i < array.length; i++) {
            var item = array[i];

            //Check all rules; they must be all satisfied
            var failure = false;
            for (var ruleIndex = 0; ruleIndex < filteringRules.length; ruleIndex++) {
                var rule = filteringRules[ruleIndex];
                var leftString = (rule.selector(item) || "").toString().toUpperCase();
                var rightString = (rule.value || "").toString().toUpperCase();
                var operand = rule.operand.toUpperCase();
                var ok = isRuleOk(leftString, operand, rightString);
                if (!ok) {
                    failure = true;
                    break;
                }
            }

            //If no rule failed, then we keep the item
            if (!failure)
                ret.push(item);
        }

        return ret;
    };

    function isRuleOk(left, operand, right) {
        if (operand == "EQ") {
            //Equals
            return left == right;
        }
        else if (operand == "NEQ") {
            //Not equals
            return left != right;
        }
        else if (operand == "CONTAINS") {
            //Left contains right
            return left.indexOf(right) >= 0;
        }
        else if (operand == "NCONTAINS") {
            //Left does not contain right
            return left.indexOf(right) < 0;
        }
        else if (operand == "STARTS") {
            //Left starts with right
            return left.indexOf(right) == 0;
        }
        else if (operand == "NSTARTS") {
            //Left does not start with right
            return left.indexOf(right) != 0;
        }
        else if (operand == "LT") {
            //left < right
            return left < right;
        }
        else if (operand == "LTE") {
            //left <= right
            return left <= right;
        }
        else if (operand == "GT") {
            //left > right
            return left > right;
        }
        else if (operand == "GTE") {
            //left >= right
            return left >= right;
        }
        else {
            //Unknown rule: assume false
            return false;
        }
    }
})();
;


(function () {

    jpvs.sort = function (array, sortingRules) {
        //Create a copy of the array
        var ret = [];
        for (var i = 0; i < array.length; i++)
            ret.push(array[i]);

        //Then sort in place
        ret.sort(comparatorFunction(sortingRules));

        return ret;
    };

    function comparatorFunction(sortingRules) {
        return function (a, b) {
            //Process the sorting rules in order. Compare numbers numerically and strings alphabetically.
            for (var i = 0; i < sortingRules.length; i++) {
                var rule = sortingRules[i];
                var keyA = rule.selector(a);
                var keyB = rule.selector(b);
                var comparison = jpvs.compare(keyA, keyB);

                //If different, then end. Otherwise, continue to next sorting rule
                if (comparison != 0)
                    return rule.descending ? -comparison : comparison;
            }

            //If we get here, a and b are equal with respect to all sorting rules
            return 0;
        };
    }

    jpvs.compare = function (a, b) {
        //Undefined comes before null, which in turn comes before all numbers, which in turn all come before anything else
        if (a === undefined) {
            if (b === undefined)
                return 0;
            else
                return -1;
        }
        else if (a === null) {
            if (b === undefined)
                return +1;
            else if (b === null)
                return 0;
            else
                return -1;
        }
        else {
            if (b === undefined)
                return +1;
            else if (b === null)
                return +1;
            else {
                //a and b are both non-null and non-undefined
                var aNumber = (typeof (a) == "number");
                var bNumber = (typeof (b) == "number");

                if (aNumber && bNumber) {
                    //Both numbers: compare numerically
                    return a - b;
                }
                else if (aNumber && !bNumber) {
                    //All numbers come before all strings
                    return -1;
                }
                else if (!aNumber && bNumber) {
                    //All numbers come before all strings
                    return +1;
                }
                else {
                    //Both strings or convertable-to-strings: compare alphabetically
                    var a2 = a.toString().toUpperCase();
                    var b2 = b.toString().toUpperCase();

                    if (a2 > b2)
                        return +1;
                    else if (a2 < b2)
                        return -1;
                    else
                        return 0;
                }
            }
        }
    };
})();
;


jpvs.Button = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Button,
    type: "Button",
    cssClass: "Button",

    create: function (container) {
        var obj = document.createElement("button");
        $(obj).attr("type", "button");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.click(function () {
            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("button,input[type=\"button\"]");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        })
    }
});


jpvs.writeButtonBar = function (container, buttons) {
    if (!container)
        return;
    if (!buttons)
        return;

    //Handle the case when container is a jpvs widget
    container = jpvs.getElementIfWidget(container);

    //Create buttonbar
    var bar = $(document.createElement("div"));
    $(bar).addClass("ButtonBar").appendTo(container);

    //Add individual buttons
    $.each(buttons, function (i, btnDef) {
        var btn = jpvs.Button.create(bar);
        btn.text(btnDef.text || "OK").click.bind(btnDef.click);
    });

    return bar;
};
;


jpvs.CheckBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.CheckBox,
    type: "CheckBox",
    cssClass: "CheckBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "checkbox");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        //Route both CLICK and CHANGE to out CHANGE event
        this.element.click(function () {
            return W.change.fire(W);
        });
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"checkbox\"]");
    },

    prototype: {
        checked: jpvs.property({
            get: function () { return this.element.prop("checked"); },
            set: function (value) { this.element.prop("checked", value ? true : false); }
        }),

        text: jpvs.property({
            get: function () {
                this.ensureId();
                var lbl = $("label[for=\"" + this.id() + "\"]");
                return lbl.text();
            },
            set: function (value) {
                this.ensureId();
                var lbl = $("label[for=\"" + this.id() + "\"]");
                if (lbl.length == 0) {
                    lbl = $(document.createElement("label"));
                    lbl.attr("for", this.id());
                    lbl.insertAfter(this.element);

                    //Let's keep a reference to the label, just in case
                    this.label = lbl;
                }

                lbl.text(value);
            }
        })
    }
});


;


(function () {

    jpvs.DataGrid = function (selector) {
        this.attach(selector);

        this.dataItemClick = jpvs.event(this);
        this.changedSortFilter = jpvs.event(this);
    };

    //NOTE: the following strings are also used in the TableExtender
    jpvs.DataGrid.allStrings = {
        en: {
            column: "Column",
            currentColumn: "Selected column",
            addFilter: "Add filtering rule",
            addSort: "Add sorting rule",

            clickToSortAndFilter: "Click here for sorting/filtering options",
            clickToSort: "Click here for sorting options",
            clickToFilter: "Click here for filtering options",

            titleSortAndFilter: "Sorting/filtering options",
            titleSort: "Sorting options",
            titleFilter: "Filtering options",

            noFilterSpecified: "No filtering criteria specified",
            noSortSpecified: "No sorting specified",

            ok: "OK",
            cancel: "Cancel",
            remove: "Remove",

            condition: "Condition",
            orderBy: "Order by",
            thenBy: "Then by",
            descending: "Descending",

            op_EQ: "is equal to",
            op_NEQ: "is not equal to",
            op_CONTAINS: "contains",
            op_NCONTAINS: "does not contain",
            op_STARTS: "starts with",
            op_NSTARTS: "does not start with",
            op_LT: "is less than",
            op_LTE: "is less than or equal to",
            op_GT: "is greater than",
            op_GTE: "is greater than or equal to"
        },

        it: {
            column: "Colonna",
            currentColumn: "Colonna selezionata",
            addFilter: "Aggiungi criterio di filtro",
            addSort: "Aggiungi criterio di ordinamento",

            clickToSortAndFilter: "Clicca qui per ordinare/filtrare i dati",
            clickToSort: "Clicca qui per ordinare i dati",
            clickToFilter: "Clicca qui per filtrare i dati",

            titleSortAndFilter: "Ordinamento/filtro",
            titleSort: "Ordinamento",
            titleFilter: "Filtro",

            noFilterSpecified: "Nessun criterio di filtro specificato",
            noSortSpecified: "Nessun ordinamento specificato",

            ok: "OK",
            cancel: "Annulla",
            remove: "Rimuovi",

            condition: "Condizione",
            orderBy: "Ordina per",
            thenBy: "Poi per",
            descending: "Ordine inverso",

            op_EQ: "è uguale a",
            op_NEQ: "è diverso da",
            op_CONTAINS: "contiene",
            op_NCONTAINS: "non contiene",
            op_STARTS: "inizia per",
            op_NSTARTS: "non inizia per",
            op_LT: "è minore di",
            op_LTE: "è minore o uguale a",
            op_GT: "è maggiore di",
            op_GTE: "è maggiore o uguale a"
        }
    };

    jpvs.DataGrid.getFilteringOperands = function () {
        return [
            { value: "EQ", text: jpvs.DataGrid.strings.op_EQ },
            { value: "NEQ", text: jpvs.DataGrid.strings.op_NEQ },
            { value: "CONTAINS", text: jpvs.DataGrid.strings.op_CONTAINS },
            { value: "NCONTAINS", text: jpvs.DataGrid.strings.op_NCONTAINS },
            { value: "STARTS", text: jpvs.DataGrid.strings.op_STARTS },
            { value: "NSTARTS", text: jpvs.DataGrid.strings.op_NSTARTS },
            { value: "LT", text: jpvs.DataGrid.strings.op_LT },
            { value: "LTE", text: jpvs.DataGrid.strings.op_LTE },
            { value: "GT", text: jpvs.DataGrid.strings.op_GT },
            { value: "GTE", text: jpvs.DataGrid.strings.op_GTE }
        ];
    };

    jpvs.makeWidget({
        widget: jpvs.DataGrid,
        type: "DataGrid",
        cssClass: "DataGrid",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.DataGrid.strings = jpvs.DataGrid.allStrings[jpvs.currentLocale()];

            //Attach a click handler to all rows, even those we will add later
            this.element.on("click", "tr", function (e) {
                return onRowClicked(W, e.currentTarget);
            });

            //Attach a hovering effect on the header row, for handling sorting/filtering
            this.element.on("mouseenter", "thead > tr", function (e) {
                onHeaderRowMouseOver(W, e.currentTarget);
            });
            this.element.on("mouseleave", "thead > tr", function (e) {
                onHeaderRowMouseOut(W, e.currentTarget);
            });
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            template: jpvs.property({
                get: function () { return this.element.data("template"); },
                set: function (value) { this.element.data("template", value); }
            }),

            emptyRowTemplate: jpvs.property({
                get: function () { return this.element.data("emptyRowTemplate"); },
                set: function (value) { this.element.data("emptyRowTemplate", value); }
            }),

            binder: jpvs.property({
                get: function () { return this.element.data("binder"); },
                set: function (value) { this.element.data("binder", value); }
            }),

            caption: jpvs.property({
                get: function () {
                    var caption = this.element.children("caption");
                    if (caption.length != 0)
                        return caption.text();
                    else
                        return null;
                },
                set: function (value) {
                    var caption = this.element.children("caption");
                    if (caption.length == 0) {
                        caption = $(document.createElement("caption"));
                        this.element.prepend(caption);
                    }

                    caption.text(value);
                }
            }),

            enableEvenOdd: jpvs.property({
                get: function () {
                    var val = this.element.data("enableEvenOdd");
                    if (val === true || val === false)
                        return val;
                    else
                        return true;    //Default value
                },
                set: function (value) { this.element.data("enableEvenOdd", value); }
            }),

            enableSorting: jpvs.property({
                get: function () {
                    var val = this.element.data("enableSorting");
                    if (val === true || val === false)
                        return val;
                    else
                        return false;    //Default value
                },
                set: function (value) { this.element.data("enableSorting", value); }
            }),

            enableFiltering: jpvs.property({
                get: function () {
                    var val = this.element.data("enableFiltering");
                    if (val === true || val === false)
                        return val;
                    else
                        return false;    //Default value
                },
                set: function (value) { this.element.data("enableFiltering", value); }
            }),

            //This is used for filling the "order by" combos in the "Sorting/filtering options" popup
            sortAndFilterExpressions: jpvs.property({
                get: function () {
                    var val = this.element.data("sortAndFilterExpressions");
                    if (!val) {
                        //If not initialized, attempt to determine a list of expressions (the header texts)
                        val = [];
                        this.element.find("thead > tr > th").each(function () {
                            var txt = $(this).text();
                            val.push({ value: txt, text: txt });
                        });
                    }

                    return val;
                },
                set: function (value) {
                    this.element.data("sortAndFilterExpressions", value);
                }
            }),

            currentSort: jpvs.property({
                get: function () {
                    //We want to return null (not undefined) if the value has not been set
                    return this.element.data("currentSort") || null;
                },
                set: function (value) {
                    this.element.data("currentSort", value);
                }
            }),

            currentFilter: jpvs.property({
                get: function () {
                    //We want to return null (not undefined) if the value has not been set
                    return this.element.data("currentFilter") || null;
                },
                set: function (value) {
                    this.element.data("currentFilter", value);
                }
            }),

            clear: function () {
                this.element.find("tr").remove();
                return this;
            },

            dataBind: function (data) {
                dataBind(this, "tbody", data);
                return this;
            },

            dataBindHeader: function (data) {
                dataBind(this, "thead", data);
                return this;
            },

            dataBindFooter: function (data) {
                dataBind(this, "tfoot", data);
                return this;
            },

            addBodyRow: function (item, index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            addHeaderRow: function (item, index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            addFooterRow: function (item, index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            removeBodyRow: function (index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeHeaderRow: function (index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeFooterRow: function (index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeBodyRows: function (index, count) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
            },

            removeHeaderRows: function (index, count) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
            },

            removeFooterRows: function (index, count) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
            }
        }
    });

    function dataBind(W, section, data) {
        //Get the current binder or the default one
        var binder = W.binder() || jpvs.DataGrid.defaultBinder;

        //Call the binder, setting this=WIDGET and passing section and data
        binder.call(W, section, data);
    }

    function getSection(W, section) {
        //Ensure the "section" exists (thead, tbody or tfoot)
        var sectionElement = W.element.children(section);
        if (sectionElement.length == 0) {
            sectionElement = $(document.createElement(section));
            W.element.append(sectionElement);
        }

        return sectionElement;
    }

    function addRow(W, sectionName, sectionElement, item, index) {
        //If item is null or undefined, continue anyway. We will add an empty row with a special "empty row template".
        //Add a new row
        var tr = $(document.createElement("tr"));

        if (index === null || index === undefined) {
            //Append, because no index was specified
            sectionElement.append(tr);

            //Only update the even/odd of the last row
            if (W.enableEvenOdd())
                updateEvenOdd(-1, sectionElement);
        }
        else {
            //An index was specified: insert the row at that index
            var trs = sectionElement.children("tr");
            if (trs.length == 0)
                sectionElement.append(tr);
            else
                trs.eq(index).before(tr);

            //Update the even/odd state of all rows from "index" on
            if (W.enableEvenOdd())
                updateEvenOdd(index, sectionElement);
        }

        //Create the cells according to the row template
        var tmpl = W.template();
        var emptyRowTmpl = W.emptyRowTemplate();
        if (tmpl)
            applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item);
    }

    function removeRow(W, sectionElement, index, count) {
        //By default, count = 1
        if (count === null || count === undefined)
            count = 1;

        if (count == 1)
            sectionElement.children("tr").eq(index).remove();
        else if (count > 1)
            sectionElement.children("tr").slice(index, index + count).remove();

        //Update the even/odd state of all rows from "index" on
        if (W.enableEvenOdd())
            updateEvenOdd(index, sectionElement);
    }

    function updateEvenOdd(start, sectionElement) {
        var rows = sectionElement.children("tr");

        if (start < 0)
            start += rows.length;

        var even = ((start % 2) == 0);

        for (var i = start; i < rows.length; i++) {
            var row = rows.eq(i);
            row.removeClass("Even Odd").addClass(even ? "Even" : "Odd");

            //Toggle "even"
            even = !even;
        }
    }

    function decodeSectionName(section) {
        if (section == "thead") return "header";
        else if (section == "tfoot") return "footer";
        else return "body";
    }

    function applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item) {
        //Remove the existing cells
        tr.empty();

        //Then write the new cells
        if (item) {
            //We have a record
            //The template is a collection of column templates. For each element, create a cell.
            $.each(tmpl, function (i, columnTemplate) {
                /*
                Determine the cell template, given the column template.
                The column template may be in the form:
                { header: headerCellTemplate, body: bodyCellTemplate, footer: footerCellTemplate } where any element may be missing.
                Or it may contain the cell template directly.
                */
                var cellTemplate = columnTemplate;
                if (columnTemplate.header || columnTemplate.body || columnTemplate.footer)
                    cellTemplate = columnTemplate[sectionName];

                //Determine if we have to create a TH or a TD
                var cellTag = "td";
                if ((cellTemplate && cellTemplate.isHeader) || sectionName == "header" || sectionName == "footer")
                    cellTag = "th";

                //Create the cell
                var cell = $(document.createElement(cellTag));
                tr.append(cell);

                //Populate the cell by applying the cell template
                jpvs.applyTemplate(cell, cellTemplate, item);
            });

            //Keep track of the fact we are NOT using the empty row template
            tr.data("fromEmptyRowTemplate", false);

            //Keep track of the data item (used for the dataItemClick event)
            tr.data("dataItem", item);
        }
        else {
            //We don't have a record. Let's use the empty row template, if any, or the default empty row template
            jpvs.applyTemplate(tr, emptyRowTmpl || createDefaultEmptyRowTemplate(tmpl.length), item);

            //Keep track of the fact we are using the empty row template
            tr.data("fromEmptyRowTemplate", true);
        }
    }

    function createDefaultEmptyRowTemplate(numCols) {
        return function (dataItem) {
            //Since it's an empty row template, we have no data, so we ignore the "dataItem" argument
            //Let's create a single cell that spans the entire row
            var singleTD = jpvs.writeTag(this, "td").attr("colspan", numCols);

            //Loading animated GIF
            jpvs.writeTag(singleTD, "img").attr("src", jpvs.Resources.images.loading);

            //Then let's create an invisible dummy text so the row has the correct height automagically
            jpvs.writeTag(singleTD, "span", ".").css("visibility", "hidden");
        };
    }

    function onRowClicked(grid, tr) {
        var dataItem = $(tr).data("dataItem");
        if (dataItem)
            return grid.dataItemClick.fire(grid, null, dataItem);
    }

    function onHeaderRowMouseOver(grid, tr) {
        //If neither sorting nor filtering are enabled, no hovering effect
        var enableSorting = grid.enableSorting();
        var enableFiltering = grid.enableFiltering();
        if (!enableSorting && !enableFiltering)
            return;

        var tooltip = "";
        if (enableSorting && enableFiltering)
            tooltip = jpvs.DataGrid.strings.clickToSortAndFilter;
        else if (enableSorting)
            tooltip = jpvs.DataGrid.strings.clickToSort;
        else if (enableFiltering)
            tooltip = jpvs.DataGrid.strings.clickToFilter;

        //Otherwise, let's give visual cues so the user can sort/filter
        //Let's add an unobtrusive button to each cell, unless the buttons are already displayed
        //Only add buttons on columns where sorting/filtering is required
        var exprs = grid.sortAndFilterExpressions();
        var buttons = $(tr).data("jpvsColButtons") || [];
        if (buttons.length == 0) {
            $(tr).find("td,th").each(function (index) {
                //Skip this column if this column is not listed as a sort/filter expression
                if (!exprs[index])
                    return;

                //Measure the cell
                var cell = $(this);
                var pos = cell.position();
                var x = pos.left;
                var y = pos.top;
                var w = cell.innerWidth();
                var h = cell.outerHeight();

                var imgTop = y;
                var imgLeft = x + w;

                var img = jpvs.ImageButton.create(cell).imageUrls({
                    normal: jpvs.Resources.images.dataGridColumnButton,
                    hover: jpvs.Resources.images.dataGridColumnButtonHover
                });

                imgLeft -= img.element.width();

                img.element.css({
                    position: "absolute",
                    left: imgLeft + "px",
                    top: imgTop + "px"
                }).attr("title", tooltip);

                img.click(onHeaderButtonClickFunc(grid, index));

                buttons.push(img);
            });

            //Keep track of the buttons
            $(tr).data("jpvsColButtons", buttons);
        }
    }

    function onHeaderRowMouseOut(grid, tr) {
        //Let's make the buttons disappear
        var buttons = $(tr).data("jpvsColButtons");
        if (buttons) {
            setTimeout(function () {
                $.each(buttons, function (i, button) {
                    button.destroy();
                });
            }, 5000);
        }
        $(tr).data("jpvsColButtons", null);
    }

    function onHeaderButtonClickFunc(grid, colIndex) {
        return function () {
            onHeaderButtonClick(grid, colIndex);
        };
    }

    function onHeaderButtonClick(grid, colIndex) {
        var enableSorting = grid.enableSorting();
        var enableFiltering = grid.enableFiltering();
        if (!enableSorting && !enableFiltering)
            return;

        var title = "";
        if (enableSorting && enableFiltering)
            title = jpvs.DataGrid.strings.titleSortAndFilter;
        else if (enableSorting)
            title = jpvs.DataGrid.strings.titleSort;
        else if (enableFiltering)
            title = jpvs.DataGrid.strings.titleFilter;

        //Open a popup with sorting/filtering options
        var pop = jpvs.Popup.create().title(title).show();

        var bothEnabled = enableSorting && enableFiltering;

        //If both are enabled, group fields together for clarity
        var pnlSort = pop;
        var pnlFilter = pop;
        if (bothEnabled) {
            pnlSort = jpvs.writeTag(pop, "fieldset");
            pnlFilter = jpvs.writeTag(pop, "fieldset");

            jpvs.writeTag(pnlSort, "legend", jpvs.DataGrid.strings.titleSort);
            jpvs.writeTag(pnlFilter, "legend", jpvs.DataGrid.strings.titleFilter);
        }

        //Sorting panel
        var sortControls = [];
        if (enableSorting) {
            var tblSort = jpvs.Table.create(pnlSort);

            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.orderBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));

            //Set the combos to the current sort expression, if any, otherwise set only the first combo to the "colIndex" (the
            //clicked column)
            var sortExpr = grid.currentSort();
            if (!sortExpr) {
                var allExprs = grid.sortAndFilterExpressions();
                var colIndexName = allExprs && allExprs[colIndex] && allExprs[colIndex].value;
                if (colIndexName)
                    sortExpr = [{ name: colIndexName}];
                else
                    sortExpr = [];
            }

            //Set the combos to "sortExpr"
            for (var i = 0; i < sortControls.length; i++)
                setSortingRowValue(sortControls[i], sortExpr[i]);
        }

        //Filtering panel
        var filterControls = [];
        if (enableFiltering) {
            var tblFilter = jpvs.Table.create(pnlFilter);

            filterControls.push(writeFilteringRow(tblFilter));
            filterControls.push(writeFilteringRow(tblFilter));
            filterControls.push(writeFilteringRow(tblFilter));
            filterControls.push(writeFilteringRow(tblFilter));

            //Set the combos to the current filter expression, if any
            var filterExpr = grid.currentFilter() || [];

            //Set the combos to "filterExpr"
            for (var i = 0; i < filterControls.length; i++)
                setFilteringRowValue(filterControls[i], filterExpr[i]);
        }

        //Finally, button bar and close button
        jpvs.writeButtonBar(pop, [
            { text: jpvs.DataGrid.strings.ok, click: onOK },
            { text: jpvs.DataGrid.strings.cancel, click: onCancel }
        ]);
        pop.close(onCancel);

        //Events
        function onCancel() {
            pop.destroy();
        }

        function onOK() {
            //Save settings
            if (enableSorting) {
                //Save the sorting settings
                var sortExpr = [];
                for (var i = 0; i < sortControls.length; i++) {
                    var cmb = sortControls[i].cmbSort;
                    var chk = sortControls[i].chkDesc;

                    var name = cmb.selectedValue();
                    var desc = chk.checked();
                    if (name && name != "")
                        sortExpr.push({ name: name, descending: desc });
                }

                grid.currentSort(sortExpr);
            }

            if (enableFiltering) {
                //Save the filtering settings
                var filterExpr = [];
                for (var i = 0; i < filterControls.length; i++) {
                    var cmb1 = filterControls[i].cmbFilter;
                    var cmb2 = filterControls[i].cmbOp;
                    var txt = filterControls[i].txtValue;

                    var name = cmb1.selectedValue();
                    var op = cmb2.selectedValue();
                    var val = txt.text();
                    if (name && name != "" && op && op != "")
                        filterExpr.push({ name: name, operand: op, value: val });
                }

                grid.currentFilter(filterExpr);
            }

            //Finally, close the popup and fire event that sort/filter has just changed, so that binders
            //can take appropriate action (refresh grid/page)
            grid.changedSortFilter.fire(grid);
            pop.destroy();
        }

        //Utilities
        function writeSortingRow(tbl, caption) {
            //Order by: COMBO (field name) CHECKBOX (ascending/descending)
            var row = tbl.writeRow();
            row.writeCell(caption + ": ");
            var cmbSort = jpvs.DropDownList.create(row.writeCell());
            var chkDesc = jpvs.CheckBox.create(row.writeCell());
            chkDesc.text(jpvs.DataGrid.strings.descending);

            //Fill the combo with the header names
            cmbSort.addItem("");
            cmbSort.addItems(grid.sortAndFilterExpressions());

            return { cmbSort: cmbSort, chkDesc: chkDesc };
        }

        function setSortingRowValue(sortControl, sortPred) {
            if (sortPred) {
                sortControl.cmbSort.selectedValue(sortPred.name);
                sortControl.chkDesc.checked(sortPred.descending);
            }
        }

        function writeFilteringRow(tbl, caption) {
            //COMBO (field name) COMBO (operand), TEXTBOX (value)
            var row = tbl.writeRow();
            var cmbFilter = jpvs.DropDownList.create(row.writeCell());
            var cmbOp = jpvs.DropDownList.create(row.writeCell());
            var txtValue = jpvs.TextBox.create(row.writeCell());

            //Fill the combo with the header names
            cmbFilter.addItem("");
            cmbFilter.addItems(grid.sortAndFilterExpressions());

            //Fill the combo with the operands
            cmbOp.addItem("");
            cmbOp.addItems(jpvs.DataGrid.getFilteringOperands());

            return { cmbFilter: cmbFilter, cmbOp: cmbOp, txtValue: txtValue };
        }

        function setFilteringRowValue(filterControl, filterPred) {
            if (filterPred) {
                filterControl.cmbFilter.selectedValue(filterPred.name);
                filterControl.cmbOp.selectedValue(filterPred.operand);
                filterControl.txtValue.text(filterPred.value);
            }
        }

    }


    function getDataSourceOptions(W) {
        //Returns sorting/filtering options, as needed by the call to jpvs.readDataSource
        return {
            sort: W.currentSort(),
            filter: W.currentFilter()
        };
    }

    /*
    Default binder

    Displays all rows in the datasource
    */
    jpvs.DataGrid.defaultBinder = function (section, data) {
        var W = this;

        //Refresh the grid now...
        refresh();

        //...and whenever sorting/filtering options are changed by the user
        W.changedSortFilter.unbind("binder");
        W.changedSortFilter.bind("binder", refresh);

        function refresh() {
            //Remove all rows
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            //Read the entire data set...
            jpvs.readDataSource(data, null, null, getDataSourceOptions(W), next);

            //...and bind all the rows
            function next(ret) {
                sectionElement.empty();
                $.each(ret.data, function (i, item) {
                    addRow(W, sectionName, sectionElement, item);
                });
            }
        }
    };



    /*
    Paging binder

    Displays rows in the grid one page at a time
    */
    jpvs.DataGrid.pagingBinder = function (params) {
        var copyOfCurPage = 0;

        function binder(section, data) {
            var pageSize = (params && params.pageSize) || 10;
            var preserveCurrentPage = (params && params.preserveCurrentPage);

            var W = this;

            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curPage = preserveCurrentPage ? copyOfCurPage : 0;
            copyOfCurPage = curPage;

            //Ensure the pager is present
            var pager = getPager();

            //Refresh the current page
            refreshPage();

            //Whenever the user changes sorting/filtering, refresh the current page
            W.changedSortFilter.unbind("binder");
            W.changedSortFilter.bind("binder", refreshPage);

            function getPager() {
                //Let's see if a pager has already been created for this datagrid
                var pagerId = W.element.data("pagerId");
                var pager;
                if (pagerId) {
                    //There is a pager
                    pager = jpvs.find("#" + pagerId);
                }
                else {
                    //No pager, let's create one
                    var pagerContainer = document.createElement("div");
                    W.element.before(pagerContainer);
                    pager = jpvs.Pager.create(pagerContainer);

                    pagerId = jpvs.randomString(20);
                    pager.element.attr("id", pagerId);
                    W.element.data("pagerId", pagerId);
                }

                //Bind events
                pager.change.unbind("DataGrid");
                pager.change.bind("DataGrid", onPageChange);

                return pager;
            }

            function onPageChange() {
                var newPage = this.page();
                curPage = newPage;
                copyOfCurPage = curPage;
                refreshPage(W, section, data, pager);
            }

            function refreshPage() {
                //Read the current page...
                var start = curPage * pageSize;
                jpvs.readDataSource(data, start, pageSize, getDataSourceOptions(W), next);

                //...and bind all the rows
                function next(ret) {
                    //Remove all rows
                    sectionElement.empty();

                    //Add rows
                    $.each(ret.data, function (i, item) {
                        addRow(W, sectionName, sectionElement, item);
                    });

                    //Update the pager, based on the current situation
                    var totPages = Math.floor((ret.total + pageSize - 1) / pageSize);
                    pager.totalPages(totPages);
                    pager.page(curPage);
                }
            }
        }

        function getCurrentPage() {
            return copyOfCurPage;
        }

        binder.currentPage = jpvs.property({
            get: getCurrentPage
        });


        return binder;
    };



    /*
    Scrolling binder

    Displays at most one page and allows up/down scrolling
    */
    jpvs.DataGrid.scrollingBinder = function (params) {
        var pageSize = (params && params.pageSize) || 10;
        var chunkSize = (params && params.chunkSize) || (5 * pageSize);
        var forcedWidth = (params && params.width);
        var forcedHeight = (params && params.height);

        //Keep a request queue to minimize calls to the datasource
        var requestQueue = [];
        var requestInProgress = false;

        //Here's the binder
        function binder(section, data) {
            var W = this;
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curScrollPos = null;

            var cachedData = [];
            var totalRecords = null;

            //In this variables we keep the maximum grid size encountered
            var maxGridWidth = 0;
            var maxGridHeight = 0;

            //Ensure the scroller is present
            var scroller = getScroller();

            //Load the first chunk of data (only the visible page for faster turnaround times)
            jpvs.readDataSource(data, 0, pageSize, getDataSourceOptions(W), onDataLoaded(function () {
                updateGrid(0);

                //After loading and displaying the first page, load some more records in background
                jpvs.readDataSource(data, pageSize, chunkSize, getDataSourceOptions(W), onDataLoaded(updateRows));
            }));

            //When sort/filter is changed, reload and empty the cache
            W.changedSortFilter.unbind("binder");
            W.changedSortFilter.bind("binder", function () {
                cachedData = [];
                totalRecords = null;

                jpvs.readDataSource(data, curScrollPos, pageSize, getDataSourceOptions(W), onDataLoaded(function () {
                    refreshPage(curScrollPos);
                }));
            });

            function ensurePageOfDataLoaded(newScrollPos) {
                //Let's make sure we have all the records in memory (at least for the page we have to display)
                var start = newScrollPos;
                var end = start + pageSize;
                var allPresent = true;
                var firstMissingIndex;
                for (var i = start; i < end && i < totalRecords; i++) {
                    var recordPresent = cachedData[i];
                    if (!recordPresent) {
                        allPresent = false;
                        firstMissingIndex = i;
                        break;
                    }
                }

                //If we don't have all records in memory, let's call the datasource
                if (allPresent)
                    updateRows();
                else {
                    //Read from firstMissingIndex - chunkSize up to firstMissingIndex + chunkSize
                    var start = Math.max(0, firstMissingIndex - chunkSize);
                    var end = Math.min(firstMissingIndex + chunkSize, totalRecords);
                    enqueueLoad(start, end);
                }
            }

            function enqueueLoad(start, end) {
                requestQueue.push({ start: start, end: end });
                ensureRequestInProgress();
            }

            function ensureRequestInProgress() {
                if (requestInProgress)
                    return;

                //If no request is in progress, let's start a request
                //Let's consolidate multiple requests into a single one
                if (requestQueue.length != 0) {
                    var minStart = requestQueue[0].start;
                    var maxEnd = requestQueue[0].end;
                    var lastStart, lastEnd;
                    for (var i = 0; i < requestQueue.length; i++) {
                        var req = requestQueue[i];
                        lastStart = req.start;
                        lastEnd = req.end;

                        minStart = Math.min(minStart, lastStart);
                        maxEnd = Math.max(maxEnd, lastEnd);
                    }

                    //Empty the queue and call the datasource
                    requestQueue = [];
                    requestInProgress = true;
                    jpvs.readDataSource(data, minStart, maxEnd - minStart, getDataSourceOptions(W), onDataLoaded(updateRows));
                }
            }


            function onDataLoaded(next) {
                //This function gets called whenever new records are returned from the data source
                return function (ret) {
                    //Keep track that no request is in progress
                    requestInProgress = false;

                    //Write to cache
                    if (totalRecords === null)
                        totalRecords = ret.total;

                    var start = ret.start;
                    var count = ret.count;

                    //Resize cache if necessary
                    while (cachedData.length < totalRecords)
                        cachedData.push(undefined);

                    //Now write into the array
                    var i = start, j = 0;
                    while (j < count)
                        cachedData[i++] = ret.data[j++];

                    //Call the next function
                    if (next)
                        next();
                };
            }

            function updateGrid(newScrollPos) {
                if (curScrollPos === null) {
                    //First time: write the entire page
                    refreshPage(newScrollPos);
                }
                else {
                    //Not first time. Determine if it's faster to refresh the entire page or to delete/insert selected rows
                    var delta = newScrollPos - curScrollPos;

                    //"delta" represents the number of rows to delete and the number of new rows to insert
                    //Refreshing the entire page requires deleting all rows and inserting the entire page (pageSize)
                    if (Math.abs(delta) < pageSize) {
                        //Incremental is better
                        scrollGrid(newScrollPos, delta);
                    }
                    else {
                        //Full redraw is better
                        refreshPage(newScrollPos);
                    }
                }

                //At the end, the new position becomes the current position
                curScrollPos = newScrollPos;
            }

            function refreshPage(newScrollPos) {
                //Remove all rows
                sectionElement.empty();

                //Add one page of rows
                var end = Math.min(newScrollPos + pageSize, totalRecords);
                for (var i = newScrollPos; i < end; i++)
                    addRow(W, sectionName, sectionElement, cachedData[i]);

                //Refresh the scroller
                refreshScroller();
            }

            function scrollGrid(newScrollPos, delta) {
                if (delta > 0) {
                    //Scroll forward: remove "delta" lines from the beginning and append "delta" lines at the end
                    W.removeBodyRows(0, delta);

                    var i = newScrollPos + pageSize - delta;
                    var j = 0;
                    while (j++ < delta) {
                        if (i < totalRecords)
                            addRow(W, sectionName, sectionElement, cachedData[i++]);
                    }
                }
                else if (delta < 0) {
                    delta = -delta;

                    //Scroll backwards: remove "delta" lines at the end and insert "delta" lines at the beginning
                    W.removeBodyRows(pageSize - delta, delta);

                    var i = newScrollPos;
                    var j = 0;
                    while (j < delta) {
                        if (i < totalRecords)
                            addRow(W, sectionName, sectionElement, cachedData[i++], j++);
                    }
                }

                //After the move, refresh the scroller
                refreshScroller();
            }

            function updateRows() {
                //Row templates
                var tmpl = W.template();
                var emptyRowTmpl = W.emptyRowTemplate();

                //See what records are displayed
                var visibleRows = sectionElement.children("tr");
                var start = curScrollPos;
                var end = start + visibleRows.length;

                //Update the rows, if we now have the data
                var updatedSomething = false;
                var j = 0;
                for (var i = start; i < end; i++) {
                    var item = cachedData[i];
                    var tr = visibleRows.eq(j++);

                    //Only if the row is empty, substitute the cells with up-to-date values
                    //If the row is not empty, leave it unchanged
                    if (item && tr.data("fromEmptyRowTemplate")) {
                        if (tmpl) {
                            applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item);
                            updatedSomething = true;
                        }
                    }
                }

                //Refresh the scroller
                if (updatedSomething)
                    refreshScroller();

                //Ensure the request queue is processed, if necessary
                ensureRequestInProgress();
            }

            function getScroller() {
                //Let's see if a scroller has already been created for this datagrid
                var scrollerId = W.element.data("scrollerId");
                var scroller;
                if (scrollerId) {
                    //There is a scroller
                    scroller = jpvs.find("#" + scrollerId);
                }
                else {
                    //No scroller, let's create one
                    var scrollerContainer = document.createElement("div");
                    W.element.after(scrollerContainer);
                    scroller = jpvs.Scroller.create(scrollerContainer);

                    scrollerId = jpvs.randomString(20);
                    scroller.element.attr("id", scrollerId);
                    W.element.data("scrollerId", scrollerId);

                    //Move the DataGrid inside the scroller
                    scroller.content.append(W.element);

                    //Setup the content area so that it's virtually unlimited and causes no text-wrapping or column-shrinking
                    //To do this, we just set it "wide enough"
                    //The height does not matter much, because the real scrolling only occurs horizontally (vertically, we only
                    //simulate scrolling by moving rows in the DataGrid)
                    scroller.contentSize({ width: "1000%", height: "200%" });

                    //Measure the grid
                    measureMaxGridSize();

                    //Set the scroller bounding box size
                    scroller.objectSize({
                        width: maxGridWidth + scroller.scrollbarW,
                        height: maxGridHeight + scroller.scrollbarH
                    });
                }

                //Bind events
                scroller.change.unbind("DataGrid");
                scroller.change.bind("DataGrid", onScrollChange);

                return scroller;
            }

            function onScrollChange() {
                //Current scroll position
                var scrollPos = this.scrollPosition();

                //Horizontal scrolling: connect scroll position to content position directly, so the horizontal scrollbar immediately
                //moves the grid on the horizontal axis
                //Vertical scrolling: don't move content here because we artificially scroll rows in the DataGrid
                var newHorzPos = scrollPos.left;
                var newVertPos = 0;
                this.contentPosition({ top: newVertPos, left: newHorzPos });

                //Now handle the vertical scrolling by artificially moving rows in the DataGrid
                //measureMaxGridSize();
                var maxST = maxGridHeight / pageSize * totalRecords - maxGridHeight;
                var newScrollPos = Math.min(totalRecords, Math.floor(scrollPos.top / maxST * (totalRecords - pageSize + 5)));

                //Update immediately scrolling the rows to "newScrollPos", even if no data is in cache (in that case,
                //the missing records are rendered by the grid's "emptyRowTemplate")
                updateGrid(newScrollPos);

                //Then, call the datasource and update the rows as soon as they arrive from the datasource, without scrolling
                //(because we already did the scrolling in "updateGrid")
                ensurePageOfDataLoaded(newScrollPos);
            }

            function measureMaxGridSize() {
                var gridSize = {
                    width: W.element.outerWidth(),
                    height: W.element.outerHeight()
                };

                maxGridHeight = Math.max(maxGridHeight, gridSize.height);
                maxGridWidth = Math.max(maxGridWidth, gridSize.width);
            }

            function refreshScroller() {
                if (!scroller)
                    return;

                //Let's adjust the scrollbars to reflect the content (the DataGrid)
                measureMaxGridSize();
                var totalGridHeight = maxGridHeight / pageSize * totalRecords;

                //The scrollable area is as wide as the grid and as high as the total grid height
                scroller.scrollableSize({ width: maxGridWidth, height: totalGridHeight });

                //Set the scroller bounding box size
                scroller.objectSize({
                    width: forcedWidth || (maxGridWidth + scroller.scrollbarW),
                    height: forcedHeight || (maxGridHeight + scroller.scrollbarH)
                });
            }
        }

        return binder;
    };
})();
;


/* Italian initialisation for the jQuery UI date picker plugin. */
/* Written by Antonello Pasella (antonello.pasella@gmail.com). */
jQuery(function ($) {
    $.datepicker.regional['it'] = {
        closeText: 'Chiudi',
        prevText: '&#x3c;Prec',
        nextText: 'Succ&#x3e;',
        currentText: 'Oggi',
        monthNames: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
			'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
        monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
			'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
        dayNames: ['Domenica', 'Luned&#236', 'Marted&#236', 'Mercoled&#236', 'Gioved&#236', 'Venerd&#236', 'Sabato'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'],
        weekHeader: 'Sm',
        dateFormat: 'dd/mm/yy',
        firstDay: 1,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: ''
    };
});


(function () {

    jpvs.DateBox = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.makeWidget({
        widget: jpvs.DateBox,
        type: "DateBox",
        cssClass: "DateBox",

        create: function (container) {
            var obj = document.createElement("input");
            $(obj).attr("type", "text");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            this.element.datepicker({
                onSelect: function (dateText, inst) {
                    return W.change.fire(W);
                }
            });

            this.element.change(function () {
                return W.change.fire(W);
            });

            this.element.datepicker("option", $.datepicker.regional[jpvs.currentLocale()]);

            this.element.datepicker("hide");
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            date: jpvs.property({
                get: function () { return this.element.datepicker("getDate"); },
                set: function (value) { this.element.datepicker("setDate", value); }
            }),

            dateString: jpvs.property({
                get: function () {
                    return format(this.date());
                },
                set: function (value) {
                    this.date(parse(value));
                }
            })
        }
    });

    function format(date) {
        if (!date)
            return "";

        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();

        return pad(y, 4) + pad(m, 2) + pad(d, 2);
    }

    function pad(s, len) {
        s = $.trim(s.toString());
        while (s.length < len)
            s = "0" + s;

        return s;
    }

    function parse(yyyymmdd) {
        yyyymmdd = $.trim(yyyymmdd);

        if (yyyymmdd == "" || yyyymmdd.length != 8)
            return null;

        var y = parseInt(yyyymmdd.substring(0, 4));
        var m = parseInt(yyyymmdd.substring(4, 6));
        var d = parseInt(yyyymmdd.substring(6, 8));

        return new Date(y, m - 1, d);
    }

})();
;


(function () {

    jpvs.DocumentEditor = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.DocumentEditor.allStrings = {
        en: {
            clickToEdit: "Click here to edit",
            clickToEditField: "Click here to edit this field",
            clickToEditHeader: "Click here to edit the header",
            clickToEditFooter: "Click here to edit the footer",
            textEditor: "Text editor",
            fieldEditor: "Field editor",

            sectionOptions: "Options",
            sectionMargins: "Set margins",
            removeSection: "Remove section",
            removeSection_Warning: "The section will be removed. Do you wish to continue?",
            removeSection_Forbidden: "The section may not be removed. There must be at least one section in the document.",

            addSectionBefore: "Insert new section before",
            addSectionAfter: "Insert new section after",

            sortSections: "Reorder sections",
            sortSections_Prompt: "Please reorder the sections of the document by dragging them up and down.",

            invalidValuesFound: "Invalid values found. Please correct and try again.",

            bodyMargins: "Page margins",
            defaultMargin: "Default margin",
            defaultMargin_Notes: "Example: 2.5cm. Used only when any of left/right/bottom/top is missing.",
            topMargin: "Top margin",
            topMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            bottomMargin: "Bottom margin",
            bottomMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            leftMargin: "Left margin",
            leftMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            rightMargin: "Right margin",
            rightMargin_Notes: "Example: 2cm. If missing, the default margin is used.",

            headerMargins: "Header margins and height",
            footerMargins: "Footer margins and height",

            height: "Height",

            error: "Error",
            ok: "OK",
            cancel: "Cancel",
            apply: "Apply",

            oddEven: "Odd/Even pages",
            whichContent: "Which content do you wish to edit?",
            oddPages: "Odd pages",
            evenPages: "Even pages"
        },

        it: {
            clickToEdit: "Clicca qui per modificare",
            clickToEditField: "Clicca qui per modificare il campo",
            clickToEditHeader: "Clicca qui per modificare l'intestazione",
            clickToEditFooter: "Clicca qui per modificare il piè di pagina",
            textEditor: "Modifica testo",
            fieldEditor: "Modifica campo",

            sectionOptions: "Opzioni",
            sectionMargins: "Imposta margini",
            removeSection: "Elimina sezione",
            removeSection_Warning: "Confermi l'eliminazione della sezione?",
            removeSection_Forbidden: "La sezione non può essere rimossa. Il documento deve contenere almeno una sezione.",

            addSectionBefore: "Inserisci sezione prima",
            addSectionAfter: "Inserisci sezione dopo",

            sortSections: "Cambia ordine sezioni",
            sortSections_Prompt: "Riordinare le sezioni trascinandole su e giù.",

            invalidValuesFound: "Trovati valori non validi. Correggere e riprovare.",

            bodyMargins: "Margini pagina",
            defaultMargin: "Margine predefinito",
            defaultMargin_Notes: "Esempio: 2.5cm. Usato solo quando manca almeno uno dei margini sinistro/destro/inferiore/superiore.",
            topMargin: "Margine superiore",
            topMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            bottomMargin: "Margine inferiore",
            bottomMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            leftMargin: "Margine sinistro",
            leftMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            rightMargin: "Margine destro",
            rightMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",

            headerMargins: "Margini ed altezza dell'intestazione",
            footerMargins: "Margini ed altezza del piè di pagina",

            height: "Altezza",

            error: "Errore",
            ok: "OK",
            cancel: "Annulla",
            apply: "Applica",

            oddEven: "Pagine dispari/pari",
            whichContent: "Quale testo si desidera modificare?",
            oddPages: "Pagine dispari",
            evenPages: "Pagine pari"
        }
    };


    jpvs.makeWidget({
        widget: jpvs.DocumentEditor,
        type: "DocumentEditor",
        cssClass: "DocumentEditor",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.DocumentEditor.strings = jpvs.DocumentEditor.allStrings[jpvs.currentLocale()];
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            document: jpvs.property({
                get: function () {
                    return this.element.data("document");
                },
                setTask: function (value) {
                    //Async setter.
                    //The document is saved immediately in zero time
                    this.element.data("document", value);

                    //Let's synchronously/immediately empty the content, so that the user can't interact until the task
                    //has created some of the content. We don't want the user to update things that might be related to the previous
                    //version of the displayed document. As soon as this property setter is invoked, the old version of the document
                    //disappears and can't be interacted with any longer. Then, in background, the new content is displayed and the user
                    //can start interacting with it even if the task is not finished yet. As soon as the first section is displayed, it
                    //is live and this does not interfere with the still-running refreshPreviewTask.
                    this.element.empty()

                    /*
                    Refresh the preview.
                    The preview has clickable parts; the user clicks on a part to edit it
                    */
                    //Let's return the task for updating the preview, so we work in background in case
                    //the document is complex and the UI remains responsive during the operation
                    return refreshPreviewTask(this);
                }
            }),

            fields: jpvs.property({
                get: function () {
                    var doc = this.document();
                    return doc && doc.fields;
                },
                set: function (value) {
                    //Value contains only the fields that we want to change
                    refreshFieldSet(this, value);
                }
            }),

            richTextEditor: jpvs.property({
                get: function () {
                    return this.element.data("richTextEditor");
                },
                set: function (value) {
                    this.element.data("richTextEditor", value);
                }
            }),

            fieldEditor: jpvs.property({
                get: function () {
                    return this.element.data("fieldEditor");
                },
                set: function (value) {
                    this.element.data("fieldEditor", value);
                }
            }),

            fieldDisplayMapper: jpvs.property({
                get: function () {
                    return this.element.data("fieldDisplayMapper");
                },
                set: function (value) {
                    this.element.data("fieldDisplayMapper", value);
                }
            }),

            allowEvenOddHeadersFooters: jpvs.property({
                get: function () {
                    return this.element.data("allowEvenOddHeadersFooters");
                },
                set: function (value) {
                    this.element.data("allowEvenOddHeadersFooters", value);
                }
            })
        }
    });

    function refreshFieldSet(W, fieldChangeSet) {
        var doc = W.document();
        var fields = doc && doc.fields;

        //Refresh all occurrences of the fields; flash those highlighted
        var flashingQueue = $();
        W.element.find("span.Field").each(function () {
            var fld = $(this);

            //Check that this is a field
            var fieldInfo = fld.data("jpvs.DocumentEditor.fieldInfo");
            var thisFieldName = fieldInfo && fieldInfo.fieldName;
            if (thisFieldName) {
                //OK, this is a field
                //Let's see if we have to update it
                var newField = fieldChangeSet[thisFieldName];
                if (newField) {
                    //Yes, we have to update it
                    //Let's update the doc, without highlight
                    fields[thisFieldName] = { value: newField.value };

                    //Let's update the DOM element, optionally mapping the text that we render into the field area
                    //Optionally map the text that will be rendered into the field area
                    var defaultFieldDisplayMapper = function (text) { return text; };
                    var fieldDisplayMapper = W.fieldDisplayMapper() || defaultFieldDisplayMapper;
                    var fieldDisplayedValue = fieldDisplayMapper(newField.value);
                    jpvs.write(fld.empty(), fieldDisplayedValue);

                    //Let's enqueue for flashing, if requested
                    if (newField.highlight)
                        flashingQueue = flashingQueue.add(fld);
                }
            }
        });

        //Finally, flash the marked fields
        if (flashingQueue.length)
            jpvs.flashClass(flashingQueue, "Field-Highlight");
    }

    function refreshPreview(W) {
        //Launch the task synchronously
        var task = refreshPreviewTask(W);
        jpvs.runForegroundTask(task);
    }

    function refreshPreviewSingleSection(W, sectionNum) {
        var fieldHighlightList = getEmptyFieldHighlightList();
        refreshSingleSectionContent(W, sectionNum, fieldHighlightList);
        applyFieldHighlighting(W, fieldHighlightList);
    }

    function refreshPreviewAsync(W) {
        //Launch the task asynchronously
        var task = refreshPreviewTask(W);
        jpvs.runBackgroundTask(task);
    }

    function refreshPreviewTask(W) {
        //Let's return the task function
        //We use "ctx" for storing the local variables.
        return function (ctx) {
            //Init the state machine, starting from 1 (only when null)
            ctx.executionState = ctx.executionState || 1;

            //First part, init some local variables
            if (ctx.executionState == 1) {
                ctx.elem = W.element;
                ctx.doc = W.document();
                ctx.sections = ctx.doc && ctx.doc.sections;
                ctx.fields = ctx.doc && ctx.doc.fields;

                //List of fields that require highlighting (we start with an empty jQuery object that is filled during the rendering phase (writeContent))
                ctx.fieldHighlightList = getEmptyFieldHighlightList();

                //Yield control
                ctx.executionState = 2;
                return { progress: "0%" };
            }

            //Second part, create all blank pages with "loading" animated image
            if (ctx.executionState == 2) {
                //We save all elements by section here:
                ctx.domElems = [];

                //Delete all contents...
                //We already deleted it in the "document" property setter. We do this again, just to be sure that we start this
                //execution state with an empty object
                ctx.elem.empty()

                //Since it's fast, let's create all the blank pages all at a time and only yield at the end
                $.each(ctx.sections, function (sectionNum, section) {
                    //Every section is rendered as a pseudo-page (DIV with class="Section" and position relative (so we can absolutely position header/footer))
                    var sectionElement = jpvs.writeTag(ctx.elem, "div");
                    sectionElement.addClass("Section").css("position", "relative");

                    //Store the sectionNum within the custom data
                    sectionElement.data("jpvs.DocumentEditor.sectionNum", sectionNum);

                    //Apply page margins
                    applySectionPageMargins(sectionElement, section);

                    //Header (absolutely positioned inside the section with margins/height)
                    var headerElement = jpvs.writeTag(sectionElement, "div");
                    headerElement.addClass("Header");
                    applySectionHeaderMargins(headerElement, section);

                    //Footer (absolutely positioned inside the section with margins/height)
                    var footerElement = jpvs.writeTag(sectionElement, "div");
                    footerElement.addClass("Footer");
                    applySectionFooterMargins(footerElement, section);

                    var footerElementInside = jpvs.writeTag(footerElement, "div");
                    footerElementInside.css("position", "absolute");
                    footerElementInside.css("bottom", "0px");
                    footerElementInside.css("left", "0px");
                    footerElementInside.css("right", "0px");

                    //Body
                    var bodyElement = jpvs.writeTag(sectionElement, "div");
                    bodyElement.addClass("Body");
                    jpvs.writeTag(bodyElement, "img").attr("src", jpvs.Resources.images.loading);

                    //Now let's save all DOM elements for the remaining execution states
                    ctx.domElems.push({
                        sectionElement: sectionElement,
                        headerElement: headerElement,
                        bodyElement: bodyElement,
                        footerElementInside: footerElementInside,
                        footerElement: footerElement
                    });

                    //Save also something for later (refreshSingleSectionContent)
                    sectionElement.data("jpvs.DocumentEditor.domElem", {
                        headerElement: headerElement,
                        bodyElement: bodyElement,
                        footerElementInside: footerElementInside,
                        footerElement: footerElement
                    });
                });

                //Yield control
                ctx.executionState = 3;
                return { progress: "1%" };
            }

            //Third part: fill all sections with header/footer/body, one at a time
            if (ctx.executionState == 3) {
                //Loop over all sections one at a time
                if (ctx.sectionNum == null)
                    ctx.sectionNum = 0;
                else
                    ctx.sectionNum++;

                if (ctx.sectionNum >= ctx.sections.length) {
                    //Reset loop conter
                    ctx.sectionNum = null;

                    //Yield control and go to next execution state
                    ctx.executionState = 4;
                    return { progress: "90%" };
                }

                var section = ctx.sections[ctx.sectionNum];
                var domElem = ctx.domElems[ctx.sectionNum];

                //Write content, if any
                refreshSingleSectionContent(W, ctx.sectionNum, ctx.fieldHighlightList);

                //Switch off the highlight flags after rendering
                if (section.header)
                    section.header.highlight = false;
                if (section.body)
                    section.body.highlight = false;
                if (section.footer)
                    section.footer.highlight = false;

                //Yield control without changing execution state
                //Progress from 1 up to 90%
                var progr = 1 + Math.floor(ctx.sectionNum / (ctx.sections.length - 1) * 89);
                return { progress: progr + "%" };
            }

            //Fourth part: create section menus, one at a time
            if (ctx.executionState == 4) {
                //Loop over all sections one at a time
                if (ctx.sectionNum == null)
                    ctx.sectionNum = 0;
                else
                    ctx.sectionNum++;

                if (ctx.sectionNum >= ctx.sections.length) {
                    //Reset loop conter
                    ctx.sectionNum = null;

                    //Yield control and go to next execution state
                    ctx.executionState = 5;
                    return { progress: "99%" };
                }

                var section = ctx.sections[ctx.sectionNum];
                var domElem = ctx.domElems[ctx.sectionNum];

                //Every section has a small, unobtrusive menu
                var menuContainer = jpvs.writeTag(domElem.sectionElement, "div");
                menuContainer.addClass("MenuContainer").css({ position: "absolute", top: "0px", right: "0px", zIndex: (10000 - ctx.sectionNum).toString() });
                writeSectionMenu(W, menuContainer, ctx.sections, ctx.sectionNum, section);

                //Yield control without changing execution state
                //Progress from 90% to 99%
                var progr = 90 + Math.floor(ctx.sectionNum / (ctx.sections.length - 1) * 9);
                return { progress: progr + "%" };
            }

            //Fifth part: apply field highlighting and terminate the task
            if (ctx.executionState == 5) {
                applyFieldHighlighting(W, ctx.fieldHighlightList);

                //End of task
                return false;
            }
        };
    }

    function getEmptyFieldHighlightList() {
        return { list: $() };
    }

    function applySectionPageMargins(sectionElement, section) {
        //Apply page margins to the section (as internal padding, of course)
        var margins = section && section.margins;
        var leftMargin = getMarginProp(margins, "left", "2cm");
        var topMargin = getMarginProp(margins, "top", "2cm");
        var rightMargin = getMarginProp(margins, "right", "2cm");
        var bottomMargin = getMarginProp(margins, "bottom", "2cm");

        sectionElement.css("padding-left", leftMargin);
        sectionElement.css("padding-top", topMargin);
        sectionElement.css("padding-right", rightMargin);
        sectionElement.css("padding-bottom", bottomMargin);
    }

    function applySectionHeaderMargins(headerElement, section) {
        var margins = section && section.margins;
        var leftMargin = getMarginProp(margins, "left", "2cm");
        var rightMargin = getMarginProp(margins, "right", "2cm");

        var headerMargins = section && section.header && section.header.margins;
        var headerTopMargin = getMarginProp(headerMargins, "top", "0.5cm");
        var headerLeftMargin = getMarginProp(headerMargins, "left", leftMargin);
        var headerRightMargin = getMarginProp(headerMargins, "right", rightMargin);
        var headerHeight = (section && section.header && section.header.height) || "1cm";

        headerElement.css("position", "absolute");
        headerElement.css("overflow", "hidden");
        headerElement.css("top", headerTopMargin);
        headerElement.css("left", headerLeftMargin);
        headerElement.css("right", headerRightMargin);
        headerElement.css("height", headerHeight);
    }

    function applySectionFooterMargins(footerElement, section) {
        var margins = section && section.margins;
        var leftMargin = getMarginProp(margins, "left", "2cm");
        var rightMargin = getMarginProp(margins, "right", "2cm");

        var footerMargins = section && section.footer && section.footer.margins;
        var footerBottomMargin = getMarginProp(footerMargins, "bottom", "0.5cm");
        var footerLeftMargin = getMarginProp(footerMargins, "left", leftMargin);
        var footerRightMargin = getMarginProp(footerMargins, "right", rightMargin);
        var footerHeight = (section && section.footer && section.footer.height) || "1cm";

        footerElement.css("position", "absolute");
        footerElement.css("overflow", "hidden");
        footerElement.css("bottom", footerBottomMargin);
        footerElement.css("left", footerLeftMargin);
        footerElement.css("right", footerRightMargin);
        footerElement.css("height", footerHeight);
    }

    function refreshSingleSectionContent(W, sectionNum, fieldHighlightList) {
        var sectionElement = W.element.find("div.Section").eq(sectionNum);
        var domElem = sectionElement.data("jpvs.DocumentEditor.domElem");

        var doc = W.document();
        var sections = doc && doc.sections;
        var fields = doc && doc.fields;
        var section = sections && sections[sectionNum];

        //Refresh margins
        applySectionPageMargins(sectionElement, section);
        applySectionHeaderMargins(domElem.headerElement, section);
        applySectionFooterMargins(domElem.footerElement, section);

        //Refresh content
        writeContent(
            W,
            domElem.headerElement,
            domElem.headerElement,
            section && section.header && section.header.content,
            fields,
            "Header-Hover",
            section && section.header && section.header.highlight ? "Header-Highlight" : "",
            function (x) { section.header = section.header || {}; section.header.content = x; section.header.highlight = true; },
            fieldHighlightList,
            jpvs.DocumentEditor.strings.clickToEditHeader,
            section && section.header && section.header.content_even,
            function (x) { section.header = section.header || {}; section.header.content_even = x; section.header.highlight = true; }
        );

        writeContent(
            W,
            domElem.bodyElement,
            domElem.bodyElement,
            section && section.body && section.body.content,
            fields,
            "Body-Hover",
            section && section.body && section.body.highlight ? "Body-Highlight" : "",
            function (x) { section.body = section.body || {}; section.body.content = x; section.body.highlight = true; },
            fieldHighlightList,
            jpvs.DocumentEditor.strings.clickToEdit,
            null,
            null
        );

        writeContent(
            W,
            domElem.footerElementInside,
            domElem.footerElement,
            section && section.footer && section.footer.content,
            fields,
            "Footer-Hover",
            section && section.footer && section.footer.highlight ? "Footer-Highlight" : "",
            function (x) { section.footer = section.footer || {}; section.footer.content = x; section.footer.highlight = true; },
            fieldHighlightList,
            jpvs.DocumentEditor.strings.clickToEditFooter,
            section && section.footer && section.footer.content_even,
            function (x) { section.footer = section.footer || {}; section.footer.content_even = x; section.footer.highlight = true; }
        );

        //After rendering, turn the highlight flag off
        if (section && section.header && section.header.highlight)
            section.header.highlight = false;

        if (section && section.body && section.body.highlight)
            section.body.highlight = false;

        if (section && section.footer && section.footer.highlight)
            section.footer.highlight = false;
    }

    function applyFieldHighlighting(W, fieldHighlightList) {
        if (fieldHighlightList.list.length) {
            jpvs.flashClass(fieldHighlightList.list, "Field-Highlight");

            //Switch off the field highlight flags after rendering
            var doc = W.document();
            var fields = doc && doc.fields;
            if (fields) {
                $.each(fields, function (i, field) {
                    field.highlight = false;
                });
            }
        }
    }

    function writeSectionMenu(W, container, sections, sectionNum, section) {
        var menu = jpvs.Menu.create(container);
        menu.template(["HorizontalMenuBar", "VerticalMenuBar"]);
        menu.itemTemplate(["HorizontalMenuBarItem", "VerticalMenuBarItem"]);
        menu.menuItems([
            {
                text: "...",
                tooltip: jpvs.DocumentEditor.strings.sectionOptions,
                items: [
                    { text: jpvs.DocumentEditor.strings.sectionMargins, click: onSectionMargins(W, section, sectionNum) },
                    jpvs.Menu.Separator,
                    { text: jpvs.DocumentEditor.strings.addSectionBefore, click: onAddSection(W, sections, sectionNum) },
                    { text: jpvs.DocumentEditor.strings.addSectionAfter, click: onAddSection(W, sections, sectionNum + 1) },
                    { text: jpvs.DocumentEditor.strings.removeSection, click: onRemoveSection(W, sections, sectionNum) },
                    jpvs.Menu.Separator,
                    { text: jpvs.DocumentEditor.strings.sortSections, click: onSortSections(W, sections) }
                ]
            }
        ]);
    }

    function getMarginProp(margins, which, defaultValue) {
        if (margins) {
            //Let's try the "which" margin or, if missing, the "all" margin
            var value = margins[which] || margins.all;
            if (value)
                return value;
        }

        //Value not yet determined, let's apply the default
        return defaultValue;
    }

    function writeContent(W, element, clickableElement, content, fields, hoverCssClass, highlightCssClass, newContentSetterFunc, fieldHighlightList, placeHolderText, evenPagesContent, newEvenPagesContentSetterFunc) {
        var contentToWrite = content;
        if (!content)
            contentToWrite = "";

        //Remove the "loading" image
        element.empty();

        //Get the sectionNum
        var sectionElement = clickableElement.parent();
        var sectionNum = sectionElement.data("jpvs.DocumentEditor.sectionNum");

        //Clean HTML "content" (becomes xhtml)...
        contentToWrite = jpvs.cleanHtml(contentToWrite);

        //Put a placeholder if missing content
        if ($.trim(contentToWrite) == "")
            contentToWrite = placeHolderText;

        //...make the element clickable (click-to-edit)...
        clickableElement.css("cursor", "pointer").attr("title", jpvs.DocumentEditor.strings.clickToEdit).unbind(".writeContent").bind("click.writeContent", function () {
            editContent();
            return false;
        }).bind("mouseenter.writeContent", function () {
            clickableElement.parent().addClass("Section-Hover");
            clickableElement.addClass(hoverCssClass);
        }).bind("mouseleave.writeContent", function () {
            clickableElement.parent().removeClass("Section-Hover");
            clickableElement.removeClass(hoverCssClass);
        });

        //...and render the sanitized XHTML result, making sure fields are clickable too
        var contentAsXml = XmlParser.parseString("<root>" + contentToWrite + "</root>", null, true);
        renderXHtmlWithFields(W, element, contentAsXml, fields, fieldHighlightList);

        //At the end, do a flashing animation if required to do so
        if (highlightCssClass != "")
            jpvs.flashClass(element, highlightCssClass);

        function editContent() {
            if (!newEvenPagesContentSetterFunc || !W.allowEvenOddHeadersFooters()) {
                //Simple case: no evenPagesContent or odd/even header/footer non allowed. We edit the main content.
                editOddContent();
            }
            else {
                //Complex case: odd/even headers/footers are allowed and we have a newEvenPagesContentSetterFunc (i.e.: we are
                //on a header or a footer)
                //We must ask the user what to edit: standard content or even pages content?
                var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.oddEven);
                jpvs.writeln(pop, jpvs.DocumentEditor.strings.whichContent);
                var ul = jpvs.writeTag(pop, "ul");
                var li1 = jpvs.writeTag(ul, "li");
                var li2 = jpvs.writeTag(ul, "li");
                jpvs.LinkButton.create(li1).text(jpvs.DocumentEditor.strings.oddPages).click(combine(onCancel, editOddContent));
                jpvs.LinkButton.create(li2).text(jpvs.DocumentEditor.strings.evenPages).click(combine(onCancel, editEvenContent));

                jpvs.writeButtonBar(pop, [{ text: jpvs.DocumentEditor.strings.cancel, click: onCancel}]);

                pop.show();

                function onCancel() {
                    pop.destroy();
                }

                function combine(f1, f2) {
                    return function () {
                        f1();
                        f2();
                    };
                }
            }
        }

        function editOddContent() {
            onEditFormattedText(W, content, newContentSetterFunc, sectionNum);
        }

        function editEvenContent() {
            onEditFormattedText(W, evenPagesContent, newEvenPagesContentSetterFunc, sectionNum);
        }
    }

    function renderXHtmlWithFields(W, curElem, xmlNode, fields, fieldHighlightList) {
        //Write the xmlNode into curElem. If the xmlNode is TEXT, then make sure ${FIELD} patterns are made clickable
        if (xmlNode.name == "#TEXT") {
            //This is plain text and it can contain ${FIELD} patterns that must be made clickable
            renderTextWithFields(W, curElem, xmlNode.value || "", fields, fieldHighlightList);
        }
        else if (xmlNode.name == "#COMMENT") {
            //This is a comment. Render it unaltered. If the comment contains "pagebreak", then render as <hr/>
            //(The TinyMCE editor treats pagebreaks as special "<!-- pagebreak -->" comments
            var commentText = xmlNode.value || "";
            if (commentText.indexOf("pagebreak") < 0) {
                var comment = document.createComment(xmlNode.value || "");
                curElem.append(comment);
            }
            else {
                //Special "pagebreak" comment. Make it visible.
                jpvs.writeTag(curElem, "hr");
            }
        }
        else if (xmlNode.name == "root") {
            //This is the dummy root node. Let's just write the content, recursively
            if (xmlNode.children) {
                $.each(xmlNode.children, function (i, childNode) {
                    renderXHtmlWithFields(W, curElem, childNode, fields, fieldHighlightList);
                });
            }
        }
        else {
            //This is a normal element. Let's write it, along with attributes and content
            var tagName = xmlNode.name;
            var newElem = jpvs.writeTag(curElem, tagName);

            //Apply attributes
            if (xmlNode.attributes) {
                $.each(xmlNode.attributes, function (attrName, attrValue) {
                    newElem.attr(attrName, attrValue);
                });
            }

            //Apply content recursively
            if (xmlNode.children) {
                $.each(xmlNode.children, function (i, childNode) {
                    renderXHtmlWithFields(W, newElem, childNode, fields, fieldHighlightList);
                });

                /*
                At the end of a "p" paragraph, we write a <br/> so we are sure that an empty paragraph is rendered
                as a blank line, while a non-empty paragraph is rendered as usual (because a <br/> at the end of a paragraph
                has non effects).
                */
                if (tagName == "p")
                    jpvs.writeTag(newElem, "br");
            }
        }
    }

    function renderTextWithFields(W, curElem, text, fields, fieldHighlightList) {
        //Look for ${FIELD} patterns and replace them with a clickable object
        var pattern = /\$\{(.*?)\}/g;
        var lastWrittenIndex = 0;
        for (var match = pattern.exec(text); match != null; match = pattern.exec(text)) {
            //Match found: analyze it
            var matchedString = match[0];
            var fieldName = match[1];
            var endIndex = pattern.lastIndex;
            var startIndex = endIndex - matchedString.length;

            //Now write the plain text between lastWrittenIndex and startIndex...
            var textBefore = text.substring(lastWrittenIndex, startIndex)
            renderText(curElem, textBefore);

            //Then render the clickable field...
            renderField(W, curElem, fields, fieldName, fieldHighlightList);

            //Then update the lastWrittenIndex
            lastWrittenIndex = endIndex;
        }

        //At the end, there is still the ending text missing
        var endingText = text.substring(lastWrittenIndex);
        renderText(curElem, endingText);
    }

    var entitiesToReplace = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": "\"",
        "&apos;": "'"
    };

    function renderText(curElem, text) {
        //Renders the text and replaces a few entities
        var text2 = text;
        $.each(entitiesToReplace, function (entity, replacedText) {
            text2 = text2.replace(entity, replacedText);
        });

        jpvs.write(curElem, text2);
    }

    function renderField(W, curElem, fields, fieldName, fieldHighlightList) {
        //Get info about the field
        var field = fields && fields[fieldName];
        var fieldValue = field && field.value;
        var fieldHighlighted = field && field.highlight;

        //Optionally map the text that will be rendered into the field area
        var defaultFieldDisplayMapper = function (text) { return text; };
        var fieldDisplayMapper = W.fieldDisplayMapper() || defaultFieldDisplayMapper;
        fieldValue = fieldDisplayMapper(fieldValue);

        //If empty, render a placeholder text instead
        if ($.trim(fieldValue) == "")
            fieldValue = jpvs.DocumentEditor.strings.clickToEditField;

        //Render the clickable thing
        var span = jpvs.writeTag(curElem, "span", fieldValue);
        span.addClass("Field").attr("title", jpvs.DocumentEditor.strings.clickToEditField).click(function () {
            onEditField(W, fields, fieldName);
            return false;
        }).hover(function () {
            span.addClass("Field-Hover");
        },
        function () {
            span.removeClass("Field-Hover");
        });

        //Mark as field also internally for security purposes
        //So if some span exists with class="Field" we don't get tricked into thinking it's a field
        span.data("jpvs.DocumentEditor.fieldInfo", {
            fieldName: fieldName
        });

        //Update the jQuery object with the list of all fields to be highlighted
        if (fieldHighlighted)
            fieldHighlightList.list = fieldHighlightList.list.add(span);
    }

    function onEditFormattedText(W, content, newContentSetterFunc, sectionNum) {
        //Let's use the formatted text editor supplied by the user in the richTextEditor property
        //Use a default one if none is set
        var rte = W.richTextEditor() || getDefaultEditor();

        //The richTextEditor gives us an object that defines how to edit rich text
        rte.editText.call(rte, content, onDone);

        function onDone(newContent) {
            //We have the new content. All we need to do is update the W.document property and refresh
            //We use the new content setter provided
            if (newContent !== undefined && newContent != content) {
                newContentSetterFunc(newContent);
                refreshPreviewSingleSection(W, sectionNum);

                //Fire the change event
                W.change.fire(W);
            }
        }
    }

    function onEditField(W, fields, fieldName) {
        //Let's use the field editor supplied by the user in the fieldEditor property
        //Use a default one if none is set
        var fe = W.fieldEditor() || getDefaultFieldEditor();

        //The fieldEditor gives us an object that defines how to edit fields
        var field = fields && fields[fieldName];
        var oldFieldValue = field && field.value;

        fe.editField.call(fe, fields, fieldName, onDone);

        function onDone(newFieldValue) {
            //We have the new field value. All we need to do is update the field and refresh and highlight
            if (newFieldValue !== undefined && newFieldValue != oldFieldValue) {
                //Field changed. Let's update with highlight
                //We use a change set with a single field
                var fieldChangeSet = {};
                fieldChangeSet[fieldName] = { value: newFieldValue, highlight: true };
                refreshFieldSet(W, fieldChangeSet);

                //Fire the change event
                W.change.fire(W);
            }
        }
    }

    function onSectionMargins(W, section, sectionNum) {
        return function () {
            //Open popup for editing margins
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.sectionMargins).close(function () { this.destroy(); });

            //Ensure missing properties are present, so we can read/write margins
            section.margins = section.margins || {};

            section.header = section.header || {};
            section.header.margins = section.header.margins || {};

            section.footer = section.footer || {};
            section.footer.margins = section.footer.margins || {};

            //Create fields
            var tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.bodyMargins);
            var txtAll = writeTextBox(tbl, "defaultMargin", section.margins.all);
            var txtTop = writeTextBox(tbl, "topMargin", section.margins.top);
            var txtBot = writeTextBox(tbl, "bottomMargin", section.margins.bottom);
            var txtLft = writeTextBox(tbl, "leftMargin", section.margins.left);
            var txtRgt = writeTextBox(tbl, "rightMargin", section.margins.right);

            tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.headerMargins);
            var txtHdrAll = writeTextBox(tbl, "defaultMargin", section.header.margins.all);
            var txtHdrTop = writeTextBox(tbl, "topMargin", section.header.margins.top);
            var txtHdrLft = writeTextBox(tbl, "leftMargin", section.header.margins.left);
            var txtHdrRgt = writeTextBox(tbl, "rightMargin", section.header.margins.right);
            var txtHdrHgt = writeTextBox(tbl, "height", section.header.height);

            tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.footerMargins);
            var txtFtrAll = writeTextBox(tbl, "defaultMargin", section.footer.margins.all);
            var txtFtrBot = writeTextBox(tbl, "bottomMargin", section.footer.margins.bottom);
            var txtFtrLft = writeTextBox(tbl, "leftMargin", section.footer.margins.left);
            var txtFtrRgt = writeTextBox(tbl, "rightMargin", section.footer.margins.right);
            var txtFtrHgt = writeTextBox(tbl, "height", section.footer.height);

            //Button bar
            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.apply, click: onApply },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show();

            function checkValues(list) {
                if (!list)
                    return checkValues([
                        txtAll, txtTop, txtBot, txtLft, txtRgt,
                        txtHdrAll, txtHdrTop, txtHdrLft, txtHdrRgt, txtHdrHgt,
                        txtFtrAll, txtFtrBot, txtFtrLft, txtFtrRgt, txtFtrHgt
                    ]);

                var error = false;
                var invalids = [];

                for (var i = 0; i < list.length; i++) {
                    var txt = list[i];
                    txt.removeState(jpvs.states.ERROR);
                    var val = readMarginTextBox(list[i]);
                    if (val === undefined) {
                        //Invalid value
                        txt.addState(jpvs.states.ERROR);
                        invalids.push(txt);
                        error = true;
                    }
                }
                if (error) {
                    //Notify the user and set focus on first invalid value
                    jpvs.alert(jpvs.DocumentEditor.strings.error, jpvs.DocumentEditor.strings.invalidValuesFound, invalids[0]);
                }

                return !error;
            }

            function onOK() {
                if (!checkValues())
                    return;

                pop.hide(function () {
                    //At the end of the animation, apply and destroy
                    onApply();
                    pop.destroy();
                });
            }

            function onApply() {
                if (!checkValues())
                    return;

                //Read all
                section.margins.all = readMarginTextBox(txtAll);
                section.margins.top = readMarginTextBox(txtTop);
                section.margins.bottom = readMarginTextBox(txtBot);
                section.margins.left = readMarginTextBox(txtLft);
                section.margins.right = readMarginTextBox(txtRgt);

                section.header.margins.all = readMarginTextBox(txtHdrAll);
                section.header.margins.top = readMarginTextBox(txtHdrTop);
                section.header.margins.left = readMarginTextBox(txtHdrLft);
                section.header.margins.right = readMarginTextBox(txtHdrRgt);
                section.header.height = readMarginTextBox(txtHdrHgt);

                section.footer.margins.all = readMarginTextBox(txtFtrAll);
                section.footer.margins.bottom = readMarginTextBox(txtFtrBot);
                section.footer.margins.left = readMarginTextBox(txtFtrLft);
                section.footer.margins.right = readMarginTextBox(txtFtrRgt);
                section.footer.height = readMarginTextBox(txtFtrHgt);

                //Update the preview
                refreshPreviewSingleSection(W, sectionNum);

                //Fire the change event
                W.change.fire(W);
            }

            function onCancel() {
                pop.destroy();
            }

        };

        function readMarginTextBox(txt) {
            //Strip all spaces
            var val = $.trim(txt.text().replace(" ", ""));

            //If missing, return null
            if (val == "")
                return null;

            //If invalid, return undefined
            var pattern = /^\+?[0-9]{1,2}(\.[0-9]{1,3})?(cm)?$/gi;
            if (!pattern.test(val))
                return undefined;

            //Append "cm" if missing unit
            if (val.indexOf("cm") < 0)
                val = val + "cm";

            txt.text(val);

            return val;
        }

        function writeTextBox(tbl, label, value) {
            var row = tbl.writeRow();
            row.writeCell(jpvs.DocumentEditor.strings[label]);
            var txt = jpvs.TextBox.create(row.writeCell());
            txt.text(value);

            var notes = jpvs.DocumentEditor.strings[label + "_Notes"];
            if (notes)
                row.writeCell(notes);

            return txt;
        }
    }

    function onAddSection(W, sections, newSectionNum) {
        return function () {
            //New empty section
            var newSection = {
                margins: {
                },
                header: {
                    margins: {}
                },
                footer: {
                    margins: {}
                },
                body: {
                    highlight: true
                }
            };

            //Add at specified index and refresh
            if (newSectionNum >= sections.length)
                sections.push(newSection);
            else
                sections.splice(newSectionNum, 0, newSection);

            refreshPreviewAsync(W);

            //Fire the change event
            W.change.fire(W);
        };
    }

    function onRemoveSection(W, sections, sectionNum) {
        return function () {
            if (sections.length < 2) {
                jpvs.alert(jpvs.DocumentEditor.strings.error, jpvs.DocumentEditor.strings.removeSection_Forbidden);
                return;
            }

            jpvs.confirm(jpvs.DocumentEditor.strings.removeSection, jpvs.DocumentEditor.strings.removeSection_Warning, onYes);
        };

        function onYes() {
            //Remove the section and refresh
            sections.splice(sectionNum, 1);
            refreshPreviewAsync(W);

            //Fire the change event
            W.change.fire(W);
        }
    }

    function onSortSections(W, sections) {
        return function () {
            //Open popup for sorting sections
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.sortSections).close(function () { this.destroy(); });

            jpvs.writeln(pop, jpvs.DocumentEditor.strings.sortSections_Prompt);
            jpvs.writeTag(pop, "hr");

            //Grid with list of sections
            var grid = jpvs.DataGrid.create(pop);
            grid.template([
                colSectionSorter,
                colSectionText
            ]);

            grid.dataBind(sections);

            //Make it sortable
            grid.element.sortable({ items: "tbody > tr" });

            jpvs.writeTag(pop, "hr");

            //Button bar
            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.apply, click: onApply },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show();

            function colSectionSorter(section) {
                jpvs.writeTag(this, "img").attr("src", jpvs.Resources.images.moveButton);
                this.parent().css("cursor", "move").data("section", section);
            }

            function colSectionText(section) {
                jpvs.write(this, trunc(jpvs.stripHtml(section && section.body && section.body.content)));

                function trunc(x) {
                    if (x.length > 150)
                        return x.substring(0, 147) + "...";
                    else
                        return x;
                }
            }

            function onOK() {
                pop.hide(function () {
                    //At the end of the animation, apply and destroy
                    onApply();
                    pop.destroy();
                });
            }

            function onApply() {
                //Apply the new order
                var trs = grid.element.find("tbody > tr");

                //Empty the array...
                sections.splice(0, sections.length);

                //...and put the items back (in the correct order (they are saved in the TR's data)
                trs.each(function () {
                    var section = $(this).data("section");
                    sections.push(section);
                });

                //Update the preview
                refreshPreviewAsync(W);

                //Fire the change event
                W.change.fire(W);
            }

            function onCancel() {
                pop.destroy();
            }

        };
    }

    /*
    Here's a trivial default editor, merely intended for testing purposes or for very simple scenarios
    */
    function getDefaultEditor() {

        function editText(content, onDone) {
            //Create a popup with a simple textarea
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.textEditor).close(function () { this.destroy(); });
            var tb = jpvs.MultiLineTextBox.create(pop);
            tb.text(content);
            tb.element.attr({ rows: 10, cols: 50 });

            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show(function () { tb.focus(); });

            function onOK() {
                pop.hide(function () {
                    //At the end of the hiding animations, call the onDone function and destroy the popup
                    onDone(tb.text());
                    pop.destroy();
                });
            }

            function onCancel() {
                pop.destroy();
                onDone();
            }
        }

        //Let's return the object interface
        return {
            editText: editText
        };
    }

    /*
    Here's a trivial default field editor, merely intended for testing purposes or for very simple scenarios
    */
    function getDefaultFieldEditor() {

        function editField(fields, fieldName, onDone) {
            //Create a popup with a simple textbox
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.fieldEditor).close(function () { this.destroy(); });
            var tb = jpvs.TextBox.create(pop);

            var field = fields && fields[fieldName];
            var fieldValue = field && field.value;

            tb.text(fieldValue || "");

            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show(function () { tb.focus(); });

            function onOK() {
                pop.hide(function () {
                    //At the end of the hiding animations, call the onDone function and destroy the popup
                    onDone(tb.text());
                    pop.destroy();
                });
            }

            function onCancel() {
                pop.destroy();
                onDone();
            }
        }

        //Let's return the object interface
        return {
            editField: editField
        };
    }

})();
;


jpvs.DropDownList = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DropDownList,
    type: "DropDownList",
    cssClass: "DropDownList",

    create: function (container) {
        var obj = document.createElement("select");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("select");
    },

    prototype: {
        clearItems: function () {
            this.element.empty();
            return this;
        },

        addItem: function (value, text) {
            var V = value;
            var T = text != null ? text : value;

            if (V != null & T != null) {
                var opt = document.createElement("option");
                $(opt).attr("value", V).text(T).appendTo(this.element);
            }

            return this;
        },

        addItems: function (items) {
            var W = this;
            $.each(items, function (i, item) {
                if (item != null) {
                    if (item.value != null)
                        W.addItem(item.value, item.text);
                    else
                        W.addItem(item);
                }
            });

            return this;
        },

        count: function () {
            return this.element.find("option").length;
        },

        selectedValue: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        })
    }
});

;


(function () {

    jpvs.FileBox = function (selector) {
        this.attach(selector);

        this.fileselected = jpvs.event(this);
        this.filedeleted = jpvs.event(this);
    };

    jpvs.FileBox.allStrings = {
        en: {
            show: "Show",
            select: "Select...",
            remove: "Remove"
        },

        it: {
            show: "Visualizza",
            select: "Seleziona...",
            remove: "Rimuovi"
        }
    };

    jpvs.makeWidget({
        widget: jpvs.FileBox,
        type: "FileBox",
        cssClass: "FileBox",

        create: function (container) {
            var obj = document.createElement("span");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.FileBox.strings = jpvs.FileBox.allStrings[jpvs.currentLocale()];

            //Hidden file input element
            recreateOrResetInput(this);

            //Label with icon and text
            this.lbl = jpvs.writeTag(this.element, "label").click(onShow(W));
            jpvs.writeTag(this.lbl, "img").addClass("Icon");
            jpvs.writeTag(this.lbl, "span").addClass("Text");

            //Link buttons: Select/Remove
            this.lnkSelect = jpvs.LinkButton.create(this.element).text(jpvs.FileBox.strings.select).click(onSelect(W));
            this.lnkRemove = jpvs.LinkButton.create(this.element).text(jpvs.FileBox.strings.remove).click(onRemove(W));

            //Refresh state
            refresh(W);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            enabled: jpvs.property({
                get: function () {
                    return this.element.data("enabled") !== false;    //Default is true
                },
                set: function (value) {
                    this.element.data("enabled", value);
                    refresh(this);
                }
            }),

            file: jpvs.property({
                get: function () {
                    return this.element.data("file");
                },
                set: function (value) {
                    this.element.data("file", value);
                    refresh(this);
                }
            }),

            postFile: function (url, callback) {
                post(this, url, callback);
            }
        }
    });

    function recreateOrResetInput(W) {
        //Remove the <input type="file"> and recreate it, so we actually reset its selection
        if (W.inputFileElement)
            W.inputFileElement.remove();

        var input = document.createElement("input");
        $(input).attr("type", "file");
        W.element.append(input);

        W.inputFileElement = $(input).change(onSelected(W)).hide();
    }

    function refresh(W) {
        var file = W.file();
        if (W.posting) {
            //Post in progress
            W.lbl.show();
            W.lbl.find(".Icon").show().attr("src", jpvs.Resources.images.loading);
            W.lbl.find(".Text").show().text(W.progress);

            //Show/hide link buttons as appropriate
            W.lnkSelect.element.hide();
            W.lnkRemove.element.hide();
        }
        else if (file) {
            //File present
            W.lbl.show();

            //Write icon, if present
            if (file.icon)
                W.lbl.find(".Icon").show().attr("src", file.icon);
            else
                W.lbl.find(".Icon").hide();

            //Write file label, if present
            if (file.label)
                W.lbl.find(".Text").show().text(file.label);
            else
                W.lbl.find(".Text").hide();

            //Show/hide link buttons as appropriate
            W.lnkSelect.element.show();
            W.lnkRemove.element.show();
        }
        else {
            //No file
            W.lbl.hide();

            //Show/hide link buttons as appropriate
            W.lnkSelect.element.show();
            W.lnkRemove.element.hide();
        }

        //If disabled, hide the two buttons anyway
        if (!W.enabled()) {
            W.lnkSelect.element.hide();
            W.lnkRemove.element.hide();
        }
    }

    function onShow(W) {
        return function () {
            var file = W.file();
            if (file && file.url)
                window.open(file.url);
        };
    }

    function onSelect(W) {
        return function () {
            $(W.inputFileElement).click();
        };
    }

    function onSelected(W) {
        return function () {
            //Let's fire the "fileselected" event with the File API File object
            var file = $(W.inputFileElement)[0].files[0];
            W.fileselected.fire(W, null, file);
        };
    }

    function onRemove(W) {
        return function () {
            W.file(null);
            recreateOrResetInput(W);

            //Let's fire the "filedeleted" event
            W.filedeleted.fire(W);
        };
    }
    function post(W, url, callback) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                W.posting = false;
                refresh(W);

                if (callback)
                    callback(xhr.responseText);
            }
        };

        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                var percentage = Math.round((e.loaded * 100) / e.total);
                W.progress = percentage + "%";
                refresh(W);
            }
        };

        //Send
        W.posting = true;
        W.progress = "0%";
        refresh(W);

        var file = $(W.inputFileElement)[0].files && $(W.inputFileElement)[0].files[0];

        if (file) {
            //If a file is selected, then post it
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.setRequestHeader("FileName", file.name);
            xhr.send(file);
        }
        else {
            //If no file is selected (for example after using the "remove" button), then post a NULL file (with a special header)
            xhr.open("POST", url);
            xhr.setRequestHeader("FileNull", "true");
            xhr.send();
        }
    }


})();
;


jpvs.ImageButton = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.ImageButton,
    type: "ImageButton",
    cssClass: "ImageButton",

    create: function (container) {
        var obj = document.createElement("img");
		$(obj).attr("src", jpvs.Resources.images.empty16x16);		//IE8 bug: empty "src" triggers pointless request to server
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        //Image urls
        var normal = this.element.attr("src");
        var hover = this.element.data("jpvsHover");
        this.imageUrls({
            normal: normal,
            hover: hover
        });

        //Hovering effect
        this.element.hover(
            function () {
                W.element.attr("src", W.getHoverImage());
            },
            function () {
                W.element.attr("src", W.getNormalImage());
            }
        );

        //Click
        this.element.click(function () {
            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        //No autoattach
        return false;
    },

    prototype: {
        imageUrls: jpvs.property({
            get: function () {
                return this.element.data("images");
            },
            set: function (value) {
                this.element.data("images", value);
                this.element.attr("src", this.getNormalImage());
            }
        }),

        getNormalImage: function () {
            var urls = this.imageUrls();
            if (urls) {
                if (typeof (urls) == "string")
                    return urls;
                else
                    return urls.normal || "";
            }

            return "";
        },

        getHoverImage: function () {
            var urls = this.imageUrls();
            if (urls) {
                if (typeof (urls) == "string")
                    return urls;
                else
                    return urls.hover || urls.normal || "";
            }

            return "";
        }
    }
});

;


jpvs.LinkButton = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.LinkButton,
    type: "LinkButton",
    cssClass: "LinkButton",

    create: function (container) {
        var obj = document.createElement("a");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        W.element.attr("href", "#");
        this.element.click(function (e) {
            //Prevent the link from being navigated to
            e.preventDefault();

            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        //By default, we don't want to automatically attach a LinkButton widget to an "A" element, because
        //we cannot determine if it is used as a button or as a hyperlink
        return false;
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        })
    }
});

;


(function () {

    //Keep track of all menus
    var allMenus = {};

    //Attach global events for handling menus
    $(document).ready(function () {
        try {
            $(document).on("mouseover.jpvsMenu", ".Menu .Item", onItemMouseOver);
            $(document).on("mouseout.jpvsMenu", ".Menu .Item", onItemMouseOut);
            $(document).on("click.jpvsMenu", onGlobalClick);
        }
        catch (e) {
        }
    });


    //Menu object
    jpvs.Menu = function (selector) {
        this.attach(selector);

        this.click = jpvs.event(this);
    };

    //Special menu item: separator. Usually rendered as a line.
    jpvs.Menu.Separator = {};


    /*
    The MenuElement object is a special object that must be returned by the menu template functions.
    It allows the Menu object to show/hide all the menu levels.
    */
    jpvs.Menu.MenuElement = function (element, menuItems, level, isPopup, childrenAlignment) {
        this.element = element;
        this.menuItems = menuItems;
        this.level = level;
        this.isPopup = isPopup;
        this.childrenAlignment = childrenAlignment;

        this.itemElements = element.find(".Item");

        //This member is loaded just after the rendering function finishes
        this.parentElement = null;
    };

    jpvs.Menu.MenuElement.prototype.show = function () {
        //When showing a "MenuElement", first make sure all other non-root menus of all menus are hidden
        $.each(allMenus, function (i, menu) {
            closeAllNonRoot(menu);
        });

        //Then show this "MenuElement", its parent, ..., up to the root element
        var allLine = [];
        for (var x = this; x != null; x = x.parentElement)
            allLine.unshift(x);

        //allLine has all the MenuElements that we must show
        for (var i = 0; i < allLine.length; i++) {
            var me = allLine[i];
            me.element.show();

            if (me.isPopup && me.parentElement) {
                //A popup menu must appear close to the parent menu item, if any
                var parentElement = me.parentElement;

                //Find the item (in the parent menu element) that has "me" as submenu
                var parentMenuItem = findParentItem(parentElement, me);

                //Determine the coordinates and show
                var box = getBox(parentMenuItem);
                var coords = getPopupCoords(box, parentElement.childrenAlignment);

                me.element.css({
                    position: "absolute",
                    left: coords.x + "px",
                    top: coords.y + "px"
                });

                //Then fit in visible area
                jpvs.fitInWindow(me.element);
            }
        }

        function findParentItem(parentElement, menuElement) {
            for (var i = 0; i < parentElement.itemElements.length; i++) {
                var itemElement = $(parentElement.itemElements[i]);
                var subMenu = itemElement.data("subMenu");

                //If this item's submenu is the menuElement, we have found the parent menu item of the "menuElement"
                if (subMenu === menuElement)
                    return itemElement;
            }
        }

        function getBox(elem) {
            var pos = elem.offset();
            var w = elem.outerWidth();
            var h = elem.outerHeight();

            return { x: pos.left, y: pos.top, w: w, h: h };
        }

        function getPopupCoords(box, align) {
            if (align == "right")
                return { x: box.x + box.w, y: box.y };
            else if (align == "bottom")
                return { x: box.x, y: box.y + box.h };
            else
                return box;
        }
    };

    jpvs.Menu.MenuElement.prototype.hide = function () {
        this.element.hide();
    };

    jpvs.Menu.MenuElement.prototype.hideIfNonRoot = function () {
        if (this.level != 0)
            this.element.hide();
    };

    jpvs.Menu.MenuElement.prototype.getChildren = function () {
        //Each itemElement may have an associated submenu
        var subMenus = [];
        $.each(this.itemElements, function (i, itemElem) {
            //It may also be null/undefined if this menu item has no submenu
            var subMenu = $(itemElem).data("subMenu");
            subMenus.push(subMenu);
        });

        return subMenus;
    };



    /*
    Standard menu templates
    */
    jpvs.Menu.Templates = {

        HorizontalMenuBar: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A horizontal menu bar is a horizontal table of items.
            Each menu item is a TD.
            */
            var tbl = jpvs.Table.create(this).addClass("HorizontalMenuBar").addClass("HorizontalMenuBar-Level" + level);
            var row = tbl.writeBodyRow();

            $.each(menuItems, function (i, item) {
                var cell = row.writeCell().addClass("Item");

                //Write the menu item using the menu item template
                jpvs.applyTemplate(cell, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, false, "bottom");
        },

        VerticalMenuBar: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A vertical menu bar is a vertical table of items.
            Each menu item is a TR.
            */
            var tbl = jpvs.Table.create(this).addClass("VerticalMenuBar").addClass("VerticalMenuBar-Level" + level);

            $.each(menuItems, function (i, item) {
                var row = tbl.writeBodyRow();
                row.element.addClass("Item");

                //Write the menu item using the menu item template
                jpvs.applyTemplate(row, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, false, "right");
        },

        PopupMenu: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A popup menu is a vertical table of items.
            Each menu item is a TR.
            */
            var tbl = jpvs.Table.create(this).addClass("PopupMenu").addClass("PopupMenu-Level" + level);

            $.each(menuItems, function (i, item) {
                var row = tbl.writeBodyRow();
                row.element.addClass("Item");

                //Write the menu item using the menu item template
                jpvs.applyTemplate(row, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, true, "right");
        }

    };


    /*
    Standard menu item templates
    */
    jpvs.Menu.ItemTemplates = {

        HorizontalMenuBarItem: function (menuItem) {
            //In the HorizontalMenuBar, "this" is a TD
            if (menuItem === jpvs.Menu.Separator) {
                //Separator
                this.addClass("Separator");
                jpvs.write(this, "|");
            }
            else {
                //Normal item
                jpvs.write(this, menuItem && menuItem.text);

                if (menuItem && menuItem.tooltip)
                    this.attr("title", menuItem.tooltip);
            }
        },

        VerticalMenuBarItem: function (menuItem) {
            //In the VerticalMenuBar, "this" is a TR
            //Render as a PopupMenuItem
            jpvs.Menu.ItemTemplates.PopupMenuItem.call(this, menuItem);
        },

        PopupMenuItem: function (menuItem) {
            //In the PopupMenu, "this" is a TR
            if (menuItem === jpvs.Menu.Separator) {
                //Separator
                this.addClass("Separator");
                var td = jpvs.writeTag(this, "td").attr("colspan", 3);
                jpvs.writeTag(td, "hr");
            }
            else {
                //Normal item: 3 cells (icon, text, submenu arrow)
                var td1 = jpvs.writeTag(this, "td").addClass("Icon");
                var td2 = jpvs.writeTag(this, "td", menuItem && menuItem.text).addClass("Text");
                var td3 = jpvs.writeTag(this, "td").addClass("SubMenu");


                if (menuItem && menuItem.tooltip)
                    td2.attr("title", menuItem.tooltip);

                if (menuItem && menuItem.icon) {
                    var icon = jpvs.writeTag(td1, "img");
                    icon.attr("src", menuItem.icon);
                }

                if (menuItem && menuItem.items && menuItem.items.length) {
                    var arrow = jpvs.writeTag(td3, "img");
                    arrow.attr("src", jpvs.Resources.images.subMenuMarker);
                }
            }
        }

    };

    //Defaults
    jpvs.Menu.Templates.Default_Level0 = jpvs.Menu.Templates.HorizontalMenuBar;
    jpvs.Menu.Templates.Default_OtherLevels = jpvs.Menu.Templates.PopupMenu;

    jpvs.Menu.ItemTemplates.Default_Level0 = jpvs.Menu.ItemTemplates.HorizontalMenuBarItem;
    jpvs.Menu.ItemTemplates.Default_OtherLevels = jpvs.Menu.ItemTemplates.PopupMenuItem;


    //Widget definition
    jpvs.makeWidget({
        widget: jpvs.Menu,
        type: "Menu",
        cssClass: "Menu",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //There can be a content. Let's try to interpret it as a menu, using common-sense
            //semantic-like interpretation
            var menuItems = parseContent(this.element);

            //Then, let's empty the element...
            this.element.empty();

            //...and recreate the content
            this.menuItems(menuItems);

            //Register the menu
            this.ensureId();
            allMenus[this.id()] = this;
        },

        canAttachTo: function (obj) {
            //No autoattach
            return false;
        },

        prototype: {
            template: templateProperty("jpvsTemplate"),

            itemTemplate: templateProperty("jpvsItemTemplate"),

            menuItems: jpvs.property({
                get: function () {
                    return this.element.data("menuItems");
                },
                set: function (value) {
                    this.element.data("menuItems", value);
                    renderMenu(this, value);
                }
            })
        }
    });

    /*
    jpvs.property that stores a menu template or menu item template in this.element.data(dataName)
    */
    function templateProperty(dataName) {
        return jpvs.property({
            get: function () {
                var template = this.element.data(dataName);
                if (!template)
                    return [];

                if (typeof (template) == "string") {
                    //Split into substrings
                    var tpl = template.split(",");
                    return tpl;
                }
                else
                    return template;
            },
            set: function (value) {
                this.element.data(dataName, value);
            }
        })
    }

    function parseContent(elem) {
        //Parses the element recursively and fills a menu items tree
        var menuItems = [];
        process(elem, null, menuItems);

        //After filling the tree, process it recursively and replace items with no text and no subitems
        //with a jpvs.Menu.Separator
        lookForSeparators(menuItems);

        //Finally, return the menu items tree
        return menuItems;

        function process(curElem, curItem, curLevel) {
            //Look for menu items in curElem. Loop over children and see if anything can be considered a menu item
            var children = $(curElem).contents();
            children.each(function () {
                var child = this;
                var $child = $(this);

                if (child.nodeType == 3) {
                    //Child is a text node. We consider it part of the current item text
                    if (curItem)
                        curItem.text = concatTextNode(curItem.text, $child.text());
                }
                else if (child.nodeType == 1) {
                    //Child is an element. Let's see what type
                    var nodeName = child.nodeName.toLowerCase();
                    if (nodeName == "ul" || nodeName == "ol") {
                        //Child represents a list of items. Let's just go down the hierarchy as if this ul/ol didn't exist
                        process(child, null, curLevel);
                    }
                    else if (nodeName == "a") {
                        //Child is a link. We consider it part of the current item text and we take the href also
                        if (curItem) {
                            curItem.text = concatTextNode(curItem.text, $child.text());
                            curItem.href = $child.attr("href");
                        }
                    }
                    else if (nodeName == "button") {
                        //Child is a button. We consider it part of the current item text and we take the onclick also
                        if (curItem) {
                            curItem.text = concatTextNode(curItem.text, $child.text());
                            curItem.click = child.onclick;
                        }
                    }
                    else {
                        //Child is something else (div or li or anything)
                        //This marks the beginning of a new menu item. We get it and go down the hierarchy looking for
                        //the menu item textual content and the child items
                        var parkedItem = curItem;
                        curItem = { text: "", items: [] };
                        curLevel.push(curItem);
                        process(child, curItem, curItem.items);

                        //End of the newly created and processed item, go back to previous
                        curItem = parkedItem;
                    }
                }
            });
        }

        function lookForSeparators(menuItems) {
            if (!menuItems)
                return;

            for (var i = 0; i < menuItems.length; i++) {
                var item = menuItems[i];
                var hasText = (item.text != null && $.trim(item.text) != "");
                var hasChildren = (item.items != null && item.items.length != 0);

                if (!hasText && !hasChildren)
                    menuItems[i] = jpvs.Menu.Separator;

                //If has children, do the same on them
                lookForSeparators(item.items);
            }
        }

        function concatTextNode(text, textToAdd) {
            text = $.trim(text) + " " + $.trim(textToAdd);
            return $.trim(text);
        }
    }

    function renderMenu(W, menuItems) {
        //Empty everything
        W.element.empty();

        //Now recreate the items according to the template
        var template = W.template();
        var itemTemplate = W.itemTemplate();

        //template[0] is the template for the root level
        //template[1] is the template for the first nesting level
        //template[2] is the template for the second nesting level
        //...
        //itemTemplate[0] is the item template for the root level
        //itemTemplate[1] is the item template for the first nesting level
        //itemTemplate[2] is the item template for the second nesting level
        //...

        //Store the root element
        W.rootElement = render(W.element, template, itemTemplate, 0, menuItems);

        //Recursively navigate all the structure, starting from the root element and fill the MenuElement.parentElement of
        //all MenuElements
        recursivelySetParent(null, W.rootElement);

        function recursivelySetParent(parentElement, currentElement) {
            if (!currentElement)
                return;

            //Assign the parent to the currentElement
            currentElement.parentElement = parentElement;

            //Then do the same on currentElement's children
            var children = currentElement.getChildren();
            $.each(children, function (i, child) {
                recursivelySetParent(currentElement, child);
            });
        }

        function render(elem, tpl, itemTpl, level, items) {
            if (!items || items.length == 0)
                return;

            //If not specified, render as a PopupMenu
            var curLevelTemplate = getTemplate(tpl[level], level, jpvs.Menu.Templates);
            var curLevelItemTemplate = getTemplate(itemTpl[level], level, jpvs.Menu.ItemTemplates);

            //Apply the template. The menu templates must return a MenuElement, so we can hide/show it as needed by the menu behavior
            var levelElem = jpvs.applyTemplate(elem, curLevelTemplate, { items: items, itemTemplate: curLevelItemTemplate, level: level });

            //The root level is always visible. The inner levels are hidden.
            if (level == 0)
                levelElem.show();
            else
                levelElem.hide();

            //Get all items that have just been created (they have the "Item" class)...
            var itemElements = levelElem.element.find(".Item");

            //...and associate the corresponding menuitem to each
            //Then render the next inner level and keep track of the submenu of each item
            $.each(items, function (i, item) {
                var itemElement = itemElements[i];
                if (itemElement) {
                    var $itemElem = $(itemElement);
                    $itemElem.data("menuItem", item);

                    var subMenu = render(elem, tpl, itemTpl, level + 1, item && item.items);
                    if (subMenu)
                        $itemElem.data("subMenu", subMenu);
                }
            });

            return levelElem;
        }
    }

    function getTemplate(templateSpec, level, defaultTemplates) {
        var tpl;

        //Use templateSpec to determine a template function
        if (typeof (templateSpec) == "function") {
            //If templateSpec is already a function, then we have nothing to do
            tpl = templateSpec;
        }
        else if (typeof (templateSpec) == "string") {
            //If it is a string, then it must be a default template
            tpl = defaultTemplates[templateSpec];
        }

        //If we still don't have a template here, let's apply a default setting
        if (!tpl) {
            if (level == 0)
                tpl = defaultTemplates.Default_Level0;
            else
                tpl = defaultTemplates.Default_OtherLevels;
        }

        //Here we have a template
        return tpl;
    }

    function closeAllNonRoot(menu) {
        var root = menu.rootElement;

        recursivelyClosePopups(root);

        function recursivelyClosePopups(menuElement) {
            if (!menuElement)
                return;

            menuElement.hideIfNonRoot();

            var childMenuElements = menuElement.getChildren();
            $.each(childMenuElements, function (i, cme) {
                //Only menu elements with submenu have children. The others are undefined.
                recursivelyClosePopups(cme);
            });
        }
    }

    function onItemMouseOver(e) {
        var item = $(e.currentTarget);

        //Menu item clicked
        var menuItem = item.data("menuItem");

        //If separator, do nothing
        if (menuItem === jpvs.Menu.Separator)
            return;

        //Hovering effect
        item.addClass("Item-Hover");
    }

    function onItemMouseOut(e) {
        var item = $(e.currentTarget);

        //Hovering effect
        item.removeClass("Item-Hover");
    }

    function onGlobalClick(e) {
        var clickedElem = $(e.target);
        var clickedItem = clickedElem.closest(".Menu .Item");
        var clickedMenu = clickedItem.closest(".Menu");

        //If no menu item clicked, then hide all non-root menus
        if (clickedItem.length == 0) {
            $.each(allMenus, function (i, menu) {
                closeAllNonRoot(menu);
            });
        }
        else {
            //Menu item clicked
            var menuItem = clickedItem.data("menuItem");

            //If separator, do nothing
            if (menuItem === jpvs.Menu.Separator)
                return;

            //Menu clicked
            var menu = jpvs.find(clickedMenu);

            //Show the submenu, if any
            var subMenu = clickedItem.data("subMenu");
            if (subMenu)
                subMenu.show();
            else {
                //If no submenu, hide all non-root
                closeAllNonRoot(menu);
            }

            //Finally handle events
            //Trigger the click event
            menu.click.fire(menu, null, menuItem);

            //Call the menu item click function, if any.
            //Pass the menuItem as the "this" and as the first argument
            if (menuItem && menuItem.click)
                menuItem.click.call(menuItem, menuItem);

            //Follow the href, if any
            if (menuItem && menuItem.href)
                window.location = menuItem.href;
        }
    }

})();
;


jpvs.MultiLineTextBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiLineTextBox,
    type: "MultiLineTextBox",
    cssClass: "MultiLineTextBox",

    create: function (container) {
        var obj = document.createElement("textarea");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("textarea");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        })
    }
});


;


(function () {

    jpvs.MultiSelectBox = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.MultiSelectBox.allStrings = {
        en: {
            selectAll: "Select all",
            unselectAll: "Unselect all"
        },

        it: {
            selectAll: "Seleziona tutto",
            unselectAll: "Deseleziona tutto"
        }
    };

    jpvs.makeWidget({
        widget: jpvs.MultiSelectBox,
        type: "MultiSelectBox",
        cssClass: "MultiSelectBox",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.MultiSelectBox.strings = jpvs.MultiSelectBox.allStrings[jpvs.currentLocale()];

            //Read items
            var items = [];
            this.element.find("option").each(function () {
                var opt = $(this);
                var value = opt.val();
                var text = opt.text();
                var selected = opt.prop("selected");

                items.push({ value: value, text: text, selected: selected });
            });

            //Remove this.element and substitute it with a table
            var newElem = jpvs.writeTag(this.element.parent(), "table");
            newElem.insertAfter(this.element);
            this.element.remove();
            newElem.attr("id", this.element.attr("id"));
            newElem.attr("class", this.element.attr("class"));
            this.element = newElem;

            //Attach the items collection
            setItems(W, items);

            //Create the label and the button
            var tbody = jpvs.writeTag(W, "tbody");
            var tr = jpvs.writeTag(tbody, "tr");

            this.label = jpvs.writeTag(tr, "td");
            this.label.addClass("Label");

            var buttonContainer = jpvs.writeTag(tr, "td");
            buttonContainer.addClass("ButtonContainer");

            this.button = jpvs.Button.create(buttonContainer).text("...").click(function () {
                showPopup(W);
            });

            //Update the label
            updateLabel(W);
        },

        canAttachTo: function (obj) {
            //No autoattach
            return false
        },

        prototype: {
            caption: jpvs.property({
                get: function () {
                    return this.element.data("caption");
                },
                set: function (value) {
                    this.element.data("caption", value);
                }
            }),

            prompt: jpvs.property({
                get: function () {
                    return this.element.data("prompt");
                },
                set: function (value) {
                    this.element.data("prompt", value);
                }
            }),

            containerTemplate: jpvs.property({
                get: function () {
                    return this.element.data("containerTemplate");
                },
                set: function (value) {
                    this.element.data("containerTemplate", value);
                }
            }),

            itemTemplate: jpvs.property({
                get: function () {
                    return this.element.data("itemTemplate");
                },
                set: function (value) {
                    this.element.data("itemTemplate", value);
                }
            }),

            clearItems: function () {
                setItems(this, []);
                updateLabel(this);
                return this;
            },

            addItem: function (value, text, selected) {
                var V = value;
                var T = text != null ? text : value;

                if (V != null & T != null) {
                    var items = getItems(this);
                    items.push({ value: V, text: T, selected: !!selected });
                    setItems(this, items);
                    updateLabel(this);
                }

                return this;
            },

            addItems: function (items) {
                var W = this;
                $.each(items, function (i, item) {
                    if (item != null) {
                        if (item.value != null)
                            W.addItem(item.value, item.text, item.selected);
                        else
                            W.addItem(item);
                    }
                });

                return this;
            },

            count: function () {
                var items = getItems(this);
                return items.length;
            },

            selectedValues: jpvs.property({
                get: function () { return getSelectedValues(this); },
                set: function (value) { setSelectedValues(this, value); }
            }),

            selectedValuesString: jpvs.property({
                get: function () { return this.selectedValues().join(","); },
                set: function (value) {
                    var x = $.trim(value);
                    if (x != "")
                        this.selectedValues(x.split(","));
                    else
                        this.selectedValues([]);
                }
            })
        }
    });

    function getItems(W) {
        return W.element.data("items");
    }

    function setItems(W, items) {
        W.element.data("items", items);
    }

    function getSelectedItems(W) {
        var items = getItems(W);
        var selItems = [];
        $.each(items, function (i, item) {
            if (item.selected)
                selItems.push(item);
        });

        return selItems;
    }

    function getSelectedTexts(W) {
        var selItems = getSelectedItems(W);
        var texts = [];
        $.each(selItems, function (i, item) {
            texts.push(item.text);
        });

        return texts;
    }

    function getSelectedValues(W) {
        var selItems = getSelectedItems(W);
        var values = [];
        $.each(selItems, function (i, item) {
            values.push(item.value);
        });

        return values;
    }

    function setSelectedValues(W, values) {
        var items = getItems(W);
        var mapItems = {};

        //Deselect all...
        $.each(items, function (i, item) {
            item.selected = false;
            mapItems[item.value] = item;
        });

        //... and select
        $.each(values, function (i, value) {
            var item = mapItems[value];
            if (item)
                item.selected = true;
        });

        setItems(W, items);
        updateLabel(W);
    }

    function updateLabel(W) {
        var texts = getSelectedTexts(W);
        jpvs.write(W.label.empty(), texts.join(", "));
    }

    function showPopup(W) {
        var items = getItems(W);

        //Create the popup with no title, not modal and below the label
        //Autoclose if the user clicks outside
        var pop = jpvs.Popup.create().addState("MultiSelectBox").title(null).modal(false).position({ my: "left top", at: "left bottom", of: W.label, collision: "fit", position: "absolute" });
        pop.autoDestroy(true);

        //Write the prompt string
        var prompt = W.prompt();
        if (prompt)
            jpvs.writeln(pop, prompt);

        //Select all/unselect all buttons
        jpvs.LinkButton.create(pop).text(jpvs.MultiSelectBox.strings.selectAll).click(onSelectAll);
        jpvs.write(pop, " ");
        jpvs.LinkButton.create(pop).text(jpvs.MultiSelectBox.strings.unselectAll).click(onUnselectAll);
        jpvs.writeln(pop);

        //Create the container, using a default container template (UL)
        //No data item is passed to this template
        var containerTemplate = W.containerTemplate() || defaultContainerTemplate;
        var ul = jpvs.applyTemplate(pop, containerTemplate);

        //Then create the data items (checkboxes), using the item template
        //Use a default item template that renders the item as an LI element with a checkbox inside
        //The item template must return an object with a "selected" property and a "change" event, so we can use it from here no
        //matter how the item is rendered
        var itemTemplate = W.itemTemplate() || defaultItemTemplate;
        var itemObjects = [];
        $.each(items, function (i, item) {
            var itemObject = jpvs.applyTemplate(ul, itemTemplate, item);
            itemObjects.push(itemObject);

            //Set the state and subscribe to the change event
            itemObject.selected(!!item.selected);
            itemObject.change(onItemSelectChange(itemObject, item));
        });

        pop.show();

        function onSelectAll() {
            selectAll(true);
        }

        function onUnselectAll() {
            selectAll(false);
        }

        function selectAll(value) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var itemObject = itemObjects[i];

                itemObject.selected(value);
                item.selected = value;
            }

            updateAndFire();
        }

        function onItemSelectChange(itemObject, item) {
            return function () {
                item.selected = itemObject.selected();
                updateAndFire();
            };
        }

        function updateAndFire() {
            setItems(W, items);
            updateLabel(W);

            //Fire the change event
            W.change.fire(W);
        }

        function defaultContainerTemplate() {
            return jpvs.writeTag(this, "ul");
        }

        function defaultItemTemplate(dataItem) {
            var li = jpvs.writeTag(this, "li");
            var chk = jpvs.CheckBox.create(li).text(dataItem.text).change(onCheckBoxChange);

            //Prepare the item object with the "selected" property and the "change" event
            var itemObject = {
                selected: jpvs.property({
                    get: function () {
                        return chk.checked();
                    },
                    set: function (value) {
                        chk.checked(value);
                    }
                }),

                change: jpvs.event(W)
            };

            return itemObject;

            function onCheckBoxChange() {
                //We just fire the change event
                itemObject.change.fire(itemObject);
            }
        }
    }

})();
;


(function () {

    jpvs.Pager = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.Pager.allStrings = {
        en: {
            firstPage: "First page",
            previousPage: "Previous page",
            nextPage: "Next page",
            lastPage: "Last page",
            pag: "Page"
        },
        it: {
            firstPage: "Prima pagina",
            previousPage: "Pagina precedente",
            nextPage: "Pagina successiva",
            lastPage: "Ultima pagina",
            pag: "Pag."
        }
    };

    jpvs.makeWidget({
        widget: jpvs.Pager,
        type: "Pager",
        cssClass: "Pager",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            var tbody = jpvs.writeTag(W.element, "tbody");
            var tr = jpvs.writeTag(tbody, "tr");

            var first = jpvs.writeTag(tr, "td");
            var prev = jpvs.writeTag(tr, "td");
            var combo = jpvs.writeTag(tr, "td");
            var next = jpvs.writeTag(tr, "td");
            var last = jpvs.writeTag(tr, "td");

            jpvs.Pager.strings = jpvs.Pager.allStrings[jpvs.currentLocale()];

            jpvs.LinkButton.create(first).text(jpvs.Pager.strings.firstPage).click(function () {
                W.page(Math.min(0, W.totalPages() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(next).text(jpvs.Pager.strings.nextPage).click(function () {
                W.page(Math.min(W.page() + 1, W.totalPages() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(prev).text(jpvs.Pager.strings.previousPage).click(function () {
                W.page(Math.max(0, W.page() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(last).text(jpvs.Pager.strings.lastPage).click(function () {
                W.page(W.totalPages() - 1);
                W.change.fire(W);
            });

            var cmbPages = jpvs.DropDownList.create(combo).change(function () {
                var val = parseInt(this.selectedValue());
                W.page(Math.min(val, W.totalPages() - 1));
                W.change.fire(W);
            });

            this.element.data("cmbPages", cmbPages);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            page: jpvs.property({
                get: function () { return this.element.data("page") || 0; },
                set: function (value) {
                    this.element.data("page", value);

                    var cmbPages = this.element.data("cmbPages");
                    cmbPages.selectedValue(value.toString());
                }
            }),

            totalPages: jpvs.property({
                get: function () { return this.element.data("totalPages") || 0; },
                set: function (value) {
                    var oldValue = this.totalPages();
                    if (oldValue != value) {
                        var cmbPages = this.element.data("cmbPages");
                        cmbPages.clearItems();
                        for (var i = 0; i < value; i++)
                            cmbPages.addItem(i.toString(), jpvs.Pager.strings.pag + " " + (i + 1) + " / " + value);
                    }

                    this.element.data("totalPages", value);
                }
            })
        }
    });
})();
;


jpvs.PasswordBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.PasswordBox,
    type: "PasswordBox",
    cssClass: "PasswordBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "password");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"password\"]");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        }),

        width: jpvs.property({
            get: function () { return this.element.css("width"); },
            set: function (value) { this.element.css("width", value); }
        })
    }
});


;


(function () {

    //Keep track of all popups
    var allPopups = {};

    //Attach global events for handling auto-hide/destroy popups and the ESC keystroke
    $(document).ready(function () {
        try {
            $(document).on("click.jpvsPopup", onGlobalClick).on("keydown.jpvsPopup", onGlobalKeyDown);
        }
        catch (e) {
        }
    });


    jpvs.Popup = function (selector) {
        this.attach(selector);

        this.close = jpvs.event(this);
    };

    jpvs.Popup.getTopMost = function () {
        var topMost, zIndex;
        $.each(allPopups, function (popId, popInfo) {
            if (!popInfo.open)
                return;

            var popZIndex = popInfo.widget.zIndex();

            if (!zIndex || popZIndex > zIndex) {
                topMost = popInfo;
                zIndex = popZIndex;
            }
        });

        return topMost ? topMost.widget : null;
    };

    jpvs.makeWidget({
        widget: jpvs.Popup,
        type: "Popup",
        cssClass: "Popup",

        create: function (container) {
            //Every popup created here must have a unique ID because it is put in allPopups[id]
            var obj = document.createElement("div");
            $(obj).attr("id", jpvs.randomString(20));
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Keep track
            allPopups[this.element.attr("id")] = { open: false, autoDestroy: false, autoHide: false, widget: this };

            //Wrap any current contents "xxxxxx" in structure: <div class="DimScreen"></div><div class="Contents">xxxxxx</div>
            var contents = this.element.contents();

            this.blanketElement = $(document.createElement("div"));
            this.blanketElement.addClass("DimScreen").css({ position: "fixed", top: "0px", left: "0px", width: "100%", height: "100%" });
            this.element.append(this.blanketElement);

            this.contentsElement = $(document.createElement("div"));
            this.contentsElement.addClass("Contents").append(contents);
            this.element.append(this.contentsElement);

            //All hidden initially
            this.element.hide();

            //Apply jpvsWidth
            var width = this.element.data("jpvsWidth");
            if (width)
                this.contentsElement.css({ width: width });

            //Treat H1 as popup title. Add <div class="Title"><h1>title</h1><img/></div><div class="Body"/> in Contents
            var h1 = this.contentsElement.children("h1").detach();
            var rest = this.contentsElement.contents();

            this.titleElement = $(document.createElement("div"));
            this.titleElement.addClass("Title");
            this.contentsElement.append(this.titleElement);

            this.bodyElement = $(document.createElement("div"));
            this.bodyElement.addClass("Body");
            this.contentsElement.append(this.bodyElement);

            this.bodyElement.append(rest);

            //Add closebutton and H1 in title
            this.closeButton = jpvs.ImageButton.create(this.titleElement);
            this.closeButton.imageUrls({
                normal: jpvs.Resources.images.closeButton,
                hover: jpvs.Resources.images.closeButtonHover
            });

            this.closeButton.click.bind(function () {
                W.hide();
                W.close.fire(W);
            });

            //Move H1 in title
            var newH1 = jpvs.writeTag(this.titleElement, "h1");
            newH1.append(h1.contents());

            //Make popup draggable by the H1
            if (this.contentsElement.draggable) {
                this.contentsElement.draggable({
                    addClasses: false,
                    containment: "window",
                    cursor: "move",
                    handle: newH1,
                    scroll: false
                });
            }

            //By default, the popup is modal
            this.modal(true);

            //When clicking on the popup, put it on top of the popup stack
            this.contentsElement.mousedown(onPopupClick(this));

            function onPopupClick(W) {
                return function () {
                    W.bringForward();
                };
            }
        },

        canAttachTo: function (obj) {
            //No auto attaching
            return false;
        },

        destroy: function () {
            var pop = this;

            //Hide the popup and, only at the end of the animation, destroy the widget
            this.hide(function () {
                //Keep track
                delete allPopups[pop.element.attr("id")];

                //Let's effect the default behavior here, AFTER the end of the "hide animation"
                pop.element.remove();
            });

            //Suppress the default behavior
            return false;
        },

        getMainContentElement: function () {
            return this.bodyElement;
        },

        prototype: {
            modal: jpvs.property({
                get: function () { return this.element.data("modal"); },
                set: function (value) { this.element.data("modal", !!value); }
            }),

            autoHide: jpvs.property({
                get: function () {
                    return !!allPopups[this.element.attr("id")].autoHide;
                },
                set: function (value) {
                    allPopups[this.element.attr("id")].autoHide = !!value;
                }
            }),

            autoDestroy: jpvs.property({
                get: function () {
                    return !!allPopups[this.element.attr("id")].autoDestroy;
                },
                set: function (value) {
                    allPopups[this.element.attr("id")].autoDestroy = !!value;
                }
            }),

            position: jpvs.property({
                get: function () {
                    return this.element.data("position");
                },
                set: function (value) {
                    this.element.data("position", value);
                }
            }),

            applyPosition: function (flagAnimate) {
                //First, if bigger than viewport, reduce the popup
                var W = this.contentsElement.outerWidth();
                var H = this.contentsElement.outerHeight();

                var wnd = $(window);
                var wndW = wnd.width();
                var wndH = wnd.height();

                //If bigger than screen, adjust to fit and put scrollbars on popup body
                var deltaH = H - wndH;
                var deltaW = W - wndW;

                var bodyW = this.bodyElement.width();
                var bodyH = this.bodyElement.height();

                if (deltaW > 0 || deltaH > 0) {
                    this.bodyElement.css("overflow", "auto");

                    if (deltaW > 0) {
                        bodyW -= deltaW;
                        this.bodyElement.css("width", bodyW + "px");
                    }

                    if (deltaH > 0) {
                        bodyH -= deltaH;
                        this.bodyElement.css("height", bodyH + "px");
                    }
                }

                //Finally, apply the desired position or, if no desired position was specified, center in viewport
                var pos = this.position() || {
                    my: "center",
                    at: "center",
                    of: $(window),
                    collision: "fit",
                    position: "fixed"
                };

                if (flagAnimate)
                    pos.using = function (css) { $(this).animate(css); };
                else
                    delete pos.using;

                this.contentsElement.css("position", pos.position || "fixed").position(pos);
                return this;
            },

            center: function () {
                //Default position (center in viewport)
                this.position(null);
                this.applyPosition();
                return this;
            },

            show: function (callback) {
                var pop = this;

                //Show popup
                this.element.show();

                //If never positioned before, then do it now with no animation
                var posType = this.contentsElement.css("position");
                if (posType != "absolute" && posType != "fixed")
                    this.applyPosition(false);

                this.contentsElement.hide();
                this.contentsElement.fadeIn(function () {
                    //Animate to desired position, if not already there
                    pop.applyPosition(true);

                    //Callback after the animation
                    if (callback)
                        callback();
                });

                //Dim screen if modal
                if (this.modal())
                    this.blanketElement.show();
                else
                    this.blanketElement.hide();

                //Keep track
                allPopups[this.element.attr("id")].open = true;
                allPopups[this.element.attr("id")].openTimestamp = new Date().getTime();

                //Put it on top of popup stack
                this.bringForward();

                return this;
            },

            hide: function (callback) {
                //Keep track
                allPopups[this.element.attr("id")].open = false;

                this.blanketElement.hide();
                this.contentsElement.fadeOut(callback);

                return this;
            },

            bringForward: function () {
                var topMost = jpvs.Popup.getTopMost();
                if (topMost) {
                    //Change zIndex only if not already on top
                    if (topMost !== this)
                        this.zIndex(topMost.zIndex() + 1);
                }
                else
                    this.zIndex(10000);

                return this;
            },

            title: jpvs.property({
                get: function () { return this.titleElement.children("h1").text(); },
                set: function (value) {
                    this.titleElement.children("h1").text(value);
                    if (value)
                        this.titleElement.show();
                    else
                        this.titleElement.hide();
                }
            }),

            width: jpvs.property({
                get: function () { return this.contentsElement.width(); },
                set: function (value) { this.contentsElement.css("width", value); }
            }),

            maxWidth: jpvs.property({
                get: function () { return this.contentsElement.css("max-width"); },
                set: function (value) { this.contentsElement.css("max-width", value); }
            }),

            zIndex: jpvs.property({
                get: function () {
                    var z = parseInt(this.contentsElement.css("zIndex"));
                    return isFinite(z) ? z : 10000;
                },
                set: function (value) {
                    this.blanketElement.css("zIndex", value);
                    this.contentsElement.css("zIndex", value);
                }
            })
        }
    });



    jpvs.alert = function () {
        //Variable argument list
        var params = {
            title: jpvs.alert.defaultTitle,
            text: "",
            onclose: null,
            buttons: [{ text: "OK"}]
        };

        //Read arguments and dispatch them to the appropriate field
        var okTitle = false, okText = false;
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (!arg)
                continue;

            if (typeof (arg) == "string") {
                //First try (text) then (title, text)
                if (!okText) {
                    params.text = arg;
                    okText = true;
                }
                else if (!okTitle) {
                    params.title = params.text;
                    params.text = arg;
                    okTitle = true;
                }
            }
            else if (typeof (arg) == "function" || arg.__WIDGET__) {
                //It's an "onclose" ("function" or "widget to focus")
                params.onclose = arg;
            }
            else if (arg.length) {
                //Buttons array
                params.buttons = arg;
            }
        }

        //Create popup
        var pop = jpvs.Popup.create();

        //Set title and text and width
        pop.maxWidth("75%").title(params.title || null);
        jpvs.write(pop.bodyElement, params.text);

        //Buttons (with pop.close.fire() prepended in the event handlers)
        if (params.buttons) {
            $.each(params.buttons, function (i, btn) {
                if (btn)
                    btn.click = wrap(pop, btn.click);
            });
        }

        jpvs.writeButtonBar(pop.bodyElement, params.buttons);

        //Show
        pop.show();
        pop.center();

        //Close event --> give focus as requested and destroy
        pop.close.bind(function () {
            pop.hide();

            if (params.onclose) {
                if (typeof (params.onclose) == "function")
                    params.onclose();
                else if (params.onclose.__WIDGET__) {
                    //If widget, then set focus to it
                    params.onclose.focus();
                }
            }

            //Destroy after hide animation finished
            setTimeout(function () { pop.destroy(); }, 5000);
        });

        function wrap(pop, handler) {
            return function () {
                //First, call the button handler...
                if (handler)
                    handler();

                //Then, simulate a click on the close button to hide the popup and trigger the onclose event
                pop.close.fire();
            };
        }
    };


    jpvs.confirm = function (title, text, onYes, onNo, textYes, textNo) {
        var clickedYes = false;

        function onClose() {
            if (clickedYes) {
                if (onYes)
                    onYes();
            }
            else {
                if (onNo)
                    onNo();
            }
        }

        jpvs.alert(title, text, onClose, [
            { text: textYes || "OK", click: function () { clickedYes = true; } },
            { text: textNo || "Cancel", click: function () { clickedYes = false; } }
        ]);
    };



    function onGlobalKeyDown(e) {
        //ESC button must close the topmost popup currently open
        if (e.which == 27) {
            //ESC key pressed: search for the topmost popup
            var topMost = jpvs.Popup.getTopMost();

            //Now close it and do not propagate the ESC event
            //Simulate a click on the close button instead of simply hiding
            if (topMost) {
                topMost.closeButton.click.fire(topMost);
                return false;
            }
        }
    }

    function onGlobalClick(e) {
        //What did the user click?
        var clickedElem = $(e.target);
        var clickedPopup = clickedElem.closest(".Popup");

        //Close all "auto-close" (autohide or autodestroy) popups that are currently open, but leave clickedPopupId open
        //That is, if the user clicked on a popup, leave that one open and close all the others
        var clickedPopupId = clickedPopup.length ? clickedPopup.attr("id") : "";

        //Preserve newly-opened popups, so the button click that triggered the popup does not immediately trigger its destruction
        var threshold = new Date().getTime() - 500;

        $.each(allPopups, function (popId, pop) {
            if (pop.open && pop.openTimestamp < threshold && popId != clickedPopupId) {
                //If autohide, then hide
                if (pop.autoHide)
                    pop.widget.hide();

                //If autodestroy, then destroy
                if (pop.autoDestroy)
                    pop.widget.destroy();
            }
        });
    }

})();
;


(function () {

    jpvs.Scheduler = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.Scheduler.allStrings = {
        en: {
            today: "Today",
            day: "Day",
            week: "Week",
            month: "Month",
            agenda: "Agenda"
        },

        it: {
            today: "Oggi",
            day: "Giorno",
            week: "Settimana",
            month: "Mese",
            agenda: "Agenda"
        }
    };

    jpvs.makeWidget({
        widget: jpvs.Scheduler,
        type: "Scheduler",
        cssClass: "Scheduler",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.Scheduler.strings = jpvs.Scheduler.allStrings[jpvs.currentLocale()];

            W.pager = jpvs.writeTag(W, "div").addClass("Pager");

            W.header = jpvs.writeTag(W, "div").addClass("Header").css({
                position: "relative",
                height: "1em"
            });

            W.body = jpvs.writeTag(W, "div").addClass("Body").css({
                position: "relative",
                height: "400px"
            });

            createPagerLayout(W);
            refresh(W);

            /*
            this.element.change(function () {
            return W.change.fire(W);
            });
            */
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            mode: jpvs.property({
                get: function () { return this.element.data("mode") || "day"; },
                set: function (value) { this.element.data("mode", value); refresh(this); }
            }),

            date: jpvs.property({
                get: function () { return this.element.data("date") || moment().format("YYYYMMDD"); },
                set: function (value) { this.element.data("date", value); refresh(this); }
            }),

            dayItemTemplate: jpvs.property({
                get: function () { return this.element.data("dayItemTemplate") || defaultDayItemTemplate },
                set: function (value) { this.element.data("dayItemTemplate", value); refresh(this); }
            }),

            weekItemTemplate: jpvs.property({
                get: function () { return this.element.data("weekItemTemplate") || defaultWeekItemTemplate },
                set: function (value) { this.element.data("weekItemTemplate", value); refresh(this); }
            })
        }
    });

    function str(name) {
        return jpvs.Scheduler.strings[name] || ("Error: " + name);
    }

    function createPagerLayout(W) {
        jpvs.Button.create(W.pager).text(str("today")).click(onToday(W));
        jpvs.Button.create(W.pager).text("<").click(onPrevious(W));
        jpvs.Button.create(W.pager).text(">").click(onNext(W));

        jpvs.writeTag(W.pager, "span", " ").addClass("Spacer");

        W.btnDay = jpvs.Button.create(W.pager).text(str("day")).click(onSetMode(W, "day"));
        W.btnWeek = jpvs.Button.create(W.pager).text(str("week")).click(onSetMode(W, "week"));
        W.btnMonth = jpvs.Button.create(W.pager).text(str("month")).click(onSetMode(W, "month"));
        W.btnAgenda = jpvs.Button.create(W.pager).text(str("agenda")).click(onSetMode(W, "agenda"));
    }

    function onToday(W) {
        return function () {
            W.date(moment().format("YYYYMMDD"));
        };
    }

    function onPrevious(W) {
        return function () {
            //Move the current date based on the current display mode
            var mode = W.mode();
            var date = moment(W.date(), "YYYYMMDD");

            if (mode == "day")
                date.add(-1, "days");
            else if (mode == "week")
                date.add(-7, "days");
            else if (mode == "month")
                date.add(-1, "month");

            W.date(date.format("YYYYMMDD"));
        };
    }

    function onNext(W) {
        return function () {
            //Move the current date based on the current display mode
            var mode = W.mode();
            var date = moment(W.date(), "YYYYMMDD");

            if (mode == "day")
                date.add(+1, "days");
            else if (mode == "week")
                date.add(+7, "days");
            else if (mode == "month")
                date.add(+1, "month");

            W.date(date.format("YYYYMMDD"));
        };
    }

    function onSetMode(W, mode) {
        return function () {
            W.mode(mode);
        };
    }

    function refresh(W) {
        refreshPager(W);
        refreshBody(W);
    }

    function refreshPager(W) {
        //Button states
        jpvs.find(W.pager.find("button")).each(function () {
            this.removeState("Active");
        });

        var mode = W.mode();
        var btn;
        if (mode == "day")
            btn = W.btnDay;
        else if (mode == "week")
            btn = W.btnWeek;
        else if (mode == "month")
            btn = W.btnMonth;
        else if (mode == "agenda")
            btn = W.btnAgenda;

        if (btn)
            btn.addState("Active");
    }

    function refreshBody(W) {
        var func = refreshBodyModes[W.mode()] || function () {
            jpvs.write(W.body, "Invalid mode: " + W.mode());
        };
        func(W);
    }

    var refreshBodyModes = {
        day: function (W) {
            //Load data for the current date only
            var date = W.date();

            readData(date, date, function (list) {
                //Header
                W.header.empty();
                drawCenteredText(W.header, 0, 1, 0, moment(date, "YYYYMMDD").format("dddd - LL"));

                //Body
                W.body.empty();
                W.body.css("overflow-y", "scroll");
                W.body.css("overflow-x", "hidden");
                drawHoursOfTheDay(W.body);

                //Write a rectangle for each scheduled item
                //Use the item template for writing inside
                var template = W.dayItemTemplate();
                for (var i in list) {
                    var item = list[i];
                    var y1 = calcDayY(item.timeFrom);
                    var y2 = calcDayY(item.timeTo);
                    var divItem = drawRect(W.body, 1 / 7, 6 / 7, y1, y2, "", "Item");
                    jpvs.applyTemplate(divItem, template, item);
                }
            });
        },

        week: function (W) {
            //Load data for the current week only
            var date = moment(W.date(), "YYYYMMDD");
            var startOfWeek = moment(date).startOf("week");
            var startDate = startOfWeek.format("YYYYMMDD");
            var endDate = moment(date).endOf("week").format("YYYYMMDD");

            readData(startDate, endDate, function (list) {
                //Header
                W.header.empty();
                W.header.css("overflow-y", "scroll");
                W.header.css("overflow-x", "hidden");
                drawWeekDays_Header(W.header, startOfWeek);

                //Body
                W.body.empty();
                W.body.css("overflow-y", "scroll");
                W.body.css("overflow-x", "hidden");

                //Draw hours and weekdays
                drawWeekDays(W.body, startOfWeek);
                drawHoursOfTheDay(W.body);

                //Write a rectangle for each scheduled item
                //Use the item template for writing inside
                var template = W.weekItemTemplate();
                for (var i in list) {
                    var item = list[i];
                    var y1 = calcDayY(item.timeFrom);
                    var y2 = calcDayY(item.timeTo);
                    var x1 = calcWeekX(item.dateFrom, startOfWeek);
                    var x2 = calcWeekX(item.dateTo, startOfWeek);
                    var divItem = drawRect(W.body, x1 + 0.1 / 7, x2 + 0.9 / 7, y1, y2, "", "Item");
                    jpvs.applyTemplate(divItem, template, item);
                }
            });
        },

        month: function (W) {
            jpvs.write(W.body, "TODO: Month");
        },

        agenda: function (W) {
            jpvs.write(W.body, "TODO: Agenda");
        }
    };

    function readData(from, to, callback) {
        callback([
            { dateFrom: moment().format("YYYYMMDD"), dateTo: moment().format("YYYYMMDD"), timeFrom: "0937", timeTo: "1530" },
            { dateFrom: moment().format("YYYYMMDD"), dateTo: moment().format("YYYYMMDD"), timeFrom: "1600", timeTo: "1700" },
            { dateFrom: moment().add(2, "days").format("YYYYMMDD"), dateTo: moment().add(2, "days").format("YYYYMMDD"), timeFrom: "1600", timeTo: "1700" }
        ]);
    }

    var NUM_OF_VISIBLE_HOURS = 10;

    function drawHoursOfTheDay(container) {
        //Write a rectangle for every hour of the day
        for (var hour = 0; hour < 24; hour++) {
            drawRect(container, 0, 1, hour / NUM_OF_VISIBLE_HOURS, (hour + 1) / NUM_OF_VISIBLE_HOURS, hour != 0 ? "T" : "");
            drawRect(container, 0, 1, (hour + 0.5) / NUM_OF_VISIBLE_HOURS, (hour + 1) / NUM_OF_VISIBLE_HOURS, "t");

            var h00 = moment().hours(hour).minutes(0).format("HH:mm");
            var h30 = moment().hours(hour).minutes(30).format("HH:mm");
            drawText(container, 0, hour / NUM_OF_VISIBLE_HOURS, h00);
            drawText(container, 0, (hour + 0.5) / NUM_OF_VISIBLE_HOURS, h30);
        }

        //Scroll to 8:00 am
        container.scrollTop(8 / NUM_OF_VISIBLE_HOURS * container.height());
    }

    function calcDayY(time) {
        var timeAsObj = moment(time, "HHmm");
        var hours = timeAsObj.hours();
        var minutes = timeAsObj.minutes();

        return (hours + minutes / 60) / NUM_OF_VISIBLE_HOURS;
    }

    function drawWeekDays_Header(container, startOfWeek) {
        //Divide in 7 parts
        var date = moment(startOfWeek);
        for (var i = 0; i < 7; i++) {
            drawRect(container, i / 7, (i + 1) / 7, 0, 1, i < 6 ? "R" : "", date.day() == 0 || date.day() == 6 ? "Holiday" : "");
            drawCenteredText(container, i / 7, (i + 1) / 7, 0, date.format("ddd - L"));
            date = date.add(1, "days");
        }
    }

    function drawWeekDays(container, startOfWeek) {
        //Divide in 7 parts
        var date = moment(startOfWeek);
        for (var i = 0; i < 7; i++) {
            drawRect(container, i / 7, (i + 1) / 7, 0, 24 / NUM_OF_VISIBLE_HOURS, i < 6 ? "R" : "", date.day() == 0 || date.day() == 6 ? "Holiday" : "");
            date = date.add(1, "days");
        }
    }

    function calcWeekX(date, startOfWeek) {
        var diffDays = 0;
        var dateAsStr = moment(date).format("YYYYMMDD");
        var startOfWeekAsStr = moment(startOfWeek).format("YYYYMMDD");
        while (moment(dateAsStr, "YYYYMMDD").isAfter(moment(startOfWeekAsStr, "YYYYMMDD"))) {
            diffDays++;
            dateAsStr = moment(dateAsStr, "YYYYMMDD").add(-1, "days").format("YYYYMMDD");
        }
        while (moment(dateAsStr, "YYYYMMDD").isBefore(moment(startOfWeekAsStr, "YYYYMMDD"))) {
            diffDays--;
            dateAsStr = moment(dateAsStr, "YYYYMMDD").add(+1, "days").format("YYYYMMDD");
        }

        return diffDays / 7;
    }

    //Coordinates are proportional: they go from 0 (left/top) to 1 (right/bottom).
    //(0,0) is the top-left corner; (1,1) is the bottom-right corner
    function drawRect(container, x1, x2, y1, y2, borders, cssClass) {
        var div = jpvs.writeTag(container, "div").css({
            position: "absolute",
            left: (100 * x1) + "%",
            top: (100 * y1) + "%",
            width: (100 * (x2 - x1)) + "%",
            height: (100 * (y2 - y1)) + "%"
        });

        if (cssClass)
            div.addClass(cssClass);
        if (borders.indexOf("L") >= 0)
            div.css("border-left", "1px solid #000");
        if (borders.indexOf("R") >= 0)
            div.css("border-right", "1px solid #000");
        if (borders.indexOf("T") >= 0)
            div.css("border-top", "1px solid #000");
        if (borders.indexOf("B") >= 0)
            div.css("border-bottom", "1px solid #000");
        if (borders.indexOf("l") >= 0)
            div.css("border-left", "1px dashed #000");
        if (borders.indexOf("r") >= 0)
            div.css("border-right", "1px dashed #000");
        if (borders.indexOf("t") >= 0)
            div.css("border-top", "1px dashed #000");
        if (borders.indexOf("b") >= 0)
            div.css("border-bottom", "1px dashed #000");

        return div;
    }

    function drawText(container, x, y, text) {
        var div = jpvs.writeTag(container, "div").css({
            position: "absolute",
            left: (100 * x) + "%",
            top: (100 * y) + "%",
            "font-size": "8pt"
        });

        jpvs.write(div, text);
    }

    function drawCenteredText(container, x1, x2, y, text) {
        var div = jpvs.writeTag(container, "div").css({
            position: "absolute",
            left: (100 * x1) + "%",
            top: (100 * y) + "%",
            width: (100 * (x2 - x1)) + "%",
            "font-size": "8pt",
            "text-align": "center"
        });

        jpvs.write(div, text);
    }

    function defaultDayItemTemplate(dataItem) {
        var timeFrom = moment(dataItem.timeFrom, "HHmm").format("HH:mm");
        var timeTo = moment(dataItem.timeTo, "HHmm").format("HH:mm");
        jpvs.write(this, timeFrom + " - " + timeTo);
    }

    function defaultWeekItemTemplate(dataItem) {
        var timeFrom = moment(dataItem.timeFrom, "HHmm").format("HH:mm");
        var timeTo = moment(dataItem.timeTo, "HHmm").format("HH:mm");
        jpvs.write(this, timeFrom + " - " + timeTo);
    }
})();
;


(function () {

    jpvs.Scroller = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.makeWidget({
        widget: jpvs.Scroller,
        type: "Scroller",
        cssClass: "Scroller",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Park the size
            var parkedSize = {
                width: W.element.width(),
                height: W.element.height()
            };

            //Make the div a container for scrolling
            W.element.css({ position: "relative", width: "200px", height: "200px" });

            //Park the content for later inclusion in the appropriate DIV
            var parkedContent = W.element.contents();

            //Create a scroller box DIV with overflow auto, same size as the widget
            W.scrollerBox = jpvs.writeTag(W.element, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "scroll"
            });

            //Inside the scroller box, create a DIV that is used as a sizer for the scrollbars of the scroller box
            W.scrollerSizer = jpvs.writeTag(W.scrollerBox, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Create a content box DIV with overflow hidden, same size as the widget, overlapping the scroller box
            //Later, we reduce width and height so as to leave the scrollerBox's scrollbars uncovered
            W.contentBox = jpvs.writeTag(W.element, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Inside the content box, create a content DIV that will hold the actual content
            W.content = jpvs.writeTag(W.contentBox, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Measure scrollbars
            W.scrollbarW = scrollbarWidth();
            W.scrollbarH = W.scrollbarW;

            //Events
            W.scrollerBox.scroll(onScroll(W));
            $(window).resize(onResize(W));

            //Finally, copy the content into the "content" DIV and set sizes
            if (parkedContent.length) {
                W.content.append(parkedContent);
                parkedSize.height += W.scrollbarH;
                parkedSize.width += W.scrollbarW;
                W.scrollableSize(parkedSize).contentSize(parkedSize);
            }

            //Adjust the content box size
            onResize(W)();
        },

        canAttachTo: function (obj) {
            return false;
        },

        getMainContentElement: function () {
            return this.content;
        },

        prototype: {
            objectSize: jpvs.property({
                get: function () {
                    return {
                        width: this.element.width(),
                        height: this.element.height()
                    };
                },
                set: function (value) {
                    this.element.width(value.width).height(value.height);
                    onResize(this)();
                }
            }),

            scrollableSize: jpvs.property({
                get: function () {
                    return {
                        width: this.scrollerSizer.width(),
                        height: this.scrollerSizer.height()
                    };
                },
                set: function (value) {
                    this.scrollerSizer.width(value.width).height(value.height);
                    onResize(this)();
                }
            }),

            contentSize: jpvs.property({
                get: function () {
                    return {
                        width: this.content.width(),
                        height: this.content.height()
                    };
                },
                set: function (value) {
                    this.content.width(value.width).height(value.height);
                    onResize(this)();
                }
            }),

            scrollPosition: jpvs.property({
                get: function () {
                    var st = this.scrollerBox.scrollTop();
                    var sl = this.scrollerBox.scrollLeft();

                    return { top: st, left: sl };
                },
                set: function (value) {
                    this.scrollerBox.scrollTop(value.top).scrollLeft(value.left);
                }
            }),

            contentPosition: jpvs.property({
                get: function () {
                    var st = this.contentBox.scrollTop();
                    var sl = this.contentBox.scrollLeft();

                    return { top: st, left: sl };
                },
                set: function (value) {
                    this.contentBox.scrollTop(value.top).scrollLeft(value.left);
                }
            })
        }
    });


    function onScroll(W) {
        return function () {
            W.change.fire(W);
        };
    }

    function onResize(W) {
        return function () {
            //Adjust the content box size, so the scrollbars are not covered by the content
            var width = W.element.innerWidth() - W.scrollbarW;
            var height = W.element.innerHeight() - W.scrollbarH;
            W.contentBox.css({
                width: width + "px", height: height + "px"
            });
        };
    }

    function scrollbarWidth() {
        var $inner = $('<div style="width: 100%; height:200px;">test</div>');
        var $outer = $('<div style="width:200px;height:150px; position: absolute; top: 0px; left: 0px; visibility: hidden; overflow:hidden;"></div>').append($inner);
        var inner = $inner[0];
        var outer = $outer[0];

        $('body').append(outer);
        var width1 = inner.offsetWidth;
        $outer.css('overflow', 'scroll');
        var width2 = outer.clientWidth;
        $outer.remove();

        return (width1 - width2);
    }

})();
;


(function () {

    jpvs.Table = function (selector) {
        this.attach(selector);
    };

    jpvs.makeWidget({
        widget: jpvs.Table,
        type: "Table",
        cssClass: "Table",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
        },

        canAttachTo: function (obj) {
            return $(obj).is("table");
        },

        prototype: {
            addClass: function (classNames) {
                //Proxy to jQuery method
                this.element.addClass(classNames);
                return this;
            },

            removeClass: function (classNames) {
                //Proxy to jQuery method
                this.element.removeClass(classNames);
                return this;
            },

            css: function () {
                //Proxy to jQuery method
                this.element.css.apply(this.element, arguments);
                return this;
            },

            writeHeaderRow: function () {
                return writeRow(this, "thead");
            },

            writeBodyRow: function () {
                return writeRow(this, "tbody");
            },

            writeRow: function () {
                return this.writeBodyRow();
            },

            writeFooterRow: function () {
                return writeRow(this, "tfoot");
            },

            caption: jpvs.property({
                get: function () {
                    var caption = this.element.children("caption");
                    if (caption.length != 0)
                        return caption.text();
                    else
                        return null;
                },
                set: function (value) {
                    var caption = this.element.children("caption");
                    if (caption.length == 0) {
                        caption = $(document.createElement("caption"));
                        this.element.prepend(caption);
                    }

                    caption.text(value);
                }
            }),

            clear: function () {
                this.element.find("tr").remove();
                return this;
            }
        }
    });

    function getSection(W, section) {
        //Ensure the "section" exists (thead, tbody or tfoot)
        var sectionElement = W.element.children(section);
        if (sectionElement.length == 0) {
            sectionElement = $(document.createElement(section));
            W.element.append(sectionElement);
        }

        return sectionElement;
    }

    function writeRow(W, section) {
        var sectionElement = getSection(W, section);

        //Add a new row
        var tr = $(document.createElement("tr"));
        sectionElement.append(tr);

        //Wrap the row in a row object
        return new RowObject(W, tr);
    }

    function RowObject(W, tr) {
        this.table = W;
        this.element = tr;
    }

    RowObject.prototype.writeHeaderCell = function (text) {
        return jpvs.writeTag(this.element, "th", text);
    };

    RowObject.prototype.writeCell = function (text) {
        return jpvs.writeTag(this.element, "td", text);
    };

    RowObject.prototype.getMainContentElement = function () {
        return this.element;
    };
})();
;


(function () {

    var uniqueNameCounter = 1;
    var handleToleranceX = 5;

    jpvs.TableExtender = {
        create: function (table) {
            //"table" can be an element, a selector or a widget
            var tableElement = jpvs.getElementIfWidget(table);

            return new Extender(tableElement);
        }
    };


    function Extender(tableElement) {
        this.tableElement = tableElement;
        this.floatingHeaderClone = null;

        //The unique name is applied as a CSS class name on THEAD and TBODY in order to uniquely identify cells affected by this extender (i.e.:
        //cells in subtables of tableElement must not be affected by this extender). This allows the allCellsSelector to work.
        this.uniqueName = "TableExtender" + (uniqueNameCounter++);
        this.allCellsSelector = ".NAME>tr>th, .NAME>tr>td".replace(/NAME/g, this.uniqueName);
        this.allHeaderCellsSelector = ".NAME>tr>th".replace(/NAME/g, this.uniqueName);

        this.afterResize = new jpvs.Event();
        this.changeFilterSort = new jpvs.Event();
    }

    Extender.prototype.resizableColumns = jpvs.property({
        get: function () { return !!this._resizableColumns; },
        set: function (value) { this._resizableColumns = !!value; }
    });

    Extender.prototype.persistColumnSizes = jpvs.property({
        get: function () { return !!this._persistColumnSizes; },
        set: function (value) { this._persistColumnSizes = !!value; }
    });

    Extender.prototype.enableSorting = jpvs.property({
        get: function () { return !!this._enableSorting; },
        set: function (value) { this._enableSorting = !!value; }
    });

    Extender.prototype.enableFiltering = jpvs.property({
        get: function () { return !!this._enableFiltering; },
        set: function (value) { this._enableFiltering = !!value; }
    });

    Extender.prototype.getSortAndFilterSettings = function () {
        return {
            sort: this.sortSettings,
            filter: this.filterSettings
        };
    };

    Extender.prototype.clearSortAndFilterSettings = function () {
        //Reset filter/sort settings
        this.sortSettings = [];
        this.filterSettings = [];
    };

    Extender.prototype.tableHeaderAlwaysVisible = jpvs.property({
        get: function () { return !!this._tableHeaderAlwaysVisible; },
        set: function (value) { this._tableHeaderAlwaysVisible = !!value; }
    });

    Extender.prototype.apply = function () {
        //We need some DataGrid's strings. Let's ensure they are properly initialized based on the current locale
        jpvs.DataGrid.strings = jpvs.DataGrid.allStrings[jpvs.currentLocale()];

        //Apply the CSS class "uniqueName" to THEAD and TBODY, so the allCellsSelector can distinguish cells of this table from cells of subtables
        applyUniqueName(this);

        //We need table layout fixed, so we can precisely do the layout manually
        setTableLayoutFixed(this);

        //Column sizes are persisted?
        if (this.persistColumnSizes())
            loadColSizesFromStorage(this);

        //Let's activate the table header fixing, if required
        if (this.tableHeaderAlwaysVisible())
            createFloatingHeaderClone(this);

        if (this.resizableColumns()) {
            //Activate resizable visual cues on vertical grid lines
            activateResizeCursorOnVerticalLines(this);

            //Handle cell border dragging
            handleCellBorderDragging(this);
        }

        //Let's activate sorting/filtering, if required
        var sortingOrFiltering = this.enableFiltering() || this.enableSorting();
        if (sortingOrFiltering) {
            //Activate filtering/sorting on TH elements
            activateFilterSort(this);
        }
    };

    function getColSpan(cell) {
        return cell.prop("colspan") || 1;
    }

    function getLeftBorderIndex(cell) {
        //In case we have colspans, sum all colspans up to (and excluding) this cell
        var sumOfAllColspans = 0;
        cell.prevAll().each(function () {
            var cell = $(this);
            sumOfAllColspans += getColSpan(cell);
        });

        return sumOfAllColspans;
    }

    function isResizingLeftBorder(cell, relX) {
        var leftBorderIndex = getLeftBorderIndex(cell);
        return leftBorderIndex > 0 && relX < handleToleranceX;
    }

    function isResizingRightBorder(cell, relX) {
        var cellWidth = cell.outerWidth();
        return cellWidth - relX < handleToleranceX;
    }

    function getColElements(tbl) {
        //Return all COL elements whose parent or grandparent is the table itself
        return tbl.find("col").filter(function () {
            return $(this).parent()[0] === tbl[0] || $(this).parent().parent()[0] === tbl[0];
        });
    }

    function getScrollingContainer(tbl) {
        //Let's find the element's scrolling container (the first ancestor that has overflow: auto/scroll/hidden)
        var scrollingContainer = tbl;
        while (true) {
            scrollingContainer = scrollingContainer.parent();
            var test = scrollingContainer[0].nodeName;
            if (!scrollingContainer || scrollingContainer.length == 0 || scrollingContainer[0].nodeName.toLowerCase() == "body") {
                //We have just climbed up to the body, so we have no scrolling container (we scroll the window)
                scrollingContainer = null;
                break;
            } else {
                var overflow = scrollingContainer.css("overflow");
                if (overflow == "auto" || overflow == "scroll" || overflow == "hidden") {
                    //We have found it
                    break;
                }
            }
        }

        return scrollingContainer || $(window);
    }

    function applyUniqueName(extender) {
        extender.tableElement.children("thead,tbody,tfoot").addClass(extender.uniqueName);
    }

    function activateResizeCursorOnVerticalLines(extender) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        //Same visual cues on the floating header clone, if present
        if (extender.floatingHeaderClone)
            tbl = tbl.add(extender.floatingHeaderClone);

        tbl.off("mousemove.jpvsTableExtender1").on("mousemove.jpvsTableExtender1", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            var cellOffset = cell.offset();
            var relX = e.pageX - cellOffset.left;

            if (isResizingLeftBorder(cell, relX) || isResizingRightBorder(cell, relX))
                cell.addClass("ColumnResize");
            else
                cell.removeClass("ColumnResize");
        });

        tbl.off("mouseleave.jpvsTableExtender1").on("mouseleave.jpvsTableExtender1", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            cell.removeClass("ColumnResize");
        });
    }

    function setTableLayoutFixed(extender) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        //Measure all columns that have colspan = 1
        var colWidths = [];
        tbl.find(allCellsSelector).each(function () {
            var cell = $(this);
            var cellIndex = getLeftBorderIndex(cell);
            var colspan = cell.prop("colspan") || 1;
            var cellWidth = cell.outerWidth();

            if (colspan == 1)
                colWidths[cellIndex] = cellWidth;
        });

        //Set fixed table layout and explicitly set columns widths
        var sumOfAllCols = 0;
        $.each(colWidths, function (i, colWidth) {
            sumOfAllCols += colWidth;
        });

        tbl.css({
            "table-layout": "fixed",
            "width": sumOfAllCols + "px"
        });

        var existingCols = getColElements(tbl);

        $.each(colWidths, function (i, colWidth) {
            //Ensure the i-th COL element exists and has the correct width
            var col = existingCols.eq(i);
            if (!col.length) {
                var colgroup = jpvs.writeTag(tbl, "colgroup");
                col = jpvs.writeTag(colgroup, "col");
            }

            col.css("width", colWidth + "px");
        });

        //Set overflow: hidden on all cells
        tbl.find(allCellsSelector).css("overflow", "hidden");
    }

    function quickGetWidth(element) {
        //Avoid the jQuery width() function, which is painfully slow because it has to take the content box model
        //into account.
        //If the width is set in CSS in px, then this function performs much faster
        return parseFloat(element.style.width);
    }
    
    function handleCellBorderDragging(extender) {
        var draggingCol;
        var draggingCol_FH;         //Matching COL in the fixed floating header, if any
        var draggingColIndex;
        var originalTableX;
        var originalColWidth;
        var originalSumOfAllColWidths;

        var newColWidth;
        
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;
        var scrollingContainer = getScrollingContainer(tbl);
        var lastEventParams;

        //Same behavior on the floating header clone, if present
        if (extender.floatingHeaderClone)
            tbl = tbl.add(extender.floatingHeaderClone);

        tbl.off("mousedown.jpvsTableExtender2").on("mousedown.jpvsTableExtender2", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);

            //Coordinates, relative to the table
            //We use tbl.eq(0) because "tbl" might contain either tableElement or tableElement+floatingHeaderClone
            var tblOffset = tbl.eq(0).offset();
            var tableX = e.pageX - tblOffset.left;

            //Coordinates, relative to the cell
            var cellOffset = cell.offset();
            var relX = e.pageX - cellOffset.left;

            if (isResizingLeftBorder(cell, relX)) {
                //The cell we are resizing is the previous one
                startResizing(cell.prev(), tableX);

                //Stop propagation: this event has been fully handled now
                return false;
            }
            else if (isResizingRightBorder(cell, relX)) {
                //This is the cell we are resizing
                startResizing(cell, tableX);

                //Stop propagation: this event has been fully handled now
                return false;
            }
        });

        $(document).off("mousemove.jpvsTableExtender2" + extender.uniqueName).on("mousemove.jpvsTableExtender2" + extender.uniqueName, function (e) {
            if (draggingCol) {
                //Coordinates, relative to the table
                //We use tbl.eq(0) because "tbl" might contain either tableElement or tableElement+floatingHeaderClone
                var tblOffset = tbl.eq(0).offset();
                var tableX = e.pageX - tblOffset.left;

                //Resize the COL element. Let's set a minimum so the column can be easily restored
                var totalDeltaX = tableX - originalTableX;
                newColWidth = Math.max(originalColWidth + totalDeltaX, 2 * handleToleranceX);

                //Only apply the new col width as a visual cue, not as the real col width, so we avoid wasting
                //CPU resources on lengthy table relayouting
                applyNewColWidth(false, e);
            }
        });

        $(document).off("mouseup.jpvsTableExtender2" + extender.uniqueName).on("mouseup.jpvsTableExtender2" + extender.uniqueName, function (e) {
            //End dragging, if active
            if (draggingCol) {
                //Apply the new col width
                applyNewColWidth(true, e);
                
                if(lastEventParams) {
                    //Fire one last event
                    lastEventParams.resizing = false;
                    extender.afterResize.fire(extender, null, lastEventParams);
                    draggingCol = null;
                    draggingCol_FH = null;

                    //Stop propagation: this event has been fully handled now
                    return false;
                }
            }
        });

        function startResizing(cell, tableX) {
            //What COL are we resizing?
            var leftBorderIndex = getLeftBorderIndex(cell);
            var colIndex = leftBorderIndex + getColSpan(cell) - 1;
            var cols = getColElements(tbl);
            var cols_FH = extender.floatingHeaderClone && getColElements(extender.floatingHeaderClone);

            draggingCol = cols.eq(colIndex);
            draggingCol_FH = cols_FH.eq(colIndex);
            draggingColIndex = colIndex;
            originalTableX = tableX;
            originalColWidth = quickGetWidth(draggingCol[0]);
            newColWidth = originalColWidth;
            
            originalSumOfAllColWidths = 0;
            cols.each(function () {
                originalSumOfAllColWidths += quickGetWidth(this);
            });

            lastEventParams = null;
        }

        function applyNewColWidth(reallyVisuallyApply, e) {
            //Resize the table
            var newTblWidth = originalSumOfAllColWidths - originalColWidth + newColWidth;

            if(reallyVisuallyApply) {
                tbl.css("width", newTblWidth + "px");
                draggingCol.css("width", newColWidth + "px");
                draggingCol_FH.css("width", newColWidth + "px");
                
                //Delete the visual cue, if present
                if(extender.verticalResizingCue) {
                    extender.verticalResizingCue.remove();
                    extender.verticalResizingCue = null;
                }
            }
            else {
                //Use a visual cue (a vertical line)
                if(!extender.verticalResizingCue) {
                    extender.verticalResizingCue = jpvs.writeTag("body", "div").css({
                        position: "absolute",
                        height: tbl.height() + "px",
                        width: "0px",
                        top: tbl.offset().top + "px",
                        "border-right": "1px dotted #f00"
                    });                        
                }
                
                extender.verticalResizingCue.css("left", e.pageX + "px");
            }
            
            //If required, persist column sizes
            if (extender.persistColumnSizes())
                saveColSizesIntoStorage(extender, draggingCol, draggingColIndex, newColWidth);

            //Fire event
            lastEventParams = {
                newTableWidth: newTblWidth,
                columnIndex: draggingColIndex,
                newColumnWidth: newColWidth,
                resizing: true
            };

            extender.afterResize.fire(extender, null, lastEventParams);
        }
    }

    function loadSavedSizesFromStorage(tbl) {
        if (window.localStorage) {
            //Load from localstorage
            var tableName = tbl.data("tableName") || "__GenericTable__";
            var savedObjectAsString = localStorage["jpvs.TableExtenders.Sizes." + tableName];
            var savedObject = savedObjectAsString ? jpvs.parseJSON(savedObjectAsString) : {};
            savedObject = savedObject || {};
            return savedObject;
        }
        else
            return {};
    }

    function loadColSizesFromStorage(extender) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        if (window.localStorage) {
            //Load from localstorage
            var savedObject = loadSavedSizesFromStorage(tbl);

            //Load and apply column sizes
            var sumOfAllCols = 0;
            var cols = getColElements(tbl);
            cols.each(function (colIndex) {
                var col = $(this);
                var colName = col.data("colName") || ("ColIndex" + colIndex);
                var colWidth = savedObject[colName] || col.width();

                col.css("width", colWidth + "px");
                sumOfAllCols += colWidth;
            });

            //Set table width
            tbl.css("width", sumOfAllCols + "px");
        }
    }

    function saveColSizesIntoStorage(extender, col, colIndex, width) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        if (window.localStorage) {
            var cols = getColElements(tbl);

            var savedObject = loadSavedSizesFromStorage(tbl);
            var colName = col.data("colName") || ("ColIndex" + colIndex);

            savedObject[colName] = width;

            var savedObjectAsString = jpvs.toJSON(savedObject);

            //Save into localstorage
            var tableName = tbl.data("tableName") || "__GenericTable__";
            localStorage["jpvs.TableExtenders.Sizes." + tableName] = savedObjectAsString;
        }
    }

    function activateFilterSort(extender) {
        var tbl = extender.tableElement;
        var allHeaderCellsSelector = extender.allHeaderCellsSelector;

        //Same behavior on the floating header clone, if present
        if (extender.floatingHeaderClone)
            tbl = tbl.add(extender.floatingHeaderClone);

        //Handle sorting filtering visual cues
        tbl.off("mousemove.jpvsTableExtender3").on("mousemove.jpvsTableExtender3", allHeaderCellsSelector, function (e) {
            var cell = $(e.currentTarget);

            if (isFilteringAndOrSorting(extender, cell, e))
                cell.addClass("SortOrFilter");
            else
                cell.removeClass("SortOrFilter");
        });

        tbl.off("mouseleave.jpvsTableExtender3").on("mouseleave.jpvsTableExtender3", allHeaderCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            cell.removeClass("SortOrFilter");
        });

        //Handle sorting/filtering requests
        tbl.off("mousedown.jpvsTableExtender3").on("mousedown.jpvsTableExtender3", allHeaderCellsSelector, function (e) {
            var cell = $(e.currentTarget);

            if (isFilteringAndOrSorting(extender, cell, e)) {
                openFilterSortPopup(extender, cell);

                //Stop propagation: this event has been fully handled now
                return false;
            }
        });
    }

    function isFilteringAndOrSorting(extender, cell, e) {
        var tbl = extender.tableElement;

        //Coordinates, relative to the cell
        var cellOffset = cell.offset();
        var relX = e.pageX - cellOffset.left;

        //What COL are we filtering/sorting?
        var leftBorderIndex = getLeftBorderIndex(cell);
        var cols = getColElements(tbl);
        var colElement = cols.eq(leftBorderIndex);

        //It's a sorting/filtering only if sorting/filter is enabled AND, based on pointer position, this is not a resize
        //Keep into account whether or not sorting/filtering is disabled for this particular cell
        var isSorting = extender.enableSorting() && isTrueFilterSort(colElement, "colSort");
        var isFiltering = extender.enableFiltering() && isTrueFilterSort(colElement, "colFilter");
        var sortingOrFiltering = isSorting || isFiltering;

        var isNotResizing = !isResizingLeftBorder(cell, relX) && !isResizingRightBorder(cell, relX);
        return sortingOrFiltering && isNotResizing;
    }

    function isTrueFilterSort(colElement, dataAttrName) {
        var dataAttr = colElement.data(dataAttrName);

        //If missing, we assume a default value of true
        if (dataAttr == null)
            return true;
        else if (dataAttr == "true" || dataAttr == true)
            return true;
        else if (dataAttr == "false" || dataAttr == false)
            return false;
        else
            return true;
    }

    function openFilterSortPopup(extender, cell) {
        var tbl = extender.tableElement;

        extender.sortSettings = extender.sortSettings || [];
        extender.filterSettings = extender.filterSettings || [];

        //What COL are we filtering/sorting?
        var leftBorderIndex = getLeftBorderIndex(cell);
        var cols = getColElements(tbl);
        var colElement = cols.eq(leftBorderIndex);

        var isSorting = extender.enableSorting() && isTrueFilterSort(colElement, "colSort");
        var isFiltering = extender.enableFiltering() && isTrueFilterSort(colElement, "colFilter");

        var colName = colElement.data("colName") || leftBorderIndex.toString();
        var colHeader = colElement.data("colHeader") || colName;

        //Open the popup
        var popTitle = "???";
        if (extender.enableSorting() && extender.enableFiltering())
            popTitle = jpvs.DataGrid.strings.titleSortAndFilter;
        else if (extender.enableSorting())
            popTitle = jpvs.DataGrid.strings.titleSort;
        else if (extender.enableFiltering())
            popTitle = jpvs.DataGrid.strings.titleFilter;

        var pop = jpvs.Popup.create().title(popTitle).close(onClosePopup);

        //Section with column details
        jpvs.write(pop, jpvs.DataGrid.strings.currentColumn + ": ");
        jpvs.writeTag(pop, "strong", colHeader);
        jpvs.write(pop, "\u00a0\u00a0\u00a0");

        if (isFiltering)
            jpvs.LinkButton.create(pop).text(jpvs.DataGrid.strings.addFilter).click(onAddFilter);

        jpvs.write(pop, "\u00a0\u00a0\u00a0");

        if (isSorting)
            jpvs.LinkButton.create(pop).text(jpvs.DataGrid.strings.addSort).click(onAddSort);

        jpvs.writeln(pop);

        //Section with filtering info
        var tblFilter;
        if (isFiltering) {
            jpvs.writeTag(pop, "hr");
            tblFilter = jpvs.Table.create(pop);
            writeFilterSettings();
        }

        //Section with sorting info
        var tblSort;
        if (isSorting) {
            jpvs.writeTag(pop, "hr");
            tblSort = jpvs.Table.create(pop);
            writeSortSettings();
        }

        //Finally, show the popup
        pop.show();

        function onAddFilter() {
            extender.filterSettings.push({
                colName: colName,
                colHeader: colHeader,
                operand: "EQ",
                value: ""
            });

            //Refresh
            writeFilterSettings();
        }

        function onAddSort() {
            extender.sortSettings.push({
                colName: colName,
                colHeader: colHeader,
                descending: false
            });

            //Refresh
            writeSortSettings();
        }

        function writeFilterSettings() {
            //Clear and rewrite
            tblFilter.clear();

            if (extender.filterSettings.length) {
                for (var i = 0; i < extender.filterSettings.length; i++) {
                    var item = extender.filterSettings[i];
                    writeFilterSettingsRow(item, i);
                }
            }
            else {
                var row = tblFilter.writeRow();
                jpvs.write(row.writeCell(), jpvs.DataGrid.strings.noFilterSpecified);
            }
        }

        function writeFilterSettingsRow(item, itemIndex) {
            //(field name) COMBO (operand), TEXTBOX (value), Remove button
            var row = tblFilter.writeRow();

            jpvs.write(row.writeCell(), jpvs.DataGrid.strings.condition + ": ");
            jpvs.writeTag(row.writeCell(), "strong", item.colHeader);

            var cmbOp = jpvs.DropDownList.create(row.writeCell());
            cmbOp.addItem("");
            cmbOp.addItems(jpvs.DataGrid.getFilteringOperands());
            cmbOp.selectedValue(item.operand).change(function () { item.operand = this.selectedValue(); });

            var txtValue = jpvs.TextBox.create(row.writeCell());
            txtValue.text(item.value).change(function () { item.value = this.text(); });

            jpvs.LinkButton.create(row.writeCell()).text(jpvs.DataGrid.strings.remove).click(function () {
                //Remove and refresh
                extender.filterSettings.splice(itemIndex, 1);
                writeFilterSettings();
            });
        }

        function writeSortSettings() {
            //Clear and rewrite
            tblSort.clear();

            if (extender.sortSettings.length) {
                for (var i = 0; i < extender.sortSettings.length; i++) {
                    var item = extender.sortSettings[i];
                    writeSortSettingsRow(item, i);
                }

                //Enable manual reordering of sorting rules
                tblSort.element.find("tbody").sortable({
                    handle: "td:first",
                    update: onSortUpdate
                });
            }
            else {
                var row = tblSort.writeRow();
                jpvs.write(row.writeCell(), jpvs.DataGrid.strings.noSortSpecified);
            }
        }

        function onSortUpdate() {
            //Apply the new ordering
            extender.sortSettings = [];
            tblSort.element.find("tr").each(function () {
                var tr = $(this);
                var item = tr.data("item");
                extender.sortSettings.push(item);
            });

            //Refresh
            writeSortSettings();
        }

        function writeSortSettingsRow(item, itemIndex) {
            //MOVE ICON Order by: (field name) CHECKBOX (descending), Remove button
            var row = tblSort.writeRow();
            row.element.data("item", item);

            jpvs.writeTag(row.writeCell().css("cursor", "move"), "img").attr("src", jpvs.Resources.images.moveButton);
            jpvs.write(row.writeCell(), (itemIndex == 0 ? jpvs.DataGrid.strings.orderBy : jpvs.DataGrid.strings.thenBy) + ": ");
            jpvs.writeTag(row.writeCell(), "strong", item.colHeader);
            jpvs.CheckBox.create(row.writeCell()).text(jpvs.DataGrid.strings.descending).checked(item.descending).change(function () { item.descending = this.checked(); });

            jpvs.LinkButton.create(row.writeCell()).text(jpvs.DataGrid.strings.remove).click(function () {
                //Remove and refresh
                extender.sortSettings.splice(itemIndex, 1);
                writeSortSettings();
            });
        }

        function onClosePopup() {
            //Fire the event
            extender.changeFilterSort.fire(extender);
        }
    }

    function createFloatingHeaderClone(extender) {
        //My scrolling container, if any. $(window) otherwise.
        var scrollingContainer = getScrollingContainer(extender.tableElement).css("position", "relative");

        //Destroy and recreate the floating header clone
        if (extender.floatingHeaderClone)
            extender.floatingHeaderClone.remove();

        //Then clone the TABLE with its THEAD and its COL's
        extender.floatingHeaderClone = extender.tableElement.clone(true);
        extender.floatingHeaderClone.children("tbody, tfoot, caption").remove();
        extender.floatingHeaderClone.insertAfter(extender.tableElement);

        //Respond to scrolling events from the scrolling container
        scrollingContainer.off("scroll.jpvsTableExtender4");
        scrollingContainer.on("scroll.jpvsTableExtender4", refreshFloatingHeaderVisibility);

        //Border sizes
        var isWindow = scrollingContainer[0].jpvs;
        var borderLeftSize = isWindow ? 0 : parseInt(scrollingContainer.css("border-left-width"), 10);
        var borderTopSize = isWindow ? 0 : parseInt(scrollingContainer.css("border-top-width"), 10);

        refreshFloatingHeaderVisibility();

        function refreshFloatingHeaderVisibility() {
            //Top-left of the scrolling container. 
            //If it is the $(window) itself, then the top-left of the visible area
            var scXY = scrollingContainer.offset() || { left: scrollingContainer.scrollLeft(), top: scrollingContainer.scrollTop() };

            //Top-left of the internal contents of the scrolling container
            var scXY_WithScroll = {
                left: scXY.left - scrollingContainer.scrollLeft(),
                top: scXY.top - scrollingContainer.scrollTop()
            };

            //Top-left of the table
            var tblXY = extender.tableElement.offset();

            //Coordinates relative to the scrolling container contents (accounting for scroll)
            var tableX = tblXY.left - scXY_WithScroll.left;
            var tableY = tblXY.top - scXY_WithScroll.top;

            //If the header is partially/fully out of sight (vertically), then we show the floatingHeaderClone on top
            //Otherwise, we hide the floatingHeaderClone
            if (scrollingContainer.scrollTop() > tableY) {
                extender.floatingHeaderClone.show().css({
                    position: "absolute",
                    left: (tableX - borderLeftSize) + "px",
                    top: (scrollingContainer.scrollTop() - borderTopSize) + "px",
                    margin: "0px"
                });
            }
            else
                extender.floatingHeaderClone.hide();
        }
    }

})();
;


jpvs.TextBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.TextBox,
    type: "TextBox",
    cssClass: "TextBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "text");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"text\"]");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        }),

        width: jpvs.property({
            get: function () { return this.element.css("width"); },
            set: function (value) { this.element.css("width", value); }
        })
    }
});


;


(function () {

    jpvs.TileBrowser = function (selector) {
        this.attach(selector);

        this.tileClick = jpvs.event(this);
    };

    jpvs.makeWidget({
        widget: jpvs.TileBrowser,
        type: "TileBrowser",
        cssClass: "TileBrowser",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Clear the drawing area
            W.element.empty();

            W.element.css({
                overflow: "hidden"
            });

            //Also create buttons for scrolling/zooming
            var buttonContainer = jpvs.writeTag(W, "div").addClass("Buttons").css({
                overflow: "hidden",
                position: "absolute",
                right: "0px",
                top: "0px",
                bottom: "0px",
                width: "3em",
                zIndex: 99999
            });

            jpvs.writeTag(buttonContainer, "img").addClass("Up").click(onClickCommand(W, "up")).attr("src", jpvs.Resources.images.up).css({
                position: "absolute",
                right: "0px",
                top: "0px",
                width: "100%"
            });

            jpvs.writeTag(buttonContainer, "img").addClass("Down").click(onClickCommand(W, "down")).attr("src", jpvs.Resources.images.down).css({
                position: "absolute",
                right: "0px",
                bottom: "0px",
                width: "100%"
            });

            jpvs.writeTag(buttonContainer, "img").addClass("Plus").click(onClickCommand(W, "plus")).attr("src", jpvs.Resources.images.plus).css({
                position: "absolute",
                right: "0px",
                bottom: "50%",
                width: "100%"
            });

            jpvs.writeTag(buttonContainer, "img").addClass("Minus").click(onClickCommand(W, "minus")).attr("src", jpvs.Resources.images.minus).css({
                position: "absolute",
                right: "0px",
                top: "50%",
                width: "100%"
            });

            W.element.on("click", onClick(W));
            W.element.on("wheel", onWheel(W));
            jpvs.addGestureListener(W.element, null, onGesture(W));
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            refresh: function (flagAnimate) {
                render(this);

                if (flagAnimate)
                    ensureAnimation(this);

                return this;
            },

            startingTile: jpvs.property({
                get: function () {
                    return this.element.data("startingTile");
                },
                set: function (value) {
                    this.element.data("startingTile", value);
                }
            }),

            width: jpvs.property({
                get: function () {
                    return this.element.width();
                },
                set: function (value) {
                    this.element.width(value);
                }
            }),

            height: jpvs.property({
                get: function () {
                    return this.element.height();
                },
                set: function (value) {
                    this.element.height(value);
                }
            }),

            tileWidth: jpvs.property({
                get: function () {
                    var x = this.element.data("tileWidth");
                    return x != null ? x : this.width() / 8;
                },
                set: function (value) {
                    this.element.data("tileWidth", value);
                }
            }),

            tileHeight: jpvs.property({
                get: function () {
                    var x = this.element.data("tileHeight");
                    return x != null ? x : this.tileWidth();
                },
                set: function (value) {
                    this.element.data("tileHeight", value);
                }
            }),

            desiredTileWidth: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredTileWidth");
                    return x != null ? x : this.tileWidth();
                },
                set: function (value) {
                    this.element.data("desiredTileWidth", value);
                }
            }),

            desiredTileHeight: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredTileHeight");
                    return x != null ? x : this.tileHeight();
                },
                set: function (value) {
                    this.element.data("desiredTileHeight", value);
                }
            }),

            tileSpacingHorz: jpvs.property({
                get: function () {
                    var x = this.element.data("tileSpacingHorz");
                    return x != null ? x : this.tileWidth() / 5;
                },
                set: function (value) {
                    this.element.data("tileSpacingHorz", value);
                }
            }),

            tileSpacingVert: jpvs.property({
                get: function () {
                    var x = this.element.data("tileSpacingVert");
                    return x != null ? x : this.tileHeight() / 5;
                },
                set: function (value) {
                    this.element.data("tileSpacingVert", value);
                }
            }),

            originX: jpvs.property({
                get: function () {
                    var x = this.element.data("originX");
                    return x != null ? x : this.width() / 2;
                },
                set: function (value) {
                    this.element.data("originX", value);
                }
            }),

            originY: jpvs.property({
                get: function () {
                    var x = this.element.data("originY");
                    return x != null ? x : this.height() / 2;
                },
                set: function (value) {
                    this.element.data("originY", value);
                }
            }),

            desiredOriginX: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredOriginX");
                    return x != null ? x : this.originX();
                },
                set: function (value) {
                    this.element.data("desiredOriginX", value);
                }
            }),

            desiredOriginY: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredOriginY");
                    return x != null ? x : this.originY();
                },
                set: function (value) {
                    this.element.data("desiredOriginY", value);
                }
            })

        }
    });


    function render(W) {
        //Starting tile; if null, then the tile browser has no tiles and no rendering is needed
        var tile0 = W.startingTile();
        if (!tile0) {
            W.element.children(".Tile").remove();
            return;
        }

        //Get shortcuts
        var w = W.width();
        var h = W.height();
        var tw = W.tileWidth();
        var th = W.tileHeight();
        var sx = W.tileSpacingHorz();
        var sy = W.tileSpacingVert();
        var dx = tw + sx;
        var dy = th + sy;

        var x0 = W.originX();
        var y0 = W.originY();

        //Let's determine the allowed x coordinates
        //We don't want tiles to be cut out by the right/left borders. We lay out tiles at fixed x coordinates
        //The tile browser is free to scroll vertically, however
        //Coordinates (x0, y0) are the coordinates of the tile center
        var x = x0 - tw / 2;
        while (x > 0)
            x -= dx;
        x += dx;

        var allowedXs = [];
        while (x + tw < w) {
            allowedXs.push(x);
            x += dx;
        }

        //Lay tiles over the surface
        var ix = 0;
        x = x0 - tw / 2;

        //Get the allowedX closest to x0
        var minDist = +Infinity;
        for (var j = 0; j < allowedXs.length && Math.abs(allowedXs[j] - x) < minDist; j++)
            minDist = Math.abs(allowedXs[j] - x);
        ix = j - 1;
        ix = Math.max(ix, 0);
        ix = Math.min(ix, allowedXs.length - 1);

        //At every rendering we assign a generation number, useful for cleaning up invisible tiles at the end
        var currentGeneration = 1 + (W.lastRenderedGeneration || 0);
        W.lastRenderedGeneration = currentGeneration;

        //Forward
        var y = y0 - th / 2;
        var tileIndex = 0;
        var ix2 = ix;
        var tileObject = tile0;
        while (tileObject) {
            //Ensure the tile is not clipped out by the right border
            if (ix2 >= allowedXs.length) {
                //Return to left
                ix2 = 0;
                y += dy;

                //We allow tiles to be clipped out by the bottom border, however
                //So, we stop when the tile is completely outside
                if (y >= h)
                    break;
            }

            //Draw the tile
            x = allowedXs[ix2];
            drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration);

            //Increment coordinates
            ix2++;
            tileIndex++;

            //Move to next tile object, if any
            tileObject = tileObject.getNextTile && tileObject.getNextTile();
        }

        //Backwards
        ix2 = ix - 1;
        y = y0 - th / 2;
        tileObject = tile0.getPreviousTile && tile0.getPreviousTile();
        tileIndex = -1;
        while (tileObject) {
            //Ensure the tile is not clipped out by the left border
            if (ix2 < 0) {
                //Return to right
                ix2 = allowedXs.length - 1;
                y -= dy;

                //We allow tiles to be clipped out by the top border, however
                //So, we stop when the tile is completely outside
                if (y + th <= 0)
                    break;
            }

            //Draw the tile
            x = allowedXs[ix2];
            drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration);

            //Decrement coordinates
            ix2--;
            tileIndex--;

            //Move to next tile object, if any
            tileObject = tileObject.getPreviousTile && tileObject.getPreviousTile();
        }

        //Now we must delete tiles that were visible during the last layout but that were not laid out during this one
        //We just delete tiles that do not belong to the current generation
        W.element.children(".Tile").each(function () {
            var $this = $(this);
            var tileObject = $this.data("tileObject");
            var jpvsTileBrowserInfo = tileObject && tileObject.jpvsTileBrowserInfo;
            if (!jpvsTileBrowserInfo || jpvsTileBrowserInfo.generation != currentGeneration) {
                $this.remove();
                tileObject.jpvsTileBrowserInfo = null;
            }
        });
    }

    function isTileVisible(x, y, tw, th, w, h) {
        var x2 = x + tw;
        var y2 = y + th;

        //If at least one of the four corners is visible, then the tile is visible
        function tlVisible() { return 0 <= x && x <= w && 0 <= y && y <= h; }
        function trVisible() { return 0 <= x2 && x2 <= w && 0 <= y && y <= h; }
        function blVisible() { return 0 <= x && x <= w && 0 <= y2 && y2 <= h; }
        function brVisible() { return 0 <= x2 && x2 <= w && 0 <= y2 && y2 <= h; }

        return tlVisible() || trVisible() || blVisible() || brVisible();
    }

    function drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration) {
        if (!tileObject)
            return;

        //If the tile already exists, then simply adjust its coordinates: it's way faster
        var info = tileObject.jpvsTileBrowserInfo;
        if (info) {
            if (isTileVisible(x, y, tw, th, w, h)) {
                var mustRedrawContent = false;

                //OK, let's show it
                if (info.x != x) {
                    info.x = x;
                    info.tile.css("left", x + "px");
                }

                if (info.y != y) {
                    info.y = y;
                    info.tile.css("top", y + "px");
                }

                if (info.tw != tw) {
                    info.tw = tw;
                    info.tile.css("width", tw + "px");

                    //It's not a simple translation, we must also redraw the content
                    mustRedrawContent = true;
                }

                if (info.th != th) {
                    info.th = th;
                    info.tile.css("height", th + "px");

                    //It's not a simple translation, we must also redraw the content
                    mustRedrawContent = true;
                }

                //Let's also redraw if the size has changed
                if (mustRedrawContent)
                    redrawTileContent(info.tile);

                //Also update the generation number
                info.generation = currentGeneration;
            }
            else {
                //The new position is not visible, let's remove the DOM object
                info.tile.remove();
                tileObject.jpvsTileBrowserInfo = null;
            }

            return;
        }

        //Otherwise, we must create the tile
        if (!isTileVisible(x, y, tw, th, w, h))
            return;

        var tile = jpvs.writeTag(W, "div");

        tile.data("tileObject", tileObject);
        tileObject.jpvsTileBrowserInfo = {
            tile: tile,
            x: x,
            y: y,
            tw: tw,
            th: th,
            tileIndex: tileIndex,
            generation: currentGeneration
        };

        tile.addClass("Tile").css({
            position: "absolute",
            left: x + "px",
            top: y + "px",
            width: tw + "px",
            height: th + "px",
            overflow: "hidden"
        });

        redrawTileContent(tile);
        return tile;

        function redrawTileContent(tile) {
            if (tileObject.template)
                jpvs.applyTemplate(tile.empty(), tileObject.template, { tileObject: tileObject, tileBrowser: W, tile: tile });
        }
    }

    function onClickCommand(W, command) {
        var zoomFactor = 1.1;

        return function () {
            if (command == "up")
                W.desiredOriginY(W.desiredOriginY() + W.height() / 4);
            else if (command == "down")
                W.desiredOriginY(W.desiredOriginY() - W.height() / 4);
            else if (command == "plus")
                zoom(W, zoomFactor);
            else if (command == "minus")
                zoom(W, 1 / zoomFactor);

            //Refresh with an animation
            ensureAnimation(W);
        };
    }

    function zoom(W, zoomFactor) {
        var tw = W.desiredTileWidth() * zoomFactor;
        var th = W.desiredTileHeight() * zoomFactor;

        W.desiredTileWidth(tw);
        W.desiredTileHeight(th);

        //Determine the closest-to-center tile
        var w = W.width();
        var h = W.height();
        var xc = w / 2;
        var yc = h / 2;
        var minDist = +Infinity;
        var closestTile;
        var closestTileX, closestTileY;

        W.element.children(".Tile").each(function () {
            var $this = $(this);
            var tileObject = $this.data("tileObject");
            var jpvsTileBrowserInfo = tileObject && tileObject.jpvsTileBrowserInfo;
            if (jpvsTileBrowserInfo) {
                //Tile center
                var tx = jpvsTileBrowserInfo.x + jpvsTileBrowserInfo.tw / 2;
                var ty = jpvsTileBrowserInfo.y + jpvsTileBrowserInfo.th / 2;

                var tileToCenter = (xc - tx) * (xc - tx) + (yc - ty) * (yc - ty);
                if (tileToCenter < minDist) {
                    minDist = tileToCenter;
                    closestTile = tileObject;
                    closestTileX = tx;
                    closestTileY = ty;
                }
            }
        });

        //Change the starting tile to that tile and move originX and originY to the center of that tile, so that this zooming animation
        //is centered on that tile (when we zoom, we want the center tile to stand still)
        //We set both the origin and the desired origin, so that we stop any running scrolling animation 
        //(it could interfere with the zooming animation and the change in starting tile and origin)
        if (closestTile) {
            W.originX(closestTileX);
            W.desiredOriginX(closestTileX);
            W.originY(closestTileY);
            W.desiredOriginY(closestTileY);
            W.startingTile(closestTile);
        }
    }

    function onClick(W) {
        return function (e) {
            var tile = $(e.target).closest(".Tile");
            var tileObject = tile && tile.length && tile.data("tileObject");
            if (tileObject)
                return W.tileClick.fire(W, null, tileObject, e);
        };
    }

    function onWheel(W) {
        return function (e) {
            var deltaY = e && e.originalEvent && e.originalEvent.deltaY || e.originalEvent.deltaX || 0;
            var oldOriginY = W.desiredOriginY();

            if (e.shiftKey) {
                //Zoom
                var zoomFactor = deltaY < 0 ? 1.1 : (1 / 1.1);
                zoom(W, zoomFactor);
            }
            else {
                //Move
                W.desiredOriginY(oldOriginY - deltaY);
            }

            //Refresh with an animation
            ensureAnimation(W);

            //Stop event propagation
            return false;
        };
    }

    function onGesture(W) {
        return function (e) {
            if (e.isDrag) {
                //Drag the touched tile to the touch coordinates
                //Find the touched tileObject (it might be the touch.target or a parent, depending on where the touch happened)
                var tile = $(e.target).closest(".Tile");
                var tileObject = tile && tile.length && tile.data("tileObject");
                var info = tileObject && tileObject.jpvsTileBrowserInfo;
                if (info) {
                    //Ensure the starting tile is the touched one (change also the origin, so we move nothing)
                    if (tileObject !== W.startingTile()) {
                        var orX = info.x + info.tw / 2;
                        var orY = info.y + info.th / 2;

                        W.originX(orX);
                        W.originY(orY);
                        W.desiredOriginX(orX);
                        W.desiredOriginY(orY);
                        W.startingTile(tileObject);
                    }

                    //Then have the desired origin follow dragX/dragY, so the touched tile follows the touch
                    var orX = W.desiredOriginX() + e.dragX;
                    var orY = W.desiredOriginY() + e.dragY;
                    W.desiredOriginX(orX);
                    W.desiredOriginY(orY);

                    //Refresh with an animation
                    ensureAnimation(W);
                }
            }
            else if (e.isZoom) {
                //Zoom as specified
                zoom(W, e.zoomFactor);

                //Refresh with an animation
                ensureAnimation(W);
            }
            else if (e.isTap) {
                //If the user taps a button in the .Buttons div, then let's forward a click to it
                var clickedElem = $(e.target);
                if (clickedElem.is(".Buttons > *")) {
                    clickedElem.click();

                    //If long tap, then we simulate a long click by clicking multiple times
                    if (e.isLongTap) {
                        clickedElem.click();
                        clickedElem.click();
                        clickedElem.click();
                    }
                }
                else {
                    //Find the touched tileObject (it might be the touch.target or a parent, depending on where the touch happened)
                    var tile = $(e.target).closest(".Tile");
                    var tileObject = tile && tile.length && tile.data("tileObject");
                    if (tileObject)
                        return W.tileClick.fire(W, null, tileObject, null);     //We have no browser event to forward here
                }
            }
        };
    }

    function ensureAnimation(W) {
        //See if we must animate
        var deltas = getPixelDeltas();
        if (mustAnimate(deltas)) {
            //Yes, we have a mismatch greater than 1 pixel in origin/tile size, so we must animate
            //Let's determine the final values for our animation
            //If ensureAnimation is called during a running animation, the animation end time is simply moved away. The animation will end a fixed time
            //away from now
            var animationDuration = 500;
            var tNow = new Date().getTime();
            var tEnd = tNow + animationDuration;
            W.animationInfo = {
                x: { tEnd: tEnd, finalValue: W.desiredOriginX(), k: calcAnimationK(tNow, tEnd, W.originX(), W.desiredOriginX()) },
                y: { tEnd: tEnd, finalValue: W.desiredOriginY(), k: calcAnimationK(tNow, tEnd, W.originY(), W.desiredOriginY()) },
                tw: { tEnd: tEnd, finalValue: W.desiredTileWidth(), k: calcAnimationK(tNow, tEnd, W.tileWidth(), W.desiredTileWidth()) },
                th: { tEnd: tEnd, finalValue: W.desiredTileHeight(), k: calcAnimationK(tNow, tEnd, W.tileHeight(), W.desiredTileHeight()) }
            };

            //Now, let's schedule the animation. If already running, then, there's no need to do that
            if (!W.animating)
                jpvs.requestAnimationFrame(animate);
        }

        function mustAnimate(deltas) {
            return (Math.abs(deltas.originX) >= 1 || Math.abs(deltas.originY) >= 1 || Math.abs(deltas.tileWidth) >= 1 || Math.abs(deltas.tileHeight) >= 1);
        }

        function getPixelDeltas() {
            return {
                originX: W.desiredOriginX() - W.originX(),
                originY: W.desiredOriginY() - W.originY(),
                tileWidth: W.desiredTileWidth() - W.tileWidth(),
                tileHeight: W.desiredTileHeight() - W.tileHeight()
            };
        }

        function calcAnimationK(tNow, tEnd, currentValue, finalValue) {
            //Parabolic animation
            var delta = currentValue - finalValue;
            var dt = tEnd - tNow;
            var k = delta / dt / dt;
            return k;
        }

        function calcNewAnimatedValue(tNow, tEnd, k, finalValue) {
            if (tNow >= tEnd) {
                //We are past the end of the animation
                return finalValue;
            }
            else {
                //We are still animating
                var dt = tEnd - tNow;
                var currentDelta = k * dt * dt;
                var currentValue = finalValue + currentDelta;
                return currentValue;
            }
        }

        function animate() {
            //If end of animation, then no more work to do
            if (!W.animationInfo) {
                W.animating = false;
                return;
            }

            W.animating = true;

            //Let's apply the new values
            var tNow = new Date().getTime();
            W.originX(calcNewAnimatedValue(tNow, W.animationInfo.x.tEnd, W.animationInfo.x.k, W.animationInfo.x.finalValue));
            W.originY(calcNewAnimatedValue(tNow, W.animationInfo.y.tEnd, W.animationInfo.y.k, W.animationInfo.y.finalValue));
            W.tileWidth(calcNewAnimatedValue(tNow, W.animationInfo.tw.tEnd, W.animationInfo.tw.k, W.animationInfo.tw.finalValue));
            W.tileHeight(calcNewAnimatedValue(tNow, W.animationInfo.th.tEnd, W.animationInfo.th.k, W.animationInfo.th.finalValue));

            //Render the frame
            render(W);

            //See if the animation is done
            if (tNow > W.animationInfo.x.tEnd && tNow > W.animationInfo.y.tEnd && tNow > W.animationInfo.tw.tEnd && tNow > W.animationInfo.th.tEnd)
                W.animationInfo = null;

            //Schedule next animation frame (if done, the animation will stop)
            jpvs.requestAnimationFrame(animate);
        }
    }

})();
;


(function () {

    jpvs.Tree = function (selector) {
        this.attach(selector);

        this.nodeClick = jpvs.event(this);
        this.nodeRightClick = jpvs.event(this);
        this.nodeRendered = jpvs.event(this);
    };


    jpvs.Tree.Templates = {
        StandardNode: function (node) {
            //Main node element
            var element = jpvs.writeTag(this, "div");
            element.addClass("Node");

            //NodeElement object, carrying all the information
            var nodeElement = new jpvs.Tree.NodeElement(node, element, refreshNodeState, selectNode, refreshNodeInfo);

            //Image button with the state (open/closed/not-openable)
            jpvs.ImageButton.create(element).click(function () {
                //Toggle on click
                nodeElement.toggle();
            });

            //Optional node marker
            if (node.marker) {
                var imgMarker = jpvs.writeTag(element, "img")
                imgMarker.addClass("Marker");
                imgMarker.attr("src", node.marker);
            }

            //Optional node icon
            if (node.icon) {
                var imgIcon = jpvs.writeTag(element, "img")
                imgIcon.addClass("Icon");
                imgIcon.attr("src", node.icon);
            }

            //Node text
            var txt = jpvs.writeTag(element, "span").addClass("Text");
            jpvs.write(txt, node.toString());

            //Events
            var mouseDownTime;
            var tree = nodeElement.getTree();
            txt.dblclick(function () {
                //Toggle on double click
                nodeElement.toggle();
            }).mousedown(function (e) {
                //Let's save the current time, so we can decide in "mouseup" when the sequence mousedown/up can
                //be considered a real click. We do this so we make drag & drop possible without triggering nodeClick and
                //nodeRightClick. We want our nodeClick and nodeRightClick events to be triggered only when a "real" click occurred.
                //A "real" click is a mousedown/up sequence shorter than 0.5 secs. If it's longer, then the user is probably not
                //clicking but dragging.
                mouseDownTime = new Date().getTime();
            }).mouseup(function (e) {
                //Let's determine if this is a "real" click
                var mouseUpTime = new Date().getTime();
                if (mouseUpTime > mouseDownTime + 500) {
                    //Not a "real" click
                    return;
                }

                //If it's a real click...
                if (e.button == 2) {
                    //...select and fire event on right-click
                    nodeElement.select();
                    tree.nodeRightClick.fire(tree, null, nodeElement, e);

                    //Prevent standard browser context-menu
                    return false;
                }
                else {
                    //...select and fire event on click
                    nodeElement.select();
                    tree.nodeClick.fire(tree, null, nodeElement, e);
                }
            });

            return nodeElement;

            //Function for refreshing the node's state (open/close image button)
            //This function will run with this set to the current NodeElement
            function refreshNodeState() {
                var imageButton = jpvs.find(this.element.find(".ImageButton"));

                if (this.childrenNodeElements && this.childrenNodeElements.length != 0) {
                    //Has children
                    if (this.isExpanded()) {
                        if (imageButton) {
                            imageButton.imageUrls({
                                normal: jpvs.Resources.images.nodeOpen
                            });
                        }
                    }
                    else {
                        if (imageButton) {
                            imageButton.imageUrls({
                                normal: jpvs.Resources.images.nodeClosed
                            });
                        }
                    }
                }
                else {
                    //Has no children
                    if (imageButton) {
                        imageButton.imageUrls({
                            normal: jpvs.Resources.images.nodeNoChildren
                        });
                    }

                    //Force invisibility anyway
                    this.childrenContainerElement.element.hide();
                }
            }

            //Function for selecting a node
            //This function will run with this set to the current NodeElement
            function selectNode() {
                var tree = this.getTree();

                //Unselect all
                tree.element.find(".Node > .Text").removeClass("Selected");

                //Select this
                this.element.find(".Text").addClass("Selected");
            }

            //Function for refreshing the node (icon, text, ...)
            //This function will run with this set to the current NodeElement
            function refreshNodeInfo() {
                var node = this.node;
                var icon = this.element.find("img.Icon");
                var text = this.element.find("span.Text");

                icon.attr("src", node.icon);
                text.text(node.toString());
            }

        },

        StandardChildrenContainer: function (node) {
            var element = jpvs.writeTag(this, "div");
            element.addClass("ChildrenContainer");
            element.hide();

            var childrenContainerElement = new jpvs.Tree.ChildrenContainerElement(node, element);
            return childrenContainerElement;
        }
    };


    jpvs.Tree.NodeElement = function (node, element, refreshStateFunc, selectNodeFunc, refreshNodeFunc) {
        this.node = node;
        this.element = element;
        this.refreshState = refreshStateFunc;
        this.refreshNode = refreshNodeFunc;
        this.select = selectNodeFunc;

        this.parentNodeElement = null;              //Attached during rendering
        this.childrenContainerElement = null;       //Attached during rendering
        this.childrenNodeElements = null;           //Attached during rendering
    };

    jpvs.Tree.NodeElement.prototype.getTree = function () {
        //Find the tree
        return jpvs.find(this.element.parents(".Tree").first());
    };

    jpvs.Tree.NodeElement.prototype.isExpanded = function () {
        return this.childrenContainerElement.element.is(":visible");
    };

    jpvs.Tree.NodeElement.prototype.toggle = function () {
        if (this.isExpanded())
            this.collapse();
        else
            this.expand();
    };

    jpvs.Tree.NodeElement.prototype.collapse = function () {
        var nodeElem = this;
        this.childrenContainerElement.element.hide(100, function () { nodeElem.refreshState(); });
    };

    jpvs.Tree.NodeElement.prototype.expand = function (callback) {
        var nodeElem = this;
        var tree = this.getTree();

        //Let's load/reload/refresh children
        if (tree) {
            tree.refreshChildren(nodeElem, function () {
                if (nodeElem.childrenNodeElements && nodeElem.childrenNodeElements.length != 0) {
                    //Expand only if we have children
                    nodeElem.childrenContainerElement.element.show(100, function () {
                        nodeElem.refreshState();
                        if (callback)
                            callback();
                    });
                }
                else {
                    //Otherwise let's just refresh the state
                    nodeElem.refreshState();
                    if (callback)
                        callback();
                }
            });
        }
    };

    jpvs.Tree.NodeElement.prototype.setMarkerIcon = function (imgUrl) {
        var img = this.element.find("img.Marker");
        img.attr("src", imgUrl);
    };


    jpvs.Tree.ChildrenContainerElement = function (node, element) {
        this.node = node;
        this.element = element;
        this.nodeElement = null;                    //Attached during rendering
    };


    jpvs.makeWidget({
        widget: jpvs.Tree,
        type: "Tree",
        cssClass: "Tree",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //All over the tree, we don't want the standard browser right-click behavior, because the tree has its own "nodeRightClick" event
            W.element.on("contextmenu", function () {
                return false;
            });
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            nodeTemplate: jpvs.property({
                get: function () {
                    return this.element.data("nodeTemplate");
                },
                set: function (value) {
                    this.element.data("nodeTemplate", value);
                }
            }),

            childrenContainerTemplate: jpvs.property({
                get: function () {
                    return this.element.data("childrenContainerTemplate");
                },
                set: function (value) {
                    this.element.data("childrenContainerTemplate", value);
                }
            }),

            childrenSelector: jpvs.property({
                get: function () {
                    return this.element.data("childrenSelector");
                },
                set: function (value) {
                    this.element.data("childrenSelector", value);
                }
            }),

            dataBind: function (data) {
                dataBind(this, data);
                return this;
            },

            refreshNode: function (nodeElement) {
                refreshNode(this, nodeElement);
                return this;
            },

            refreshChildren: function (nodeElement, callback) {
                refreshChildren(this, nodeElement, callback);
                return this;
            },

            nodeElements: function () {
                return this.element.data("nodeElements");
            }
        }
    });


    function dataBind(W, data) {
        //Empty the object
        W.element.empty();

        //Then iterate over the data and populate the tree according to the templates that have been set
        var nodeElements = [];
        $.each(data, function (i, node) {
            var nodeElement = renderNode(W, W.element, node, null);
            nodeElements.push(nodeElement);
        });

        //Store nodeElements for later
        W.element.data("nodeElements", nodeElements);
    }

    function readChildren(W, node, callback) {
        //Let's use the default children selector, if none specified
        var childrenSelector = W.childrenSelector() || function (node) { return node.children || []; };

        //Let's call the selector, which might be either synchronous or asynchronous
        var ret = childrenSelector(node, internalCallback);

        //Let's see what happened within the selector
        if (ret === undefined) {
            //No return value. The selector is asynchronous and the internalCallback will receive the data
        }
        else if (ret === null) {
            //The selector is synchronous and returned no data
            callback([]);
        }
        else {
            //The selector is synchronous and returned some data
            callback(ret);
        }

        function internalCallback(data) {
            //null means no data, so let's return an empty array in that case
            callback(data || []);
        }
    }

    function renderNode(W, elem, node, parentNodeElement) {
        //Render the node itself
        var nodeTemplate = W.nodeTemplate() || jpvs.Tree.Templates.StandardNode;
        var nodeElement = jpvs.applyTemplate(elem, nodeTemplate, node);

        //Save for later
        nodeElement.element.data("nodeElement", nodeElement);

        //Render the children container
        //And leave it intentionally empty, so we can load it dynamically later
        var childrenContainerTemplate = W.childrenContainerTemplate() || jpvs.Tree.Templates.StandardChildrenContainer;
        var childrenContainerElement = jpvs.applyTemplate(elem, childrenContainerTemplate, node);

        //Attach elements to each other
        nodeElement.parentNodeElement = parentNodeElement;
        nodeElement.childrenContainerElement = childrenContainerElement;
        nodeElement.childrenNodeElements = [{}];      //We will load this dynamically later; let's leave a dummy node

        childrenContainerElement.nodeElement = nodeElement;

        //Refresh the node state so the icons are initially correct based on children/visibility/etc.
        nodeElement.refreshState();

        //Let's notify anyone who could be interested in modifying a newly-rendered node
        //It's a good chance to enable drag & drop on nodes, if necessary
        W.nodeRendered.fire(W, null, nodeElement);

        //Return the nodeElement
        return nodeElement;
    }

    function refreshNode(W, nodeElement) {
        nodeElement.refreshState();
        nodeElement.refreshNode();
    }

    function refreshChildren(W, nodeElement, callback) {
        //Reload children
        readChildren(W, nodeElement.node, function (children) {
            //When we have the children, we must re-populate the children container
            var childrenContainerElement = nodeElement.childrenContainerElement;

            //Let's empty it, without changing its visibility (expanded/collapsed state)
            childrenContainerElement.element.empty();

            //Then let's fill it again with the new data
            fillChildrenContainer(W, childrenContainerElement, children, nodeElement);

            //At the end, call the callback
            if (callback)
                callback();
        });
    }

    function fillChildrenContainer(W, childrenContainerElement, children, parentNodeElement) {
        var childrenNodeElements = [];
        $.each(children, function (i, childNode) {
            var childrenNodeElement = renderNode(W, childrenContainerElement.element, childNode, parentNodeElement);
            childrenNodeElements.push(childrenNodeElement);
        });

        //Attach the new list of children node elements
        parentNodeElement.childrenNodeElements = childrenNodeElements;
    }

})();
;


//! moment.js
//! version : 2.15.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return input != null && Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        var k;
        for (k in obj) {
            // even if its not own property I'd still call it non-empty
            return false;
        }
        return true;
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false,
            parsedDateParts : [],
            meridiem        : null
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            var isNowValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid = isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            }
            else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    function isUndefined(input) {
        return input === void 0;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (utils_hooks__hooks.deprecationHandler != null) {
                utils_hooks__hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [];
                var arg;
                for (var i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (var key in arguments[0]) {
                            arg += key + ': ' + arguments[0][key] + ', ';
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (utils_hooks__hooks.deprecationHandler != null) {
            utils_hooks__hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;
    utils_hooks__hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({unit: u, priority: priorities[u]});
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function get_set__set (mom, unit, value) {
        if (mom.isValid()) {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    // MOMENTS

    function stringGet (units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet (units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        if (!m) {
            return this._months;
        }
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        if (!m) {
            return this._monthsShort;
        }
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function units_month__handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = create_utc__createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return units_month__handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (typeof value !== 'number') {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));

        //the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        if (!m) {
            return this._weekdays;
        }
        return isArray(this._weekdays) ? this._weekdays[m.day()] :
            this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
    }

    function day_of_week__handleStrictParse(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = create_utc__createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return day_of_week__handleStrictParse.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = create_utc__createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        ordinalParse: defaultOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            var parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    // treat as if there is no base config
                    deprecateSimple('parentLocaleUndefined',
                            'specified parentLocale is not defined yet. See http://momentjs.com/guides/#/warnings/parent-locale/');
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, parentConfig = baseConfig;
            // MERGE
            if (locales[name] != null) {
                parentConfig = locales[name]._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function locale_locales__listLocales() {
        return keys(locales);
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized ISO format. moment construction falls back to js Date(), ' +
        'which is not reliable across all browsers and versions. Non ISO date formats are ' +
        'discouraged and will be removed in an upcoming major release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(utils_hooks__hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (isDate(input)) {
            config._d = input;
        } else if (format) {
            configFromStringAndFormat(config);
        }  else {
            configFromInput(config);
        }

        if (!valid__isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date(utils_hooks__hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = ((string || '').match(matcher) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : local__createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
            } else if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);

            if (tZone === 0) {
                this.utcOffset(0, true);
            } else {
                this.utcOffset(offsetFromString(matchOffset, this._i));
            }
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? local__createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])                         * sign,
                h  : toInt(match[HOUR])                         * sign,
                m  : toInt(match[MINUTE])                       * sign,
                s  : toInt(match[SECOND])                       * sign,
                ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function moment_calendar__calendar (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = utils_hooks__hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween (from, to, units, inclusivity) {
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input,units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input,units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            delta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    utils_hooks__hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if (isFunction(Date.prototype.toISOString)) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? utils_hooks__hooks.defaultFormatUtc : utils_hooks__hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(local__createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
            case 'date':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }

        // 'date' is an alias for 'day', so it should be considered as such.
        if (units === 'date') {
            units = 'day';
        }

        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
        return new Date(this.valueOf());
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIOROITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add               = add_subtract__add;
    momentPrototype__proto.calendar          = moment_calendar__calendar;
    momentPrototype__proto.clone             = clone;
    momentPrototype__proto.diff              = diff;
    momentPrototype__proto.endOf             = endOf;
    momentPrototype__proto.format            = format;
    momentPrototype__proto.from              = from;
    momentPrototype__proto.fromNow           = fromNow;
    momentPrototype__proto.to                = to;
    momentPrototype__proto.toNow             = toNow;
    momentPrototype__proto.get               = stringGet;
    momentPrototype__proto.invalidAt         = invalidAt;
    momentPrototype__proto.isAfter           = isAfter;
    momentPrototype__proto.isBefore          = isBefore;
    momentPrototype__proto.isBetween         = isBetween;
    momentPrototype__proto.isSame            = isSame;
    momentPrototype__proto.isSameOrAfter     = isSameOrAfter;
    momentPrototype__proto.isSameOrBefore    = isSameOrBefore;
    momentPrototype__proto.isValid           = moment_valid__isValid;
    momentPrototype__proto.lang              = lang;
    momentPrototype__proto.locale            = locale;
    momentPrototype__proto.localeData        = localeData;
    momentPrototype__proto.max               = prototypeMax;
    momentPrototype__proto.min               = prototypeMin;
    momentPrototype__proto.parsingFlags      = parsingFlags;
    momentPrototype__proto.set               = stringSet;
    momentPrototype__proto.startOf           = startOf;
    momentPrototype__proto.subtract          = add_subtract__subtract;
    momentPrototype__proto.toArray           = toArray;
    momentPrototype__proto.toObject          = toObject;
    momentPrototype__proto.toDate            = toDate;
    momentPrototype__proto.toISOString       = moment_format__toISOString;
    momentPrototype__proto.toJSON            = toJSON;
    momentPrototype__proto.toString          = toString;
    momentPrototype__proto.unix              = unix;
    momentPrototype__proto.valueOf           = to_type__valueOf;
    momentPrototype__proto.creationData      = creationData;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    momentPrototype__proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
        return string;
    }

    var prototype__proto = Locale.prototype;

    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto.ordinal         = ordinal;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months            =        localeMonths;
    prototype__proto.monthsShort       =        localeMonthsShort;
    prototype__proto.monthsParse       =        localeMonthsParse;
    prototype__proto.monthsRegex       = monthsRegex;
    prototype__proto.monthsShortRegex  = monthsShortRegex;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    prototype__proto.weekdaysRegex       =        weekdaysRegex;
    prototype__proto.weekdaysShortRegex  =        weekdaysShortRegex;
    prototype__proto.weekdaysMinRegex    =        weekdaysMinRegex;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = lists__get(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = locale_locales__getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return lists__get(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = lists__get(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function lists__listMonthsShort (format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function lists__listWeekdays (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function lists__listWeekdaysShort (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function lists__listWeekdaysMin (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes <= 1           && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   <= 1           && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    <= 1           && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  <= 1           && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   <= 1           && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function duration_humanize__getSetRelativeTimeRounding (roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof(roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        var seconds = iso_string__abs(this._milliseconds) / 1000;
        var days         = iso_string__abs(this._days);
        var months       = iso_string__abs(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds;
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.15.1';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.now                   = now;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.updateLocale          = updateLocale;
    utils_hooks__hooks.locales               = locale_locales__listLocales;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeRounding = duration_humanize__getSetRelativeTimeRounding;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;
    utils_hooks__hooks.calendarFormat        = getCalendarFormat;
    utils_hooks__hooks.prototype             = momentPrototype;

    var _moment = utils_hooks__hooks;

    return _moment;

}));;


//! moment.js locale configuration
//! locale : Italian [it]
//! author : Lorenzo : https://github.com/aliem
//! author: Mattia Larentis: https://github.com/nostalgiaz

;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, function (moment) { 'use strict';


    var it = moment.defineLocale('it', {
        months : 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
        monthsShort : 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
        weekdays : 'Domenica_Lunedì_Martedì_Mercoledì_Giovedì_Venerdì_Sabato'.split('_'),
        weekdaysShort : 'Dom_Lun_Mar_Mer_Gio_Ven_Sab'.split('_'),
        weekdaysMin : 'Do_Lu_Ma_Me_Gi_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY HH:mm',
            LLLL : 'dddd, D MMMM YYYY HH:mm'
        },
        calendar : {
            sameDay: '[Oggi alle] LT',
            nextDay: '[Domani alle] LT',
            nextWeek: 'dddd [alle] LT',
            lastDay: '[Ieri alle] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[la scorsa] dddd [alle] LT';
                    default:
                        return '[lo scorso] dddd [alle] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : function (s) {
                return ((/^[0-9].+$/).test(s) ? 'tra' : 'in') + ' ' + s;
            },
            past : '%s fa',
            s : 'alcuni secondi',
            m : 'un minuto',
            mm : '%d minuti',
            h : 'un\'ora',
            hh : '%d ore',
            d : 'un giorno',
            dd : '%d giorni',
            M : 'un mese',
            MM : '%d mesi',
            y : 'un anno',
            yy : '%d anni'
        },
        ordinalParse : /\d{1,2}º/,
        ordinal: '%dº',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });

    return it;

}));