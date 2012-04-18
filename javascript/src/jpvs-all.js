/* JPVS
Module: bootstrap
*/

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

/* JPVS
Module: animations
Classes: 
Depends: core
*/

(function () {

    // shim layer with setTimeout fallback
    var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
        window.setTimeout(callback, 1000 / 60);
    };

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

})();

/* JPVS
Module: utils
Classes: 
Depends: core
*/

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

/* JPVS
Module: core
Classes: jpvs
Depends: bootstrap
*/

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
    return function (value) {
        if (value === undefined)
            return propdef.get.call(this);
        else {
            propdef.set.call(this, value);
            return this;
        }
    };
};

jpvs.currentLocale = (function () {
    var curLoc = "en";

    return jpvs.property({
        get: function () { return curLoc; },
        set: function (value) { curLoc = value; }
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
            if (widgetDef.destroy)
                widgetDef.destroy.call(this, this);

            this.element.remove();
        };
    }

    function init(W) {
        //Hovering
        W.element.hover(
            function () {
                W.addState(jpvs.states.HOVER);
            },
            function () {
                W.removeState(jpvs.states.HOVER);
            }
        );

        //Focusing
        W.element.focusin(
            function () {
                W.addState(jpvs.states.FOCUS);
            }
        );
        W.element.focusout(
            function () {
                W.removeState(jpvs.states.FOCUS);
            }
        );
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

    jpvs.write(container, text);
    $(container).append(document.createElement("br"));
};

jpvs.writeTag = function (container, tagName, text) {
    if (!container)
        return;
    if (!tagName)
        return;

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

    /*
    When used with DataGrid, the template might be in the form { isHeader: true, template: .... }
    */
    if (template.template) {
        jpvs.applyTemplate(container, template.template, dataItem);
        return;
    }

    /*
    The template might be a string, in which case we just write it
    */
    if (typeof (template) == "string") {
        jpvs.write(container, template);
        return;
    }

    /*
    Or it could be in the form: { fieldName: "ABC", tagName: "TAG", selector: function(fieldValue, dataItem) {} }.
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

        return;
    }

    /*
    Or it could be a function. Call it with this = container.
    */
    if (typeof (template) == "function") {
        template.call($(container), dataItem);
        return;
    }

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
*/
jpvs.readDataSource = function (data, start, count, callback) {
    if (!data) {
        //No data source provided. Return no data.
        returnNoData();
    }
    else if (typeof (data) == "function") {
        //The data source is a function. It might be either synchronous or asynchronous.
        //Let's try to call it and see what comes back. Pass whatever comes back to our internalCallback function.
        var ret = data(start, count, internalCallback);

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

/* JPVS
Module: core
Classes: Event
Depends:
*/

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

jpvs.Event.prototype.fire = function (widget, handlerName, params) {
    if (handlerName)
        fireHandler(this.handlers[handlerName], params);
    else {
        for (var hn in this.handlers) {
            var h = this.handlers[hn];
            fireHandler(h, params);
        }
    }

    return this.widget;

    function fireHandler(handler) {
        if (handler)
            handler.call(widget, params);
    }
};

/* JPVS
Module: utils
Classes: 
Depends: core
*/

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

/* JPVS
Module: parsers
Classes: SvgParser
Depends:
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

})();
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

/* JPVS
Module: parsers
Classes: XmlParser
Depends: 
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

    function parseString(s, nodeTransform) {
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

})();
/* JPVS
Module: utils
Classes: 
Depends: core
*/

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

/* JPVS
Module: core
Classes: Resources
Depends: bootstrap
*/


jpvs.Resources = {
    images: {
        loading: "data:image/gif;base64,R0lGODlhGAAIAPcAAAAAAP8A3ICAgP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCgABACwAAAAAGAAIAAAIRAADCBxIsKBBggASKhSocGGAhgkZCpgoAADDARgHWHyYUaNEihsBdAw58uNEkhlRYgxJseLFlC9XMoQ4s2FNhwdz5gwIACH5BAkKAAEALAAAAAAYAAgAAAhDAAMIHEiwoEGCABIqFKhwYYCGCRkOmDgAAEMBGAVYfEixokSKGwFk1PhxYsiOIUeeBFnS40OVLUNCZDjzYc2DOHEGBAAh+QQJCgABACwAAAAAGAAIAAAIQwADCBxIsKBBggASKhSocGGAhgkZDpg4AIBEihYfCtgoICMAihUvTvTIsaPIkA9BkuToUeXJlRs9QmQ482HNgzhxBgQAIfkECQoAAQAsAAAAABgACAAACEMAAwgcSLCgQYIAEioUqHBhgIYJGQ6YOAAAQwEYBVh8SLGiRIobAWTU+HFiyI4hR54EWdLjQ5UtQ0JkOPNhzYM4cQYEADs=",

        closeButton: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADzSURBVDhPY2BmZv7EwMDwn1zMyMrK+uXnz5/7gQaQDJiYmHyYSNaFpgHDAD09PSuQyRcvXuRCVtvW1iYHEgfRKGaAvPDv37/NyBgUHjo6Om9hYufPn98LEmtpabmIrg6rF1avXn38ypUrQjDbYmNjDYAGvquqqnqE4WVsLgDZEhUVdQ9kK4wGuQKbS/HGAig8QC4BuSg4OPgtuu0EYwGkGaRp/fr1ErhiC2c0gmwH+Rtk+7JlyxTXrl0rjNUQbGEACm2Q/2H+hoUDtjBgQDcAX5QhRy3IMHDyRzYAphldIUgx0CvHYLECcwmIP/B5gYHS7AwAM9IzlWy9T8kAAAAASUVORK5CYII=",
        closeButtonHover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAENSURBVDhPY9TW1v6rqqrKxEAGuHHjBgOjo6Pjn717994lQz+Dk5OTGlk2I1uGYcDs2bNlm5qa1N6+fcuKrPDUqVP8IHEQjdeA1NTUxyAF69atk4ApBBm2Y8cOcQ8Pj5dmZmYf8RoAkoyMjHzy/PlzTphtIMMkJSW/o2sGqcUaBsBY+WZkZPQBZOuWLVvEQIYFBQW9wBbQOAPRx8fnFcjWc+fOCYBcJCws/JskA0CKQTaD6Js3b/LgimacLgDFBsgFINtBrrh9+zYX0S4ABR7M37DwWL58uQxRBiBHGczfoPAAaQa5Ct0QFC+ANE+dOlURW5TBohYUK8iGDHxeYFRRUfkrIyNDVqZ68OABAwDuhIRQ92DTiAAAAABJRU5ErkJggg=="
    }
};

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

/* JPVS
Module: storage
Classes: Storage
Depends: core, utils
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

/* JPVS
Module: widgets
Classes: Button
Depends: core
*/

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
            W.click.fire(W);
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

/* JPVS
Module: widgets
Classes: CheckBox
Depends: core
*/

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
            W.change.fire(W);
        });
        this.element.change(function () {
            W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"checkbox\"]");
    },

    prototype: {
        checked: jpvs.property({
            get: function () { return this.element.prop("checked"); },
            set: function (value) { this.element.prop("checked", value); }
        })
    }
});



/* JPVS
Module: widgets
Classes: DataGrid
Depends: core, Pager
*/

(function () {

    jpvs.DataGrid = function (selector) {
        this.attach(selector);
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

            clear: function () {
                this.element.find("tr").remove();
            },

            dataBind: function (data) {
                dataBind(this, "tbody", data);
            },

            dataBindHeader: function (data) {
                dataBind(this, "thead", data);
            },

            dataBindFooter: function (data) {
                dataBind(this, "tfoot", data);
            },

            addBodyRow: function (item, index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
            },

            addHeaderRow: function (item, index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
            },

            addFooterRow: function (item, index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
            },

            removeBodyRow: function (index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
            },

            removeHeaderRow: function (index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
            },

            removeFooterRow: function (index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
            },

            removeBodyRows: function (index, count) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
            },

            removeHeaderRows: function (index, count) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
            },

            removeFooterRows: function (index, count) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
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


    /*
    Default binder

    Displays all rows in the datasource
    */
    jpvs.DataGrid.defaultBinder = function (section, data) {
        var W = this;

        //Remove all rows
        var sectionElement = getSection(W, section);
        var sectionName = decodeSectionName(section);

        //Read the entire data set...
        jpvs.readDataSource(data, null, null, next);

        //...and bind all the rows
        function next(ret) {
            sectionElement.empty();
            $.each(ret.data, function (i, item) {
                addRow(W, sectionName, sectionElement, item);
            });
        }
    };



    /*
    Paging binder

    Displays rows in the grid one page at a time
    */
    jpvs.DataGrid.pagingBinder = function (params) {
        var pageSize = (params && params.pageSize) || 10;
        var preserveCurrentPage = (params && params.preserveCurrentPage);

        var copyOfCurPage = 0;

        function binder(section, data) {
            var W = this;

            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curPage = preserveCurrentPage ? copyOfCurPage : 0;
            copyOfCurPage = curPage;

            //Ensure the pager is present
            var pager = getPager();

            //Refresh the current page
            refreshPage();

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
                jpvs.readDataSource(data, start, pageSize, next);

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
            jpvs.readDataSource(data, 0, pageSize, onDataLoaded(function () {
                updateGrid(0);

                //After loading and displaying the first page, load some more records in background
                jpvs.readDataSource(data, pageSize, chunkSize, onDataLoaded(updateRows));
            }));

            function ensurePageOfDataLoaded(newScrollPos, next) {
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
                    next();
                else {
                    //Read from firstMissingIndex up to firstMissingIndex + chunkSize
                    var end = Math.min(firstMissingIndex + chunkSize, totalRecords);
                    var numOfRecsToRead = end - firstMissingIndex;
                    jpvs.readDataSource(data, firstMissingIndex, numOfRecsToRead, onDataLoaded(next));
                }
            }

            function onDataLoaded(next) {
                //This function gets called whenever new records are returned from the data source
                return function (ret) {
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
                ensurePageOfDataLoaded(newScrollPos, updateRows);
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

/* JPVS
Module: widgets
Classes: DropDownList
Depends: core
*/

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
            W.change.fire(W);
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
            var opt = document.createElement("option");
            $(opt).attr("value", value).text(text || value).appendTo(this.element);
            return this;
        },

        addItems: function (items) {
            var W = this;
            $.each(items, function (i, item) {
                if (item.value)
                    W.addItem(item.value, item.text);
                else
                    W.addItem(item);
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


/* JPVS
Module: widgets
Classes: ImageButton
Depends: core
*/

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
            W.click.fire(W);
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


/* JPVS
Module: widgets
Classes: LinkButton
Depends: core
*/

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
        this.element.click(function () {
            W.click.fire(W);
            return false;
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


/* JPVS
Module: widgets
Classes: Pager
Depends: core, LinkButton
*/

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

/* JPVS
Module: widgets
Classes: Popup
Depends: core, ImageButton
*/

(function () {

    //Keep track of all popups
    var allPopups = {};

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
            allPopups[this.element.attr("id")] = { open: false, widget: this };

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

        prototype: {
            modal: jpvs.property({
                get: function () {
                    return this.blanketElement.is(":visible");
                },
                set: function (value) {
                    if (value)
                        this.blanketElement.show();
                    else
                        this.blanketElement.hide();
                }
            }),

            show: function () {
                //Show popup
                this.element.show();
                this.contentsElement.hide();
                this.contentsElement.fadeIn();

                //Dim screen if modal
                if (this.modal())
                    this.blanketElement.show();
                else
                    this.blanketElement.hide();

                //Center in screen
                this.center();

                //Keep track
                allPopups[this.element.attr("id")].open = true;

                //Put it on top of popup stack
                this.bringForward();

                return this;
            },

            hide: function () {
                this.blanketElement.hide();
                this.contentsElement.fadeOut();

                //Keep track
                allPopups[this.element.attr("id")].open = false;

                return this;
            },

            center: function () {
                var W = this.contentsElement.outerWidth();
                var H = this.contentsElement.outerHeight();

                var wnd = $(window);
                var wndW = wnd.width();
                var wndH = wnd.height();

                var x = (wndW - W) / 2;
                var y = (wndH - H) / 2;

                this.contentsElement.css({
                    position: "fixed",
                    top: y + "px",
                    left: x + "px"
                });

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
        pop.width("50%").title(params.title || null);
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

    //ESC button must close the topmost popup currently open
    $(document).ready(function () {
        $(document.body).keydown(function (e) {
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
        });
    });
})();

/* JPVS
Module: widgets
Classes: Scroller
Depends: core
*/

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

            //Create a content box DIV with overflow hidden, same size as the widget
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

            //Create a scroller box DIV, that completely overlaps the content box, with overflow auto
            W.scrollerBox = jpvs.writeTag(W.element, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "auto"
            });

            //Inside the scroller box, create a DIV that is used as a sizer for the scrollbars of the scroller box
            W.scrollerSizer = jpvs.writeTag(W.scrollerBox, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Measure scrollbars
            var parkOverflow = W.scrollerBox.css("overflow");
            W.scrollerBox.css("overflow", "scroll");
            var width1 = W.scrollerSizer.innerWidth();
            var width2 = W.scrollerBox.innerWidth();
            W.scrollerBox.css("overflow", parkOverflow);

            W.scrollbarW = Math.abs(width1 - width2);
            W.scrollbarH = W.scrollbarW;

            //After measuring scrollbars, set the CSS width to 100%
            W.scrollerSizer.css({
                width: "100%", height: "100%"
            });

            //Events
            W.scrollerBox.scroll(onScroll(W));

            //Finally, copy the content into the "content" DIV and set sizes
            if (parkedContent.length) {
                W.content.append(parkedContent);
                parkedSize.height += W.scrollbarH;
                parkedSize.width += W.scrollbarW;
                W.scrollableSize(parkedSize).contentSize(parkedSize);
            }
        },

        canAttachTo: function (obj) {
            return false;
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

})();

/* JPVS
Module: widgets
Classes: Table
Depends: core
*/

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
})();

/* JPVS
Module: widgets
Classes: TextBox
Depends: core
*/

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
            W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"text\"],input[type=\"password\"]");
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


