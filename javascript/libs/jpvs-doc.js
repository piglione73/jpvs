window.jpvs = window.jpvs || {};

/*
Can be called as: jpvs.animate(animationFunction) 
or as jpvs.animate(params, animationFunction)
*/
jpvs.animate = function (params, animationFunction) {
    /// <summary>Enqueues an animation.</summary>
    /// <param name="params" type="Object">Optional object with parameters: { t0: start time (default: 0), t1: end time (default: 1), step: time step for a discrete animation or zero for a continuous animation (default: 0), duration: duration in milliseconds of the animation (default: 1000), easingFunction: easing function (default: jpvs.animate.harmonicEasing) }.</param>
    /// <param name="animationFunction" type="Function">Animation function: function(t) {}. The "t" argument is the current time and is always between t0 and t1. This function defines the animation.</param>
};

jpvs.animate.harmonicEasing = function () { };
jpvs.animate.linearEasing = function () { };


jpvs.flashClass = function (element, cssClass, duration, count, leaveOnTime) {
    /// <summary>Flashes a CSS class on a DOM element. It can be used for attracting the user's attention after changing some content.</summary>
    /// <param name="element" type="Object">The DOM element or jQuery object to which the CSS class must be applied.</param>
    /// <param name="cssClass" type="String">CSS class name to apply/remove in a flashing manner (on and off several times).</param>
    /// <param name="duration" type="Number">Optional: duration of the flashing animation in milliseconds.</param>
    /// <param name="count" type="Number">Optional: number of flashes desired.</param>
    /// <param name="leaveOnTime" type="Number">Optional: Time (in ms). After the end of the animation, after this time, the CSS class is removed.</param>
};

jpvs.requestAnimationFrame = function (callback, element) {
    /// <summary>Shim layer for the requestAnimationFrame function.</summary>
};
;


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
    /// <returns type="any">If run as a background task, returns an object like this: { cancel: function() {} }. Calling the "cancel" function interrupts the task immediately.
    /// If run as a foreground task, returns the value returned by the task.</returns>
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
    /// <returns type="any">An object like this: { cancel: function() {} }. Calling the "cancel" function interrupts the task immediately.</returns>
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
;


window.jpvs = window.jpvs || {};

jpvs.encodeUtf8Base64 = function (str) {
    /// <summary>Encodes a string as UTF-8 and then encodes the resulting byte array into a base-64 string.</summary>
    /// <param name="str" type="String">The string to encode.</param>
    /// <returns type="String">The encoded string.</returns>
};

jpvs.decodeBase64Utf8 = function (str) {
    /// <summary>Decodes a string from base-64 to a byte array and then interprets the array as UTF-8 and gets the corresponding string. This function decodes a string encoded by the jpvs.encodeUtf8Base64 function.</summary>
    /// <param name="str" type="String">The string to decode.</param>
    /// <returns type="String">The decoded string.</returns>
};
;


window.jpvs = window.jpvs || {};

jpvs.resetAllBindings = function () {
    /// <summary>Resets all bindings. After calling this function, all bindings set in place by bindContainer or bind are dropped.
    /// In order to reactivate them you have to call bindContainer or bind again.</summary>
};

jpvs.bindContainer = function (container, dataObject, onChangeDetected, dataBindingAttrName) {
    /// <summary>Sets up a two-way binding between all children of a given html container and a data object. 
    /// Databinding directives are expressed in html "data-bind" attributes and are in the form 
    /// "value=val1,className=val2,#text=val3,checked=!val4, ...". This means that attribute "value" is bound to dataObject.val1, 
    /// attribute "className" is bound to dataObject.val2, jQuery function "text" is bound to dataObject.val3, 
    /// "checked" is bound to the negated value of val4. 
    /// More in general, a databinding directive is a comma-separated list of elements in the form: LHS=RHS.
    /// The left-hand side (LHS) can be: 1) the name of a jpvs widget property (e.g.: selectedValue or text); 
    /// 2) the name of an HTML attribute (e.g.: value or className);
    /// 3) a jQuery function expressed as jQuery.xxxx (e.g.: jQuery.text); 
    /// 4) a pseudo-property expressed as #xxxxx (e.g.: #visible) (currently the only available pseudo-property is "visible").
    /// The right-hand side (RHS) can be: 1) the name of a data object member; 2) the name of a data object member prefixed by an
    /// exclamation mark (like !foo): this means the negated value is two-way bound rather than the value itself.</summary>
    /// <param name="container" type="Object">Container whose children have to be two-way bound: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="onChangeDetected" type="Function">Callback that is called whenever one or more values are propagated between the container and the dataObject, in either direction. The signature is: function onChangeDetected(towardsElement, towardsDataObject) {}. The two arguments are boolean flags.</param>
    /// <param name="dataBindingAttrName" type="String">Optional: name of the attribute that will contain databinding directives. The default is "bind", meaning that the "data-bind" attribute will be used. If you pass "xxx", then the "data-xxx" attribute will be used.</param>
};

jpvs.bindElements = function (elements, dataObject, onChangeDetected, dataBindingAttrName) {
    /// <summary>Sets up a two-way binding between all given elements and a data object. 
    /// Databinding directives are expressed in html "data-bind" attributes and are in the form 
    /// "value=val1,className=val2,#text=val3,checked=!val4, ...". This means that attribute "value" is bound to dataObject.val1, 
    /// attribute "className" is bound to dataObject.val2, jQuery function "text" is bound to dataObject.val3, 
    /// "checked" is bound to the negated value of val4. 
    /// More in general, a databinding directive is a comma-separated list of elements in the form: LHS=RHS.
    /// The left-hand side (LHS) can be: 1) the name of a jpvs widget property (e.g.: selectedValue or text); 
    /// 2) the name of an HTML attribute (e.g.: value or className);
    /// 3) a jQuery function expressed as jQuery.xxxx (e.g.: jQuery.text); 
    /// 4) a pseudo-property expressed as #xxxxx (e.g.: #visible) (currently the only available pseudo-property is "visible").
    /// The right-hand side (RHS) can be: 1) the name of a data object member; 2) the name of a data object member prefixed by an
    /// exclamation mark (like !foo): this means the negated value is two-way bound rather than the value itself.</summary>
    /// <param name="elements" type="Array or jQuery object">Elements that have to be two-way bound: array of DOM elements or jQuery object.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="onChangeDetected" type="Function">Callback that is called whenever one or more values are propagated between the elements and the dataObject, in either direction. The signature is: function onChangeDetected(towardsElement, towardsDataObject) {}. The two arguments are boolean flags.</param>
    /// <param name="dataBindingAttrName" type="String">Optional: name of the attribute that will contain databinding directives. The default is "bind", meaning that the "data-bind" attribute will be used. If you pass "xxx", then the "data-xxx" attribute will be used.</param>
};

jpvs.bind = function (element, dataObject, dataBind, onChangeDetected) {
    /// <summary>Sets up a two-way binding between an element and a data object.</summary>
    /// <param name="element" type="Object">Element that has to be two-way bound: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="dataBind" type="String">Value of the "data-bind" attribute to be used. See jpvs.bindContainer for additional information.</param>
    /// <param name="onChangeDetected" type="Function">Callback that is called whenever one or more values are propagated between the container and the dataObject, in either direction. The signature is: function onChangeDetected(towardsElement, towardsDataObject) {}. The two arguments are boolean flags.</param>
};

jpvs.findElementsBoundTo = function (dataObject, objectPropertyName) {
    /// <summary>Finds all elements/widgets bound to the specified property of the specified data object.
    ///  All elements/widgets bound to that property will be returned as an array.</summary>
    /// <param name="dataObject" type="Object">Data object.</param>
    /// <param name="objectPropertyName" type="Object">Name of a data object property.</param>
};


;


window.jpvs = window.jpvs || {};

jpvs.getElementIfWidget = function(X) {
	/// <summary>If X is a jpvs widget, get the jQuery object representing the main content element of X. Otherwise, return X.</summary>
	return $("");
};

jpvs.find = function (selector) {
    /// <summary>Finds jpvs widgets by selector.</summary>
    /// <param name="selector" type="String">jQuery selector or jQuery object.</param>
    /// <returns type="Array">Single jpvs widget or array of widgets</returns>
};

jpvs.states = {
    HOVER: "Hover",
    FOCUS: "Focus",
    ERROR: "Error",
    DISABLED: "Disabled"
};

jpvs.property = function (propdef) {
    /// <summary>Defines a property.</summary>
    /// <param name="propdef" type="Object">Property definition. It is an object that may contain fields "get" and "set" and/or "setTask". The "get" field defines the property getter, which is always synchronous. Its signature is: function get() { read and return the current property value; }. The setter may be specified as a synchronous function or as an asynchronous function (background task). The synchronous version is given by the "set" field, which has the following signature: function set(newValue) { set the property value to newValue; }. The asynchronous version is given by the "setTask" field, which has the following signature: function setTask(newValue) { return a task function that sets the property value to newValue; }. See jpvs.runTask for additional information about task functions. Example of a setTask function: function(newValue) { return function(ctx) { task function body that sets the property value to newValue }; }. A property can be called in three different ways. Getter: "var x = w.property();". Synchronous setter: "w.property(newValue);". Asynchronous setter: "w.property(newValue, true, onSuccess, onProgress, onError);". Or simply: "w.property(newValue, true);".</param>
    /// <returns type="Function">Property function</returns>
};

jpvs.currentLocale = function (loc) {
    /// <summary>Gets/sets the current locale.</summary>
    /// <param name="loc" type="String">Current locale.</param>
    /// <returns type="String">The current locale.</returns>
};

jpvs.event = function (widget) {
    /// <summary>Creates a new event for a widget.</summary>
    /// <param name="widget" type="Widget">Widget to which the new event must be attached.</param>
    /// <returns type="jpvs.Event">The event.</returns>
    return new jpvs.Event(widget);
};

jpvs.makeWidget = function (widgetDef) {
    /// <summary>Creates a new widget, given a widget definition.</summary>
    /// <param name="widgetDef" type="Object">Widget definition.</param>

    //Document all the common methods
    var fn = widgetDef.widget;

    //Static methods
    fn.create = create_static(widgetDef);
    fn.attach = attach_static(widgetDef);

    //Instance methods
    fn.prototype.toString = function () {
        /// <summary>Returns the widget name (e.g.: Button, TextBox, DataGrid...).</summary>
        /// <returns type="String">Widget name.</returns>
        return "";
    };
    fn.prototype.attach = attach(widgetDef);
    fn.prototype.destroy = destroy(widgetDef);
    fn.prototype.focus = focus(widgetDef);
    fn.prototype.addState = addState(widgetDef);
    fn.prototype.removeState = removeState(widgetDef);
    fn.prototype.getMainContentElement = getMainContentElement(widgetDef);

    fn.prototype.id = function (value) {
        /// <summary>Property: id of the widget.</summary>
        /// <param name="value" type="String"></param>
    };

    fn.prototype.ensureId = function () {
        /// <summary>Ensure the widget has an id. If no id is set, a new random id is automatically created for the widget.</summary>
    };

    fn.prototype.currentBrowserEvent = null;

    //Additional prototype methods defined in "widgetDef"
    if (widgetDef.prototype) {
        for (var memberName in widgetDef.prototype) {
            var member = widgetDef.prototype[memberName];
            fn.prototype[memberName] = member;
        }
    }

    function create_static(widgetDef) {
        return function (container) {
            /// <summary>Creates a new widget in the given container. If the container specifies more than one element, multiple widgets are created and an array of widgets is returned. Otherwise, the single widget just created is returned (this is the most common case).</summary>
            /// <param name="container" type="Object">Where to write the widget: jpvs widget or jQuery selector or jQuery object or DOM element. If not specified, the widget is created in the document body.</param>
            return new widgetDef.widget();
        };
    }

    function attach_static(widgetDef) {
        return function (selector) {
            /// <summary>Attaches a widget to an existing element.</summary>
            /// <param name="selector" type="Object">What to attach the widget to: jQuery selector or jQuery object or DOM element.</param>
            return new widgetDef.widget(selector);
        };
    }

    function attach(widgetDef) {
        return function (selector) {
            /// <summary>Attaches a widget to an existing element.</summary>
            /// <param name="selector" type="Object">What to attach the widget to: jpvs widget or jQuery selector or jQuery object or DOM element. If not specified, the widget is created in the document body.</param>
        };
    }

    function destroy(widgetDef) {
        return function () {
            /// <summary>Destroys the widget and removes it from the document.</summary>
        };
    }

    function getMainContentElement(widgetDef) {
        return function () {
            /// <summary>Gets the main content element.</summary>
            return $("*");
        };
    }

    function focus(widgetDef) {
        return function () {
            /// <summary>Sets the focus to the widget.</summary>
            return this;
        };
    }

    function addState(wd) {
        return function (state) {
            /// <summary>Add a "state" to the widget. A "state" is a special CSS class. For example, a Button has classes Widget and Button. Adding state "XYZ" means adding classes "Widget-XYZ" and "Button-XYZ" to the main element.</summary>
            return this;
        };
    }

    function removeState(wd) {
        return function (state) {
            /// <summary>Removes a "state" from the widget.</summary>
            return this;
        };
    }

};


jpvs.createAllWidgets = function () {
    /// <summary>Creates all widgets automatically.</summary>
};


jpvs.write = function (container, text, renderLinks) {
    /// <summary>Writes text.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
    /// <param name="renderLinks" type="Boolean">If true, then links are wrapped into an A element.</param>
};

jpvs.writeln = function (container, text, renderLinks) {
    /// <summary>Writes text and terminates the current line.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
    /// <param name="renderLinks" type="Boolean">If true, then links are wrapped into an A element.</param>
    return $("");
};

jpvs.writeTag = function (container, tagName, text, renderLinks) {
    /// <summary>Writes a tag with optional text inside.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="tagName" type="String">The tag name to write.</param>
    /// <param name="text" type="String">Optional: the text to write. Newlines in the string are handled correctly.</param>
    /// <param name="renderLinks" type="Boolean">If true, then links are wrapped into an A element.</param>
    /// <returns type="jQuery">A jQuery object that wraps the element just written.</returns>
    return $("");
};

jpvs.applyTemplate = function (container, template, dataItem) {
    /// <summary>Writes content according to a template. If the template is a function, then applyTemplate returns whatever is returned by the template function call.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="template" type="Object">The template may be any of the following: (1) a string; (2) an object like this: { fieldName: "ABC", tagName: "TAG", css: {}, selector: function(fieldValue, dataItem) {} }; (3) a function(dataItem) {} that will receive the container as the "this" object.</param>
    /// <param name="dataItem" type="String">Optional: the data item that will be consumed by the template.</param>
};

jpvs.readDataSource = function (data, start, count, options, callback) {
    /// <summary>This function handles extraction of data from various types of data sources and returns data asynchronously to a callback.</summary>
    /// <param name="data" type="Array">Array of records or function(start, count, options) that returns the data or function(start, count, options, callback) that asynchronously fetches the data and passes it to the callback.</param>
    /// <param name="start" type="Number">Index of the first element desired. If null or undefined, 0 is implied.</param>
    /// <param name="count" type="Number">Number of elements desired. If null or undefined, the entire data set is fetched.</param>
    /// <param name="options" type="Object">Sorting/filtering options. It is an object in the form: { sort: [ { name: ..., descending: true/false }, ...], filter: [ { name: ..., operand: ..., value: ....}, ... ] }. It may be null. This parameter is passed to the datasource when the datasource is a function. If the datasource is an array, this parameter is not taken into account. Therefore, in order to support sorting/filtering, the datasource must be a function. This parameter is passed to the datasource function directly.</param>
    /// <param name="callback" type="Function">Function(obj) that gets the data. The object passed to the callback is as follows: { total: total number of records in the full data set, start: offset in the data set of the first record returned in the "data" field, count: number of records returned in the "data" field; this is &lt;= total, data: array with the returned records }</param>
};


jpvs.showDimScreen = function (delayMilliseconds, fadeInDuration, template) {
    /// <summary>Dims the screen with a DIV of class "DimScreen" that covers all the browser window.</summary>
    /// <param name="delayMilliseconds" type="Number">Delay in milliseconds (default: 500). The dimming appears if jpvs.hideDimScreen is not called within this delay.</param>
    /// <param name="fadeInDuration" type="Number">Duration in milliseconds (default: 250) of the fade-in animation used to dim the screen.</param>
    /// <param name="template" type="Object">Optional: template used for filling the DIV. It is passed to jpvs.applyTemplate.</param>
};

jpvs.hideDimScreen = function (fadeOutDuration) {
    /// <summary>Hides, if currently displayed, the screen-dimming DIV created by jpvs.showDimScreen.</summary>
    /// <param name="fadeOutDuration" type="Number">Duration in milliseconds (default: 250) of the fade-out animation used to undim the screen.</param>
};

jpvs.fitInWindow = function (element) {
    /// <summary>Takes an absolutely positioned element and makes sure it fits into the visible window.</summary>
    /// <param name="element" type="Object">jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.fixTableHeader = function (element) {
    /// <summary>Takes a table and fixes its header so that it does not disappear when scrolling upwards.</summary>
    /// <param name="element" type="Object">jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <returns type="Object">An object containing the "refresh" function, that forces a repositioning of the header, and the "deactivate" function,
    /// that disables the header fixing. 
    /// Calling the refresh function after changing the table content ensures the header is properly repositioned. Calling the
    /// deactivate function, restores the header in the original position.</returns>
    return {
        refresh: function () { },
        deactivate: function () { }
    };
};
;


window.jpvs = window.jpvs || {};

jpvs.Event = function (widget) {
    /// <summary>Generic widget event. The result of "new jpvs.Event(...)" is the object "obj", which has props "widget" and "handlers" and can also be called as a function (the "bind" function).</summary>
    /// <param name="widget" type="Widget">The widget to which the event is to be attached.</param>
    /// <returns type="jpvs.Event">The newly-created event.</returns>
    var obj = function (handlerName, handler) {
        /// <summary>Binds a handler to this event.</summary>
        /// <param name="handlerName" type="String">Optional: the handler name. This argument may be omitted.</param>
        /// <param name="handler" type="Function">The event handler to bind to this event. The event handler is a function handler(widget) {} that receives the widget that received the event as the argument. Also, in the handler function body, "this" refers to the same widget that is passed as the argument. If the handler returns false, then the event is not bubbled up the document hierarchy.</param>
        /// <returns type="Widget">The widget.</returns>
    };

    obj.bind = jpvs.Event.prototype.bind;
    obj.unbind = jpvs.Event.prototype.unbind;
    obj.fire = jpvs.Event.prototype.fire;

    obj.widget = widget;
    obj.handlers = {};

    return obj;
};

jpvs.Event.prototype.bind = function (handlerName, handler) {
    /// <summary>Binds a handler to this event.</summary>
    /// <param name="handlerName" type="String">Optional: the handler name. This argument may be omitted.</param>
    /// <param name="handler" type="Function">The event handler to bind to this event. The event handler is a function handler(widget) {} that receives the widget that received the event as the argument. Also, in the handler function body, "this" refers to the same widget that is passed as the argument.</param>
    /// <returns type="Widget">The widget.</returns>
};

jpvs.Event.prototype.unbind = function (handlerName) {
    /// <summary>Unbinds a handler that has been bound by name.</summary>
    /// <param name="handlerName" type="String">Name of the handler to unbound.</param>
    /// <returns type="Widget">The widget.</returns>
};

jpvs.Event.prototype.fire = function (widget, handlerName, params, browserEvent) {
    /// <summary>Fires this event.</summary>
    /// <param name="widget" type="Widget">The widget that is generating the event.</param>
    /// <param name="handlerName" type="String">Optional: name of the handler to trigger, in case only a specific handler must be triggered. This argument may be omitted.</param>
    /// <param name="params" type="Object">Parameters that are passed to the handler. The handler is called as handler(params) and inside the handler "this" refers to the "widget".</param>
    /// <param name="browserEvent" type="jQuery Event">Event object passed by the browser. If passed, this will be available in the widget as widget.currentBrowserEvent.</param>
};
;


window.jpvs = window.jpvs || {};

jpvs.Function = {
    serializeCall: function (argsArray, func) {
        /// <summary>Obtains a string serialization of a function call with its arguments, 
        /// for later execution by calling jpvs.Function.deserializeCall.</summary>
        /// <param name="argsArray" type="Array">The array of arguments to be passed to the function.</param>
        /// <param name="func" type="Function">The function to be called. This function must not refer to captured variables of the
        /// enclosing scope or a reference error will occur during deserialization (because during deserialization the function
        /// will be executed in a different scope). The function may only use its arguments. If it
        /// is necessary to refer to captured variables or to "this", then they must be directly passed as arguments in "argsArray".</param>
        return "";
    },

    deserializeCall: function (serializedCall) {
        /// <summary>Deserialized a string returned by jpvs.Function.serializeCall. This actually results in calling the serialized
        /// function with its arguments and with this = null. The function is called like this: func.apply(null, argsArray). If the
        /// function call returns a value, then this value is passed as a return value.</summary>
        /// <param name="serializedCall" type="String">The string returned by jpvs.Function.serializeCall.</param>
    }
};

;


window.jpvs = window.jpvs || {};

jpvs.History = {
    setStartingHistoryPoint: function (argsArray, action) {
        /// <summary>Executes a given function and also adds the function call as the starting history point for the current page.
        /// When the user, by clicking the "Back" browser button, navigates back to when the page was first loaded, the function call is executed
        /// again with the same arguments.</summary>
        /// <param name="argsArray" type="Array">The array of arguments to be passed to the function.</param>
        /// <param name="action" type="Function">The function to be called. This function must not refer to captured variables of the
        /// enclosing scope or a reference error will occur during deserialization (because during deserialization the function
        /// will be executed in a different scope). The function may only use its arguments. If it
        /// is necessary to refer to captured variables or to "this", then they must be directly passed as arguments in "argsArray".</param>
    },

    addHistoryPoint: function (argsArray, action, suppressImmediateExecution) {
        /// <summary>Adds the function call as a history point into the browser history. Additionally, the function is immediately called.
        /// However, this immediate function execution can be suppressed.
        /// When the user, by clicking the "Back" browser button, navigates back to a saved history point, the function call is always executed
        /// with the same arguments, regardless of the "suppressImmediateExecution" argument.</summary>
        /// <param name="argsArray" type="Array">The array of arguments to be passed to the function.</param>
        /// <param name="action" type="Function">The function to be called. This function must not refer to captured variables of the
        /// enclosing scope or a reference error will occur during deserialization (because during deserialization the function
        /// will be executed in a different scope). The function may only use its arguments. If it
        /// is necessary to refer to captured variables or to "this", then they must be directly passed as arguments in "argsArray".</param>
        /// <param name="suppressImmediateExecution">If true, then the function is not executed immediately, although the history point
        /// is regularly added into the browser history.</param>
    },

    reloadCurrentHistoryPoint: function () {
        /// <summary>If the url contains a reference to a history point,
        /// reloads that history point by executing the associated action. This function should be called on page load, just after
        /// setStartingHistoryPoint.</summary>
    }
};

;


window.jpvs = window.jpvs || {};

jpvs.parseJSON = function (jsonString) {
    /// <summary>Parses a JSON string.</summary>
    /// <param name="jsonString" type="String">The string to decode.</param>
    /// <returns type="Object">The object whose JSON representation was passed.</returns>
};

jpvs.toJSON = function (obj) {
    /// <summary>Serializes an object as a JSON string.</summary>
    /// <param name="obj" type="Object">The object to convert into a JSON string.</param>
    /// <returns type="String">A JSON string representing the object that was passed.</returns>
};
    
;


window.jpvs = window.jpvs || {};

jpvs.lazily = function (taskFunction) {
    /// <summary>Executes "taskFunction" lazily. It is a shortcut for jpvs.runLazyTask(taskID, 500, taskFunction), with a uniquely
    /// generated taskID that is unique to taskFunction.</summary>
};

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
;


window.jpvs = window.jpvs || {};

jpvs.randomString = function (len) {
    /// <summary>Creates a random string of a given length and containing uppercase letters and digits only.</summary>
    /// <param name="len" type="Number">The length of the string to be generated.</param>
    /// <returns type="String">A random string.</returns>
};
;


window.jpvs = window.jpvs || {};

jpvs.getSessionID = function () {
    /// <summary>Gets the current "jpvs session ID". When using the jpvs library, each browser session has a unique "jpvs session ID" that may be used instead of a session cookie.</summary>
    /// <returns type="String">The current session ID.</returns>
    return "ABCDEFG";
};
;


window.jpvs = window.jpvs || {};


jpvs.addGestureListener = function (element, params, onGesture) {
    /// <summary>Adds a gesture event listener to a given element. The listener will receive high-level touch events (gestures), 
    /// not the standard low-level touch events (touchstart, touchmove, ...).
    /// After calling this method, the default behavior of touch events
    /// is suppressed. This means that a touch event on this element will no longer emulate a mouse event.</summary>
    /// <param name="element" type="Object">Element whose gestures are desired: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="params" type="Object">
    /// Object with configuration parameters. It can be null. Each parameter has a default value. You can specify only the parameters
    /// that you need to change or you can specify them all. Available parameters are: 
    /// tapMaxDistance (if a finger is dragged longer than this, then it is no longer a tap; default: 15; unit: CSS pixels), 
    /// longTapThreshold (minimum duration of a long tap; default: 500; unit: milliseconds),
    /// doubleTapThreshold (if a short tap is closer than this to the previous tap, then it is considered a double tap; default: 250; unit: milliseconds),
    /// rotationThreshold (when rotating two fingers, angle over which the gesture is considered a rotation; default: 10*PI/180 (equivalent to 10 degrees); unit: radians),
    /// allowedEventTargets (function(eventTarget) { return true/false; }; when the function returns true, the touch event is handled and its propagation is stopped; when false, the touch event is ignored and is allowed to propagate up the DOM tree; default: a function that returns true out of A, SELECT, INPUT, BUTTON and elements decorated with class "jpvs-Ignore-Touch")
    /// </param>
    /// <param name="onGesture" type="Function">
    /// The event listener function. Signature: function onGesture(e) {}.
    /// The "e" argument is the gesture event object and carries information about the touch gesture.
    ///
    /// Gesture: TAP; the event object is { isTap: true, isLongTap: true/false, isDoubleTap: true or missing, target: ..., clientX: ..., clientY: ..., pageX: ..., pageY: ... }
    ///
    /// Gesture: DRAG; the event object is { isDrag: true, dragX: ..., dragY: ..., totalDragX: ..., totalDragY: ..., target: ..., current: { clientX: ..., clientY: ..., pageX: ..., pageY: ... }, start: { clientX: ..., clientY: ..., pageX: ..., pageY: ... } }.
    /// Gesture END of DRAG; the event object is { isDrag: false, isEndDrag: true, totalDragX: ..., totalDragY: ..., target: ..., current: { clientX: ..., clientY: ..., pageX: ..., pageY: ... }, start: { clientX: ..., clientY: ..., pageX: ..., pageY: ... } }.
    ///
    /// Gesture: ROTATE; the event object is { isRotate: true, angle: ..., totalAngle: ..., target1: ..., target2: ..., start1: {...}, start2: {...}, current1: {...}, current2: {...} }.
    /// Gesture: END of ROTATE; the event object is { isRotate: false, isEndRotate: true, totalAngle: ..., target1: ..., target2: ..., start1: {...}, start2: {...}, current1: {...}, current2: {...} }.
    ///
    /// Gesture: ZOOM; the event object is { isZoom: true, zoomFactor: ..., totalZoomFactor: ..., target1: ..., target2: ..., start1: {...}, start2: {...}, current1: {...}, current2: {...} }.
    /// Gesture: END of ZOOM; the event object is { isZoom: false, isEndZoom: true, totalZoomFactor: ..., target1: ..., target2: ..., start1: {...}, start2: {...}, current1: {...}, current2: {...} }.
    ///
    /// Values dragX and dragY contain the amount of drag since the last onGesture call. Values totalDragX and totalDragY contain the total
    /// amount of drag since the start of the current drag gesture.
    ///
    /// Similar logic applies to angle/totalAngle and zoomFactor/totalZoomFactor.
    ///
    /// The target field contains the DOM element where the gesture occurred/started.
    /// In case the gesture involves two touches, target1/target2 contain the DOM element(s) where the gesture started.
    ///
    /// Values in property "current" (clientX, clientY, pageX, pageY) contain the coordinates of the last occurred touch event. 
    /// In case of drag, there is also a "start" property that contains the clientX, clientY, pageX, pageY values of the first event in the 
    /// drag sequence.
    ///
    /// For zoom/rotate, we have current1/current2 and start1/start2.
    /// </param>
};
;


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

;


window.jpvs = window.jpvs || {};

jpvs.cleanHtml = function (html, options) {
    /// <summary>Cleans an html string using the jquery-clean plugin. This function is merely a wrapper to that plugin.</summary>
    /// <param name="html" type="String">The html string to clean.</param>
    /// <param name="options" type="Object">Optional object with cleaning options. If not specified, the html is cleaned with default options (common tags and attributes found in javascript HTML editors are preserved (using a white-list approach)). If specified, it must be in the format specified by the jquery-clean plugin documentation. Please see it for detailed information.</param>
    /// <returns type="String">The cleaned html string. It is in xhtml format.</returns>
};

jpvs.stripHtml = function (html) {
    /// <summary>Strips all html tags from an html string using the jquery-clean plugin. This function is merely a wrapper to that plugin.</summary>
    /// <param name="html" type="String">The html string to clean.</param>
    /// <returns type="String">The text extracted from the html string.</returns>
};

;


window.jpvs = window.jpvs || {};


function JPVS_Domain() {
}

JPVS_Domain.prototype.getCount = function () {
    /// <summary>Returns the number of items currently stored in this data domain.</summary>
    /// <returns type="Number">The number of items.</returns>
};

JPVS_Domain.prototype.getItem = function (itemIndex) {
    /// <summary>Returns a data item, given the item index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
    /// <returns type="Object">The data item, or null if no data item was found at the specified index.</returns>
};

JPVS_Domain.prototype.setItem = function (itemIndex, item) {
    /// <summary>Stores a data item at a given index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
    /// <param name="item" type="Object">The item to store.</param>
};

JPVS_Domain.prototype.removeItem = function (itemIndex) {
    /// <summary>Removes the data item at a given index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
};

JPVS_Domain.prototype.removeAllItems = function () {
    /// <summary>Removes all data items.</summary>
};

JPVS_Domain.prototype.listItems = function () {
    /// <summary>Returns all the items in the domain.</summary>
    /// <returns type="Array">Array of data items. Some elements may be null, if the corresponding item is missing or has been removed.</returns>
};

JPVS_Domain.prototype.each = function (action) {
    /// <summary>Iterates over all the data items and executes a callback on each item.</summary>
    /// <param name="action" type="Function">The callback to execute on each item. The callback is defined as follows: function(index, item) {}.</param>
};

JPVS_Domain.prototype.deleteDomain = function () {
    /// <summary>Removes all data items and deletes the domain.</summary>
};

jpvs.Storage = {
    listDomains: function (storage) {
        /// <summary>Returns a list of domains registered in a given storage object.</summary>
        /// <param name="storage" type="StorageObject">localStorage or sessionStorage.</param>
        /// <returns type="Array">Array of data domains.</returns>
        return [new JPVS_Domain(), new JPVS_Domain(), new JPVS_Domain()];
    },

    getDomain: function (storage, domainName) {
        /// <summary>Gets a domain by storage and name.</summary>
        /// <param name="storage" type="StorageObject">localStorage or sessionStorage.</param>
        /// <param name="domainName" type="String">Domain name. If no domain with this name is found in the given "storage", then a new domain is implicitly created and registered.</param>
        /// <returns type="JPVS_Domain">The requested data domain.</returns>
        return new JPVS_Domain();
    }
};

;


window.jpvs = window.jpvs || {};

jpvs.equals = function (x,y) {
    /// <summary>Determines if two objects are deeply equal.</summary>
    /// <param name="x" type="Object">The first object.</param>
    /// <param name="y" type="Object">The second object.</param>
    /// <returns type="Boolean">The result of the comparison.</returns>
};
;


window.jpvs = window.jpvs || {};

jpvs.filter = function (array, filteringRules) {
    /// <summary>Returns a filtered copy of the array. The original array is left untouched.</summary>
    /// <param name="array" type="Array">The array to be filtered. This array will not be touched.</param>
    /// <param name="filteringRules" type="Array">Array of filtering rules. Each filtering rule has the form:
    /// { 
    ///     selector: function(item) {}, 
    ///     operand: <"EQ" | "NEQ" | "CONTAINS" | "NCONTAINS" | "STARTS" | "NSTARTS" | "LT" | "LTE" | "GT" | "GTE">, 
    ///     value: <string> 
    /// }.
    /// The "selector" is a function that is used to extract (from each item) the string value to compare with the provided "value".
    /// Comparisons are all case-insensitive.
    /// </param>
    /// <returns type="Array">A filtered copy of the array. Every item satisfies ALL the filtering rules.</returns>
};

;


window.jpvs = window.jpvs || {};

jpvs.compare = function (a, b) {
    /// <summary>Compares strings/numbers. If both a and b are numbers, they are compared numerically. Otherwise, a and b are converted
    /// to strings (through the toString method) and compared as strings in a case-insensitive way).
    /// Rule applied: undefined < null < numbers (compared numerically) < strings (compared alphabetically).</summary>
    /// <param name="x" type="Object">The first number/string.</param>
    /// <param name="y" type="Object">The second number/string.</param>
    /// <returns type="Number">The result of the comparison: +1 if a > b; 0 if a equals b; -1 if a < b.</returns>
};

jpvs.sort = function (array, sortingRules) {
    /// <summary>Sorts an array and returns a sorted copy of the array. The original array is left untouched.</summary>
    /// <param name="array" type="Array">The array to be sorted. This array will not be touched.</param>
    /// <param name="sortingRules" type="Array">Array of sorting rules, applied in order. Each sorting rule has the form:
    /// { selector: function(item) {}, descending: true/false }.
    /// The "selector" is a function that is used to extract the sort key from each item.
    /// For example: jpvs.sort(array, [ { selector: function(x) { return x.firstName; }, descending: false }, 
    /// { selector: function(x) { return x.lastName; }, descending: true } } will return a copy of "array" sorted by firstName (ascending) and 
    /// then by lastName (descending).</param>
    /// <returns type="Array">A sorted copy of the array.</returns>
};

;


window.jpvs = window.jpvs || {};

jpvs.Button = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    
    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Button,
    type: "Button",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the button.</summary>
            return this;
        }
    }
});


jpvs.writeButtonBar = function (container, buttons) {
    /// <summary>Writes a button bar (a DIV with class "ButtonBar" with buttons inside).</summary>
    /// <param name="container" type="Object">Where to write the button bar: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="buttons" type="Array">Array of button definitions. A button definition is like this: { text: "OK", click: eventHandler, cssClass: CSS class }</param>
    /// <returns type="jQuery">A jQuery object that wraps the element just written.</returns>

    return $("*");
};
;


window.jpvs = window.jpvs || {};

jpvs.CheckBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    
    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.CheckBox,
    type: "CheckBox",

    prototype: {
        checked: function (value) {
            /// <summary>Property: true if checked.</summary>
            return this;
        },

        text: function (value) {
            /// <summary>Property: checkbox label.</summary>
            return this;
        }
    }
});


;


window.jpvs = window.jpvs || {};


jpvs.DataGrid = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.dataItemClick = jpvs.event(this);
    this.changedSortFilter = jpvs.event(this);
};


jpvs.DataGrid.getFilteringOperands = function () {
    /// <summary>Returns the list of combobox items for the operand combobox in the filtering options popup.</summary>
    return [];
};


jpvs.makeWidget({
    widget: jpvs.DataGrid,
    type: "DataGrid",

    prototype: {
        template: function (value) {
            /// <summary>Property: grid template. The grid template specifies how data items must be rendered in the data grid. The grid template is an array of column templates (a column template is applied on each row to the corresponding TD element). A column template is in the form: { header: headerTemplate, body: bodyTemplate, footer: footerTemplate } or simply: bodyTemplate when only the body template needs to be specified. The headerTemplate/bodyTemplate/footerTemplate is in the form: TEMPLATE or { isHeader: true/false, template: TEMPLATE }. Here, TEMPLATE is a template in the form used by the jpvs.applyTemplate function. Example: { fieldName: "FirstName" } or function(dataItem) { ... }.</summary>
            return this;
        },

        emptyRowTemplate: function (value) {
            /// <summary>Property: empty row template. This template is used whenever a row with a null/undefined data item is added to the grid. This template, unlike the standard data grid template, is applied to the TR element.</summary>
            return this;
        },

        binder: function (value) {
            /// <summary>Property: binder. The binder specifies how binding is performed. Examples of binders are: defaultBinder (all rows are displayed), pagingBinder (rows are displayed one page at a time with paging enabled), scrollingBinder (rows are displayed one page at a time with a scrollbar on the right side of the data grid).</summary>
            return this;
        },

        caption: function (value) {
            /// <summary>Property: grid caption.</summary>
            return this;
        },

        enableEvenOdd: function (value) {
            /// <summary>Property: true to enable even/odd row styling. If enabled, even rows get an "Even" CSS class and odd rows get an "Odd" CSS class.</summary>
            return this;
        },

        enableSorting: function (value) {
            /// <summary>Property: true to enable sorting.</summary>
            return this;
        },

        enableFiltering: function (value) {
            /// <summary>Property: true to enable filtering.</summary>
            return this;
        },

        sortAndFilterExpressions: function (value) {
            /// <summary>Property: list of combobox items and/or null items used to prompt the user with a list of sort/filter expressions. Only non-null items are used for the combobox that is prompted to the user. The null items are meant to provide the user with visual cues as to which columns are sortable/filterable. More specifically, if the item at index K is null, then the column with index K will not have the sorting/filtering button. For example, if the first two columns should not be sortable while the others should, you can provide a list of items where the first two items are null and the others are not null. Typically, a sort/filter expression is a column name on which the user may perform sorting/filtering. The value of this property is an array of items in the form: { value: sort/filter expression name, text: textual representation of the sort/filter expression }. Example: grid.sortAndFilterExpressions([{ value: "FirstName", text: "First name" }]).</summary>
            return this;
        },

        currentSort: function (value) {
            /// <summary>Property: list of items that specify how the records of the datasource must be sorted. Array items must be in the form: { name: sort expression name, descending: true/false }. Example: grid.currentSort([{ name: "FirstName", descending: false }, { name: "LastName", descending: true }]).</summary>
            return this;
        },

        currentFilter: function (value) {
            /// <summary>Property: list of items that specify how the records of the datasource must be filtered. Array items must be in the form: { name: filter expression name, operand: LT|LTE|EQ|NEQ|GT|GTE|CONTAINS|NCONTAINS|STARTS|NSTARTS, value: ... }. Example: grid.currentFilter([{ name: "FirstName", operand: "GTE", value: "John" }, { name: "FirstName", operand: "LTE", value: "Tom" }]). This filter extracts all records whose FirstName is between "John" and "Tom".</summary>
            return this;
        },

        clear: function (value) {
            /// <summary>Removes all header, body and footer rows from the grid.</summary>
            return this;
        },

        dataBind: function (data) {
            /// <summary>Fills the body section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        dataBindHeader: function (data) {
            /// <summary>Fills the header section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        dataBindFooter: function (data) {
            /// <summary>Fills the footer section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        addBodyRow: function (item, index) {
            /// <summary>Adds a row to the body section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        addHeaderRow: function (item, index) {
            /// <summary>Adds a row to the header section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        addFooterRow: function (item, index) {
            /// <summary>Adds a row to the footer section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeBodyRow: function (index) {
            /// <summary>Removes a row from the body section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeHeaderRow: function (index) {
            /// <summary>Removes a row from the header section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeFooterRow: function (index) {
            /// <summary>Removes a row from the footer section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeBodyRows: function (index, count) {
            /// <summary>Removes rows from the body section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        },

        removeHeaderRows: function (index, count) {
            /// <summary>Removes rows from the header section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        },

        removeFooterRows: function (index, count) {
            /// <summary>Removes rows from the footer section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        }
    }
});


jpvs.DataGrid.defaultBinder = function (section, data) {
    /// <summary>This binder displays all the rows in the datasource. This function can be used directly as the value of the data grid "binder" property.</summary>
};

jpvs.DataGrid.pagingBinder = function (params) {
    /// <summary>This binder displays rows one page at a time with paging enabled. This function creates a paging binder with the specified parameters and returns it. The returned value can be used as the value of the data grid "binder" property.</summary>
    /// <param name="params" type="Object">{ pageSize: Number, preserveCurrentPage: Boolean }. The "preserveCurrentPage" specifies whether the current page must be preserved when the dataBind method is called again.</param>
    /// <returns type="Function">The paging binder.</returns>
};

jpvs.DataGrid.scrollingBinder = function (params) {
    /// <summary>This binder displays rows one page at a time with a scrollbar on the right side. This function creates a scrolling binder with the specified parameters and returns it. The returned value can be used as the value of the data grid "binder" property.</summary>
    /// <param name="params" type="Object">{ pageSize: Number, chunkSize: Number, forcedWidth: CSS value, forcedHeight: CSS value }. The "chunkSize" value specifies how many rows are read from the datasource for caching purposes. The forced width and height, if provided, are applied to the data grid.</param>
    /// <returns type="Function">The scrolling binder.</returns>
};
;


window.jpvs = window.jpvs || {};

jpvs.DateBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DateBox,
    type: "DateBox",

    prototype: {
        date: function (value) {
            /// <summary>Property: date of the datebox.</summary>
            return this;
        },

        isDateValid: function (value) {
            /// <summary>Property: true if the date is valid.</summary>
            return this;
        },

        dateString: function (value) {
            /// <summary>Property: date of the datebox as a string in the YYYYMMDD format.</summary>
            return this;
        },

        dateStringISO: function (value) {
            /// <summary>Property: date of the datebox as a string in the ISO YYYY-MM-DDT00:00:00.000 format.</summary>
            return this;
        }

    }
});


;


window.jpvs = window.jpvs || {};



jpvs.DocumentEditor = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};


jpvs.makeWidget({
    widget: jpvs.DocumentEditor,
    type: "DocumentEditor",

    prototype: {
        document: function (value) {
            /// <summary>Property: document content to display in the editor. It is in the form: { sections: [ { margins: { all: "2cm", top: "...", left: "...", right: "...", bottom: "..." }, header: { margins: { all: "2cm", top: "...", left: "...", right: "..." }, height: "...", content: "(x)html content", highlight: true/false }, footer: { margins: { all: "2cm", bottom: "...", left: "...", right: "..." }, height: "...", content: "(x)html content", highlight: true/false }, body: { content: "(x)html content", highlight: true/false } }, ... ], fields: { fieldName1: { value: "...", highlight: true/false }, fieldName2: { ... } } }.</summary>
            return this;
        },

        fields: function (value) {
            /// <summary>Property: the getter returns the fields (it is equivalent to calling "document().fields"); the setter can change one or more fields and immediately updates the preview. The value is in the form { a: { value: ..., highlight: false }, xxx: { value: ..., highlight: true }, ... }. In this example, fields "a" and "xxx" would be updated (only "xxx" would be highlighted) and all the remaining document fields would be left untouched.</summary>
            return this;
        },

        richTextEditor: function (value) {
            /// <summary>Property: rich text editor. This property allows any rich text editor to be used. Just pass an object like this: { editText: function(content, onDone) {} }. The function is responsible for displaying the rich text editor and allows the user to change the content. The function takes two parameters: (1) "content" is the (X)HTML content to show; (2) onDone is a callback function like this: function onDone(newContent) {}. The editText function must call the onDone callback when the user is done editing the content.</summary>
            return this;
        },

        fieldEditor: function (value) {
            /// <summary>Property: field editor. This property allows any field editor to be used. Just pass an object like this: { editField: function(fields, fieldName, onDone) {} }. The function is responsible for displaying the field editor and allows the user to change the content. The function takes three parameters: (1) "fields" is the fields collection as passed to the "document" property; (2) "fieldName" is the field name that must be edited; (3) onDone is a callback function like this: function onDone(newValue) {}. The editField function must call the onDone callback when the user is done editing the field.</summary>
            return this;
        },

        fieldDisplayMapper: function (value) {
            /// <summary>Property: optional field display mapper. If present, changes the way the field is rendered in the document editor.
            /// It does not change the field value, only the way it is rendered in the document editor. It is a function(text) {} that
            /// must return the text to render. The default field display mapper is function(text) { return text; }. With the default
            /// field display mapper, field values are displayed. By changing this property, you can choose to display some other
            /// text instead of the field value.</summary>
            return this;
        },

        allowEvenOddHeadersFooters: function (value) {
            /// <summary>Property: true to allow setting different headers/footers for even pages and odd pages.</summary>
        }
    }
});

;


window.jpvs = window.jpvs || {};

jpvs.DropDownList = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DropDownList,
    type: "DropDownList",

    prototype: {
        clearItems: function () {
            /// <summary>Removes all the items.</summary>
            return this;
        },

        addItem: function (value, text) {
            /// <summary>Adds an item.</summary>
            /// <param name="value" type="String">Value of the item.</param>
            /// <param name="text" type="String">Text of the item. If omitted, the "value" is used.</param>
            return this;
        },

        addItems: function (items) {
            /// <summary>Adds multiple items.</summary>
            /// <param name="items" type="Array">Array of items to add. Each item may be a string or an object like this: { value: String, text: String }.</param>
            return this;
        },

        count: function () {
            /// <summary>Returns the number of items.</summary>
            return 10;
        },

        selectedValue: function (value) {
            /// <summary>Property: selected value.</summary>
            return this;
        }
    }
});
;


window.jpvs = window.jpvs || {};

jpvs.FileBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    /// <summary>This event is raised whenever the user selects a file; the event handler receives an object in the form
    /// { name: ..., size: ..., type: ... }.</summary>
    this.fileselected = jpvs.event(this);

    /// <summary>This event is raised whenever the user deletes a file.</summary>
    this.filedeleted = jpvs.event(this);

    /// <summary>This event is raised whenever the user clicks on the "rename" button.</summary>
    this.filerename = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.FileBox,
    type: "FileBox",

    prototype: {
        enabled: function (value) {
            /// <summary>Property: if true, the user can upload/remove and open. If disabled, the user can only open.</summary>
            return this;
        },

        allowRename: function (value) {
            /// <summary>Property: if true, when the FileBox is enabled the user can also rename.</summary>
            return this;
        },

        file: function (value) {
            /// <summary>Property: object containing information about the file contained in this FileBox. It is in the form 
            /// { icon: "url of the icon",  label: "text to be displayed", url: "url for opening the file" }. 
            /// This property never changes automatically. The expected usage is: 
            /// (1) the user selects a file; (2) the "fileselected" event is raised; (3) in the "fileselected" handler, the user code 
            /// calls the "postFile" method, passing a callback that sets the "file" property based on the selected file info.
            /// Or: (1) the user clicks the "rename" button; (2) the "filerename" event is raised; (3) in the "filerename"
            /// handler, the user code shows a popup. At the end, it sets the "file" property based on the new name entered.</summary>
            return this;
        },

        postFile: function (url, callback) {
            /// <summary>Posts the file to the given url. At the end, the callback is called with two arguments:
            /// (1) the responseText received from the http post call
            /// (2) the XMLHttpRequest.status property, which should be 200 if the upload was successful.
            /// If a file is selected, it is POST'ed and a FileName header is sent along with it.
            /// Otherwise, if no file is selected, an empty content body is POST'ed and a FileNull header is sent along with it.</summary>
        }
    }
});
;


window.jpvs = window.jpvs || {};

jpvs.ImageButton = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.ImageButton,
    type: "ImageButton",

    prototype: {
        imageUrls: function (value) {
            /// <summary>Property: image urls. It can be a string representing the normal state image url or it can be in the form { normal: String, hover: String }. The two urls contain the two states of the image button: the normal state and the hovering state. If the hover field is not passed, then there will be no hovering effect.</summary>
            return this;
        },

        getNormalImage: function (value) {
            /// <summary>Gets the normal state image url</summary>
            return "";
        },

        getHoverImage: function (value) {
            /// <summary>Gets the hovering state image url</summary>
            return "";
        }
    }
});

;


window.jpvs = window.jpvs || {};

jpvs.LayoutPane = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.resize = jpvs.event(this);
};

jpvs.LayoutPane.refresh = function () {
    /// <summary>Static function for refreshing the entire hierarchy of LayoutPane's.</summary>
};

jpvs.makeWidget({
    widget: jpvs.LayoutPane,
    type: "LayoutPane",

    prototype: {
        anchor: function (value) {
            /// <summary>
            /// Property: specifies where the LayoutPane will be placed. Possible values are:
            ///    - "top": the pane will be anchored to the top edge of the available space
            ///    - "bottom": the pane will be anchored to the bottom edge of the available space
            ///    - "left": the pane will be anchored to the left edge of the available space
            ///    - "right": the pane will be anchored to the right edge of the available space
            ///    - "fill" (default): the pane will fill all the remaining space
            ///
            /// This property may also be specified in HTML by setting the "data-anchor" attribute.
            /// </summary>
            return this;
        },

        size: function (value) {
            /// <summary>
            /// Property: specifies the size of the LayoutPane.
            /// For top-anchored and bottom-anchored panes, the size is the height.
            /// For left-anchored and right-anchored panes, the size is the width.
            /// If the anchor type is "fill", this property is ignored.
            ///
            /// The size may be expressed in CSS units (e.g.: "200px", "10em"). The default value is "auto", which means that
            /// the pane's size will be determined based on its content. However, if the pane contains nested LayoutPanes, 
            /// the "auto" size setting is forbidden.
            ///
            /// This property may also be specified in HTML by setting the "data-size" attribute.
            /// </summary>
            return this;
        },

        resizable: function (value) {
            /// <summary>
            /// Property: specifies whether the LayoutPane may be resized by the user.
            /// If the anchor type is "fill", this property is ignored. Only left/right/top/bottom panes can be resized.
            ///
            /// This property may also be specified in HTML by setting the "data-resizable" attribute.
            /// </summary>
            return this;
        },

        scrollable: function (value) {
            /// <summary>
            /// Property: specifies whether the LayoutPane may be scrolled by the user.
            /// This property may also be specified in HTML by setting the "data-scrollable" attribute.
            /// Default is true.
            /// </summary>
            return this;
        },

        addClass: function (className) {
            /// <summary>Adds a CSS class to the LayoutPane. Adding a CSS class allows the appearance of the LayoutPane to be
            /// customized with borders, background, ...</summary>
            /// <param name="className" type="String">Name of the CSS class to add (or multiple names separated by a space).</param>
            return this;
        },

        actualSizePx: function () {
            /// <summary>
            /// For top/bottom/left/right panes, returns the current/actual size in pixels.
            /// For panes whose anchor property is "fill" returns undefined.
            /// </summary>
            return 100;
        }
    }
});
;


window.jpvs = window.jpvs || {};

jpvs.LinkButton = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.LinkButton,
    type: "LinkButton",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the link button.</summary>
            return this;
        },

        enabled: function (value) {
            /// <summary>Property: true if enabled (default). If disabled, the LinkButton-Disabled class is added.</summary>
            return this;
        }
    }
});

;


window.jpvs = window.jpvs || {};

jpvs.Menu = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Menu,
    type: "Menu",

    prototype: {
        template: function (value) {
            /// <summary>Property: menu template. The menu template is an array of strings or functions. Each array item represents the template to be used for each menu level. Calling "arr" the menu template array, the root level is arr[0], the first level of submenus is arr[1], ... Possible values for each item: "HorizontalMenuBar", "VerticalMenuBar", "PopupMenu", jpvs.Menu.Templates.HorizontalMenuBar, ..., a custom function.</summary>
            return this;
        },

        itemTemplate: function (value) {
            /// <summary>Property: menu item template. The menu item template is an array of strings or functions. Each array item represents the item template to be used for each menu level. Calling "arr" the menu item template array, the root level is arr[0], the first level of submenus is arr[1], ... Possible values for each item: "HorizontalMenuBarItem", "VerticalMenuBarItem", "PopupMenuItem", jpvs.Menu.ItemTemplates.HorizontalMenuBarItem, ..., a custom function.</summary>
            return this;
        },

        menuItems: function (value) {
            /// <summary>Property: array of menu items. Each menu item is in this form: { text: String, icon: Url, tooltip: String, click: Function, href: String, items: Array }. Every field is optional. A separator can be specified as jpvs.Menu.Separator.</summary>
            return this;
        }
    }
});
;


window.jpvs = window.jpvs || {};

jpvs.MultiLineTextBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiLineTextBox,
    type: "MultiLineTextBox",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the multi-line textbox.</summary>
            return this;
        }
    }
});


;


window.jpvs = window.jpvs || {};

jpvs.MultiSelectBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiSelectBox,
    type: "MultiSelectBox",

    prototype: {
        caption: function () {
            /// <summary>Property: caption of the widget. Used as the title of the selection popup.</summary>
            return this;
        },

        prompt: function () {
            /// <summary>Property: prompt string used in the selection popup. May be empty, which means "no prompt string".</summary>
            return this;
        },

        containerTemplate: function () {
            /// <summary>Property: container template. Must create a container and return it. If not specified, 
            /// a default container template is used which creates and returns a UL element. When used, no dataItem 
            /// is passed to this template.</summary>
            return this;
        },

        itemTemplate: function () {
            /// <summary>Property: item template. Must create an item. If not specified, 
            /// a default item template is used which creates an LI element with a checkbox inside.
            /// The template must return an object that has a "selected" property and a "change" event. This object allows
            /// the MultiSelectBox to select/unselect the item, read its state and subscribe to its "change" event.</summary>
            return this;
        },

        groupTemplate: function () {
            /// <summary>Property: group template. Must create a group header. If not specified, 
            /// a default item template is used which creates an LI element with a linkbutton inside.
            /// The template must return nothing. By clicking the linkbutton, all the items within the same 
            /// group are checked/unchecked.</summary>
            return this;
        },

        labelTemplate: function () {
            /// <summary>Property: label template. Given the array of selected items, it must write the summary.
            /// The default label template writes all selected item texts, separated by commas. The dataItem passed to this
            /// template is the array of selected items, each of type { text: ..., value: ... }.</summary>
            return this;
        },

        clearItems: function () {
            /// <summary>Removes all the items.</summary>
            return this;
        },

        addItem: function (value, text, selected, group) {
            /// <summary>Adds an item.</summary>
            /// <param name="value" type="String">Value of the item.</param>
            /// <param name="text" type="String">Text of the item. If omitted, the "value" is used.</param>
            /// <param name="selected" type="Boolean">Specifies if the item must be initially selected.</param>
            /// <param name="group" type="String">Optional group name for grouping items.</param>
            return this;
        },

        addItems: function (items) {
            /// <summary>Adds multiple items.</summary>
            /// <param name="items" type="Array">Array of items to add. Each item may be a string or an object like this: { value: String, text: String, selected: Boolean, group: String }.</param>
            return this;
        },

        count: function () {
            /// <summary>Returns the number of items.</summary>
            return 10;
        },

        selectedValues: function (value) {
            /// <summary>Property: array of selected values.</summary>
            return this;
        },

        selectedValuesString: function (value) {
            /// <summary>Property: selected values as a comma-separated list.</summary>
            return this;
        }
    }
});
;


window.jpvs = window.jpvs || {};


jpvs.Pager = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Pager,
    type: "Pager",

    prototype: {
        page: function (value) {
            /// <summary>Property: current page index.</summary>
            return this;
        },

        totalPages: function (value) {
            /// <summary>Property: total number of pages. If set to null, that means the total number of pages is unknown.</summary>
            return this;
        }
    }
});
;


window.jpvs = window.jpvs || {};

jpvs.PasswordBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.PasswordBox,
    type: "PasswordBox",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the textbox.</summary>
            return this;
        },

        width: function (value) {
            /// <summary>Property: width in CSS units (e.g.: 200px or 25em).</summary>
            return this;
        }
    }
});


;


window.jpvs = window.jpvs || {};


jpvs.Popup = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.close = jpvs.event(this);
};

jpvs.Popup.getTopMost = function () {
    /// <summary>Returns the top-most popup at any given time. Returns null if no popup is currently active.</summary>
    return new jpvs.Popup();
};

jpvs.makeWidget({
    widget: jpvs.Popup,
    type: "Popup",

    prototype: {
        modal: function (value) {
            /// <summary>Property: modal flag (true/false).</summary>
            return this;
        },

        autoHide: function (value) {
            /// <summary>Property: auto-hide flag (true/false). 
            /// If true, when the user clicks outside the popup, the popup is hidden automatically</summary>
            return this;
        },

        autoDestroy: function (value) {
            /// <summary>Property: auto-destroy flag (true/false). 
            /// If true, when the user clicks outside the popup, the popup is destroyed automatically</summary>
            return this;
        },

        position: function (value) {
            /// <summary>Property: specifies how to position the popup when shown. By default, the popup is displayed
            /// centered in the browser viewport. In order to customize the positioning, pass an object like the
            /// following: { my: ..., at: ..., of: ..., collision: ..., position: ... }.
            /// Please see the jQuery UI Position utility for information about "my", "at", "of" and "collision". 
            /// As regards the "position" property, it is applied as a CSS property to the popup. You can pass either "absolute"
            /// or "fixed" depending on how the popup should behave on page scrolling. If "absolute", the popup will scroll together
            /// with the page. If "fixed", the popup will not move when the user scrolls the page.
            /// The default value is: { my: "center", at: "center", of: $(window), collision: "fit", position: "fixed" }, which
            /// means that the popup is centered in the viewport and must not move on page scrolling.</summary>
            return this;
        },

        applyPosition: function (flagAnimate) {
            /// <summary>This function applies the positioning set into the "position" property and makes sure
            /// this popup is not bigger than the viewport. If bigger, it is automatically reduced and scrollbars
            /// are displayed.</summary>
            /// <param name="flagAnimate" type="Boolean">Set to true for animating</param>
            return this;
        },

        show: function (callback) {
            /// <summary>Shows the popup.</summary>
            /// <param name="callback" type="Function">Optional: Function that will be called at the end of the showing animation.</param>
            return this;
        },

        hide: function (callback) {
            /// <summary>Hides the popup.</summary>
            /// <param name="callback" type="Function">Optional: Function that will be called at the end of the hiding animation.</param>
            return this;
        },

        center: function () {
            /// <summary>Centers the popup in the browser window.</summary>
            return this;
        },

        bringForward: function () {
            /// <summary>Brings the popup on top.</summary>
            return this;
        },

        title: function (value) {
            /// <summary>Property: title of the popup. If false or null or empty, no title bar is displayed.</summary>
            return this;
        },

        width: function (value) {
            /// <summary>Property: width of the popup in CSS units (e.g.: 400px or 30em).</summary>
            return this;
        },

        maxWidth: function (value) {
            /// <summary>Property: maximum width of the popup in CSS units (e.g.: 400px or 30em).</summary>
            return this;
        },

        zIndex: function (value) {
            /// <summary>Property: z-index of the popup.</summary>
            return this;
        }
    }
});



jpvs.alert = function (title, text, onclose, buttons) {
    /// <summary>Displays an alert popup with a title, a text, an on-close action, and one or more buttons.</summary>
    /// <param name="title" type="String">Optional: Title of the popup.</param>
    /// <param name="text" type="String">Text of the popup.</param>
    /// <param name="onclose" type="Function">Optional: Function that will be called when the popup is closed or jpvs widget to be focused when the popup is closed or jQuery selector of control to be focused when the popup is closed.</param>
    /// <param name="buttons" type="Array">Optional: Array of button definitions. A button definition is like this: { text: "OK", click: eventHandler }. The jpvs.writeButtonBar is used; see it for additional info.</param>
};


jpvs.confirm = function (title, text, onYes, onNo, textYes, textNo) {
    /// <summary>Displays a confirmation popup with two customizable Yes/No buttons.</summary>
    /// <param name="title" type="String">Title of the popup.</param>
    /// <param name="text" type="String">Text of the popup.</param>
    /// <param name="onYes" type="Function">Optional: Function that will be called if the user clicks the Yes button.</param>
    /// <param name="onNo" type="Function">Optional: Function that will be called if the user clicks the No button.</param>
    /// <param name="textYes" type="String">Optional: Text of the Yes button (default = "OK").</param>
    /// <param name="textNo" type="String">Optional: Text of the No button (default = "Cancel").</param>
};
;


window.jpvs = window.jpvs || {};

jpvs.ProgressBar = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.ProgressBar,
    type: "ProgressBar",

    prototype: {
        width: function (value) {
            /// <summary>Property: width in CSS units (e.g.: 100px or 20em); may be null, which means the CSS class width, if any, is applied.</summary>
            return this;
        },

        progress: function (value) {
            /// <summary>Property: progress percentage (number between 0 and 100, inclusive). Default: 50.</summary>
            return this;
        },

        text: function (value) {
            /// <summary>Property: text to write inside the progress bar; may be null, which means no text is displayed.</summary>
            return this;
        },

        color: function (value) {
            /// <summary>Property: progress bar color; may be null, which means the CSS class color, if any, is applied.</summary>
            return this;
        }
    }
});

;


window.jpvs = window.jpvs || {};

jpvs.Scheduler = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.requireAdd = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Scheduler,
    type: "Scheduler",

    prototype: {
        readDataFunction: function (value) {
            /// <summary>
            /// Property: get/set current function responsible for loading the data items to display.
            /// The function must have the following signature: function(start, to, callback) {}.
            /// The two "start" and "to" parameters are dates in the YYYYMMDD format. The function must call the callback passing
            /// an array of data items satisfying the passed date range criterion. Each item, at a minimum, must have four string properties:
            /// - dateFrom and dateTo (YYYYMMDD)
            /// - timeFrom and timeTo (HHmm)
            /// </summary>
            return this;
        },

        mode: function (value) {
            /// <summary>Property: get/set current display mode (one of the following strings: "day", "week", "month", "agenda").</summary>
            return this;
        },

        date: function (value) {
            /// <summary>Property: get/set the current date in YYYYMMDD format.</summary>
            return this;
        },

        refresh: function () {
            /// <summary>Reloads fresh data into the widget.</summary>
            return this;
        },

        dayItemTemplate: function (value) {
            /// <summary>Property: get/set the current template used for data items when the mode is "day".</summary>
            return this;
        },

        weekItemTemplate: function (value) {
            /// <summary>Property: get/set the current template used for data items when the mode is "week".</summary>
            return this;
        },

        monthItemTemplate: function (value) {
            /// <summary>Property: get/set the current template used for data items when the mode is "month".</summary>
            return this;
        },

        agendaItemTemplate: function (value) {
            /// <summary>Property: get/set the current template used for data items when the mode is "agenda".</summary>
            return this;
        }

    }
});


;


window.jpvs = window.jpvs || {};


jpvs.Scroller = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Scroller,
    type: "Scroller",

    prototype: {
        objectSize: function (value) {
            /// <summary>Property: total object size { width: CSS units, height: CSS units }. This is the visible size of the widget, which looks like a box with scrollbars inside.</summary>
            return this;
        },

        scrollableSize: function (value) {
            /// <summary>Property: size of the scrollable area ({ width: CSS units, height: CSS units }). The scrollable area is used only for sizing the scrollbars. It is assumed that this area is the total area that will be scrolled inside the object's visible viewport (the object size property).</summary>
            return this;
        },

        contentSize: function (value) {
            /// <summary>Property: size of the content area ({ width: CSS units, height: CSS units }). It may be different from the scrollable size because the jpvs Scroller decouples the amount of scrolling set by the scrollbars from the actual amount of scrolling of the contents.</summary>
            return this;
        },

        scrollPosition: function (value) {
            /// <summary>Property: scroll position as specified by the scrollbars ({ top: pixels, left: pixels }). Setting this property only affects the scrollbars, not the content.</summary>
            return this;
        },

        contentPosition: function (value) {
            /// <summary>Property: content position ({ top: pixels, left: pixels }). Setting this property only affects the content, not the scrollbars.</summary>
            return this;
        }
    }
});
;


window.jpvs = window.jpvs || {};

jpvs.SearchEngine = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.SearchEngine,
    type: "SearchEngine",

    prototype: {
        label: function (value) {
            /// <summary>Property: label displayed on top of the search string textbox.</summary>
            return this;
        },

        applyAdditionalFieldsTemplate: function (template) {
            /// <summary>Allows writing additional search fields below the search string textbox.</summary>
            /// <param name="template" type="Object">Template that will be passed to jpvs.applyTemplate for writing the additional
            /// fields. The data item that will be passed to the jpvs.applyTemplate is this SearchEngine widget.
            /// It is the template's responsibility to call the refresh function whenever the search results must be updated.</param>
            return this;
        },

        searchFunction: function (value) {
            /// <summary>Property: function that this widget uses for searching whenever the user enters text into
            /// the textbox. The function must be declared as: function(text, callback) {} and must search for the
            /// given text. At the end, it must call callback(searchResults) where "searchResults" is the array of items
            /// to be displayed.</summary>
            return this;
        },

        gridTemplate: function (value) {
            /// <summary>Property: template used for the jpvs.DataGrid that displays the results. Please see the
            /// documentation of jpvs.DataGrid for information on the "template" property.</summary>
            return this;
        },

        pageSize: function (value) {
            /// <summary>Property: page size for grid pagination. If null, no pagination is applied. Otherwise, a pager is
            /// displayed on top of the DataGrid.</summary>
            return this;
        },

        refresh: function () {
            /// <summary>Causes the search results to be refreshed immediately, rather than wait for the user to enter text.</summary>
            return this;
        }
    }
});

;


window.jpvs = window.jpvs || {};


jpvs.Table = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.Table,
    type: "Table",

    prototype: {
        addClass: function (classNames) {
            /// <summary>Proxy to jQuery addClass function.</summary>
            return this;
        },

        removeClass: function (classNames) {
            /// <summary>Proxy to jQuery removeClass function.</summary>
            return this;
        },

        css: function () {
            /// <summary>Proxy to jQuery css function.</summary>
            return this;
        },

        writeHeaderRow: function () {
            /// <summary>Writes a new row in the header.</summary>
            return new JPVS_RowObject();
        },

        writeBodyRow: function () {
            /// <summary>Writes a new row in the body.</summary>
            return new JPVS_RowObject();
        },

        writeRow: function () {
            /// <summary>Writes a new row in the body.</summary>
            return new JPVS_RowObject();
        },

        writeFooterRow: function () {
            /// <summary>Writes a new row in the footer.</summary>
            return new JPVS_RowObject();
        },

        caption: function (value) {
            /// <summary>Property: table caption.</summary>
            return this;
        },

        clear: function () {
            /// <summary>Removes all rows from header, body and footer.</summary>
            return this;
        }
    }
});

function JPVS_RowObject() {
}

JPVS_RowObject.prototype.writeHeaderCell = function (text) {
    /// <summary>Writes a header cell (TH) and returns the jQuery object that represents the cell.</summary>
    /// <param name="text" type="String">Optional: text to write in the cell.</param>
    return $("");
};

JPVS_RowObject.prototype.writeCell = function (text) {
    /// <summary>Writes a cell (TD) and returns the jQuery object that represents the cell.</summary>
    /// <param name="text" type="String">Optional: text to write in the cell.</param>
    return $("");
};
;


window.jpvs = window.jpvs || {};

(function () {

    jpvs.TableExtender = {
        create: function (table) {
            /// <summary>Creates a TableExtender and attaches it to an existing table widget, table selector, table element.</summary>
            /// <param name="table" type="Object">The DOM element or jQuery object or JPVS widget to which the TableExtender must be associated.</param>
            return new Extender();
        }
    };


    function Extender(tableElement) {
        this.afterResize = new jpvs.Event();
        this.changeFilterSort = new jpvs.Event();
    }

    Extender.prototype.defaultColWidth = function (colIndex, pixelWidth) {
        /// <summary>Sets a default width for the column</summary>
        return this;
    };

    Extender.prototype.resizableColumns = function (value) {
        /// <summary>Property: true/false. Specifies whether the resizable columns extension must be activated.</summary>
        return this;
    };

    Extender.prototype.persistColumnSizes = function (value) {
        /// <summary>Property: true/false. Specifies whether the column sizes after a resize must be persisted on localStorage.
        /// Two custom attributes should be used in order to identify the table and its columns. The first one is "data-table-name" and
        /// must be applied to the table element. Then, on each COL element, a "data-col-name" should be used.</summary>
        return this;
    };

    Extender.prototype.persistSortSettings = function (value) {
        /// <summary>Property: true/false. Specifies whether the sorting settings must be persisted on localStorage.</summary>
        return this;
    };

    Extender.prototype.persistFilterSettings = function (value) {
        /// <summary>Property: true/false. Specifies whether the filtering settings must be persisted on localStorage.</summary>
        return this;
    };

    Extender.prototype.enableFiltering = function (value) {
        /// <summary>Property: true/false. Specifies whether row filtering has to be enabled. Column names must be identified by the
        /// "data-col-name" attribute on each COL element. Column friendly names (displayed in the filtering popup) are taken
        /// from the "data-col-header" attribute. Set the "data-col-filter" attribute to "false" to disable filtering on single 
        /// columns. Set the "data-col-type" attribute to "date" if you want the filter to treat values as dates (yyyymmdd). 
        /// In this case, a DateBox is used for entering filtering values and only meaningful filtering rules are allowed.
        /// The default value is data-col-type="text". Currently, only "date" and "text" are handled.</summary>
        return this;
    };

    Extender.prototype.enableSorting = function (value) {
        /// <summary>Property: true/false. Specifies whether row sorting has to be enabled. Column names must be identified by the
        /// "data-col-name" attribute on each COL element. Column friendly names (displayed in the sorting popup) are taken
        /// from the "data-col-header" attribute. Set the "data-col-sort" attribute to "false" to disable sorting on single columns.</summary>
        return this;
    };

    Extender.prototype.getSortAndFilterSettings = function () {
        /// <summary>Gets sorting and filtering settings. Returns an object of type { sort: [], filter: [] }.
        /// The "sort" field is an array of sorting rules. Each sorting rule has this form: { colName: <value of the COL's "data-col-name" attribute>,
        /// colHeader: <value of the "data-col-header" attribute, descending: <true/false> }.
        /// The "filter" field is an array of filtering rules. Each filtering rule has this form:
        /// { 
        ///     colName: <value of the COL's "data-col-name" attribute>, 
        ///     colHeader: <value of the "data-col-header" attribute, 
        ///     operand: <"EQ" | "NEQ" | "CONTAINS" | "NCONTAINS" | "STARTS" | "NSTARTS" | "LT" | "LTE" | "GT" | "GTE">, 
        ///     value: <value set by the user>
        /// }
    };

    Extender.prototype.clearSortAndFilterSettings = function () {
        /// <summary>Resets sort and filter settings to no-sort and no-filter.</summary>
    };

    Extender.prototype.tableHeaderAlwaysVisible = function () {
        /// <summary>Property: true/false. Specifies whether the table header must always be visible even when it would otherwise scroll
        /// out of sight.</summary>
    };

    Extender.prototype.apply = function () {
        /// <summary>Activates this TableExtender. First, you must create the extender via the "create" function. Then,
        /// you must configure it through its properties (e.g.: resizableColumns, persistColumnSizes, ...). Finally,
        /// you activate it by calling "apply". After modifying the set of columns, it is possible to call this method again
        /// in order to reapply the extender to the table.</summary>
    };

})();
;


window.jpvs = window.jpvs || {};

jpvs.TextBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
    this.lazychange = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.TextBox,
    type: "TextBox",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the textbox.</summary>
            return this;
        },

        width: function (value) {
            /// <summary>Property: width in CSS units (e.g.: 200px or 25em).</summary>
            return this;
        },

        autocomplete: function (autoCompleteItems) {
            /// <summary>Turns on or off the autocomplete feature of the TextBox.</summary>
            /// <param name="autoCompleteItems" type="Object">Pass null or false to disable the autocomplete feature. Pass an array of strings to enable it.</param>
            return this;
        }
    }
});


;


window.jpvs = window.jpvs || {};

jpvs.TileBrowser = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.tileClick = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.TileBrowser,
    type: "TileBrowser",

    prototype: {
        refresh: function (flagAnimate) {
            ///<summary>Force a refresh of the tile browser. Useful after setting some properties and a redraw is needed.
            ///Note that after setting a property such as originX or tileHeight, the tile browser is not automatically refreshed. This allows
            ///unnecessary redraws to be avoided when, for example, multiple properties are to be set in sequence.</summary>
            /// <param name="flagAnimate" type="Boolean">If true, an animation is started, otherwise a simple redraw is done.</param>
        },

        startingTile: function (value) {
            ///<summary>Property: starting tile object, from which tile layout and rendering will begin. Tile objects will be rendered into
            ///fixed sized tiles. A tile object must define at least three members: "template", "getNextTile", "getPreviousTile".
            ///The "template" member will be used for rendering the tile object into the tile area by calling jpvs.applyTemplate(template, { tileObject: XXX, tileBrowser: YYY }).
            ///The other two functions should return the next tile object and the previous tile object, if any, otherwise they must return nothing
            ///(null or undefined). If null is passed as the starting tile, then the tile browser will have no tiles.
            ///</summary>
        },

        width: function (value) {
            ///<summary>Property: gets the width in pixels, sets the width as CSS units (e.g.: 100px, 150pt, 6cm, 80%, ...).</summary>
        },

        height: function (value) {
            ///<summary>Property: gets the height in pixels, sets the height as CSS units (e.g.: 100px, 150pt, 6cm, 80%, ...).</summary>
        },

        tileWidth: function (value) {
            ///<summary>Property: gets/sets the tile width in pixels. If not specified or null, defaults to 1/8 of the TileBrowser width.</summary>
        },

        tileHeight: function (value) {
            ///<summary>Property: gets/sets the tile height in pixels. If not specified or null, defaults to the value of the tileWidth property.</summary>
        },

        desiredTileWidth: function (value) {
            ///<summary>Property: gets/sets the desired tile width in pixels. If different from the tileWidth, then the tileWidth will be animated to match.</summary>
        },

        desiredTileHeight: function (value) {
            ///<summary>Property: gets/sets the desired tile height in pixels. If different from the tileHeight, then the tileHeight will be animated to match.</summary>
        },

        tileSpacingHorz: function (value) {
            ///<summary>Property: gets/sets the horizontal spacing between tiles in pixels. If not specified or null, defaults to 1/5 of the tileWidth property.</summary>
        },

        tileSpacingVert: function (value) {
            ///<summary>Property: gets/sets the vertical spacing between tiles in pixels. If not specified or null, defaults to 1/5 of the tileHeight property.</summary>
        },

        originX: function (value) {
            ///<summary>Property: gets/sets the X coordinate of the origin. The origin is where the center of the starting tile is positioned.</summary>
        },

        originY: function (value) {
            ///<summary>Property: gets/sets the Y coordinate of the origin. The origin is where the center of the starting tile is positioned.</summary>
        },

        desiredOriginX: function (value) {
            ///<summary>Property: gets/sets the desired X coordinate of the origin. If different from originX, then originX will be animated to match.</summary>
        },

        desiredOriginY: function (value) {
            ///<summary>Property: gets/sets the desired Y coordinate of the origin. If different from originY, then originY will be animated to match.</summary>
        }
    }
});

;


window.jpvs = window.jpvs || {};

jpvs.Tree = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.nodeClick = jpvs.event(this);
    this.nodeRightClick = jpvs.event(this);
    this.nodeRendered = jpvs.event(this);
};

jpvs.Tree.Templates = {
    StandardNode: function (node) {
        /// <summary>Standard template for a tree node.</summary>
        return new jpvs.Tree.NodeElement();
    },

    StandardChildrenContainer: function (node) {
        /// <summary>Standard template for a tree children container.</summary>
        return new jpvs.Tree.ChildrenContainerElement();
    }
};


jpvs.Tree.NodeElement = function (node, element, refreshStateFunc, selectNodeFunc, refreshNodeFunc) {
    /// <summary>The node template returns an object of this type.</summary>
    /// <param name="node" type="Object">The node data item.</param>
    /// <param name="element" type="Object">The DOM element created by the node template.</param>
    /// <param name="refreshStateFunc" type="Function">Function that refreshes the state of the element (open/closed state and state icon) 
    /// based on whether the node has children and/or is open/close. The function will receive "this" set to the current node element.</param>
    /// <param name="selectNodeFunc" type="Function">Function that selects the current node. The function will receive "this" set to the current node element.</param>
    /// <param name="refreshNodeFunc" type="Function">Function that refreshes the current node. The function will receive "this" set to the current node element.</param>
    this.node = {};
    this.element = $();
    this.refreshState = function () { };
    this.select = function () { };
    this.refreshNode = function () { };

    this.parentNodeElement = new jpvs.Tree.NodeElement();
    this.childrenContainerElement = new jpvs.Tree.ChildrenContainerElement();
    this.childrenNodeElements = [];
};

jpvs.Tree.NodeElement.prototype.getTree = function () {
    /// <summary>Returns the current Tree widget.</summary>
    return new jpvs.Tree();
};

jpvs.Tree.NodeElement.prototype.isExpanded = function () {
    /// <summary>Returns true if this node element is expanded.</summary>
    return false;
};

jpvs.Tree.NodeElement.prototype.toggle = function () {
    /// <summary>Toggles the expanded/collapsed state of the node.</summary>
};

jpvs.Tree.NodeElement.prototype.collapse = function () {
    /// <summary>Collapses the node.</summary>
};

jpvs.Tree.NodeElement.prototype.expand = function (callback) {
    /// <summary>Expands the node.</summary>
    ///<param name="callback" type="Function">Function with no arguments that will be called at the end of the operation.</param>
};

jpvs.Tree.NodeElement.prototype.setMarkerIcon = function (imgUrl) {
    /// <summary>Changes the marker icon, if a marker icon is present.</summary>
    /// <param name="imgUrl" type="String">The new marker icon to set.</param>
};


jpvs.Tree.ChildrenContainerElement = function (node, element) {
    /// <summary>The children container template returns an object of this type.</summary>
    /// <param name="node" type="Object">The node data item.</param>
    /// <param name="element" type="Object">The DOM element created by the node template.</param>
    this.node = {};
    this.element = $();
    this.nodeElement = new jpvs.Tree.NodeElement();
};


jpvs.makeWidget({
    widget: jpvs.Tree,
    type: "Tree",

    prototype: {
        nodeTemplate: function (value) {
            ///<summary>Property: node template. The node template is the template used for every tree node. See
            ///jpvs.applyTemplate for information about templates. The jpvs.Tree.Templates.StandardNode is the default
            ///template used when a template is not explicitly set. The StandardNode template has an imagebutton for displaying
            ///the node state (open/closed), an optional icon (field "icon" of the node item) and a text (extracted by the toString method); nodes are
            ///clickable and expand/collapse accordingly.</summary>
        },

        childrenContainerTemplate: function (value) {
            ///<summary>Property: children container template. The children container template is used for every children
            ///container and is written just after the node template. The default children container template is
            ///jpvs.Tree.Templates.StandardChildrenContainer.</summary>
        },

        childrenSelector: function (value) {
            ///<summary>Property: children selector. The children selector is a function that extracts the children items from
            ///the node data item. The default behavior is to return the "children" data field. The children selector
            ///may be either synchronous or asynchronous.
            ///Synchronous version: function selector(node) { return node.xxx; }, where "xxx" is the field that contains
            ///the list of children. If it return null, it means no data and it is equivalent to "return [];".
            ///Asynchronous version: function asyncSelector(node, callback) { }; the function must return nothing (undefined).
            ///When data is ready, it must call the callback with the list of children as the first argument. If no data
            ///has to be returned, similarly to the synchronous version, "callback(null)" and "callback([])" are equivalent.</summary>
        },

        dataBind: function (data) {
            ///<summary>Fills the tree from an array of nodes. Only the root level is populated immediately.
            ///Lower levels in the hierarchy are populated on-demand, using the childrenSelector, which may be either
            ///synchronous or asynchronous.</summary>
            ///<param name="data" type="Object">The datasource. It can be an array of nodes or a function. 
            ///See jpvs.readDataSource for details on how a datasource is expected to work.</param>
        },

        refreshNode: function (nodeElement) {
            ///<summary>Refreshes a given NodeElement. Only the node is affected, not its children. Use this function after changing the text or
            ///the icon. Use the refreshChildren function when you need to refresh the children nodes.</summary>
            ///<param name="nodeElement" type="jpvs.Tree.NodeElement">Node element to be refreshed.</param>
        },

        refreshChildren: function (nodeElement, callback) {
            ///<summary>Given a NodeElement, uses the childrenSelector to load/reload the children and then updates 
            ///the ChildrenContainer with the newly-read nodes.</summary>
            ///<param name="nodeElement" type="jpvs.Tree.NodeElement">Node element whose children are to be reloaded.</param>
            ///<param name="callback" type="Function">Function with no arguments that will be called at the end of the operation.</param>
        },

        nodeElements: function () {
            ///<summary>Returns the root node elements after databinding.</summary>
            return [];
        }
    }
});

