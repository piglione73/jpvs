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

window.jpvs = window.jpvs || {};

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
    /// <param name="propdef" type="Object">Property definition. It is an object that may contain fields "get" and "set".</param>
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
};


jpvs.createAllWidgets = function () {
    /// <summary>Creates all widgets automatically.</summary>
};


jpvs.write = function (container, text) {
    /// <summary>Writes text.</summary>
    /// <param name="container" type="String">Where to write the text: jQuery selector or jQuery object.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
};

jpvs.writeln = function (container, text) {
    /// <summary>Writes text and terminates the current line.</summary>
    /// <param name="container" type="String">Where to write the text: jQuery selector or jQuery object.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
};

jpvs.writeTag = function (container, tagName, text) {
    /// <summary>Writes a tag with optional text inside.</summary>
    /// <param name="container" type="String">Where to write: jQuery selector or jQuery object.</param>
    /// <param name="tagName" type="String">The tag name to write.</param>
    /// <param name="text" type="String">Optional: the text to write. Newlines in the string are handled correctly.</param>
    /// <returns type="jQuery">A jQuery object that wraps the element just written.</returns>
};

jpvs.applyTemplate = function (container, template, dataItem) {
    /// <summary>Writes content according to a template.</summary>
    /// <param name="container" type="String">Where to write: jQuery selector or jQuery object.</param>
    /// <param name="template" type="Object">The template may be any of the following: (1) a string; (2) an object like this: { fieldName: "ABC", tagName: "TAG", css: {}, selector: function(fieldValue, dataItem) {} }; (3) a function(dataItem) {} that will receive the container as the "this" object.</param>
    /// <param name="dataItem" type="String">Optional: the data item that will be consumed by the template.</param>
};

jpvs.readDataSource = function (data, start, count, callback) {
    /// <summary>This function handles extraction of data from various types of data sources and returns data asynchronously to a callback.</summary>
    /// <param name="data" type="Array">Array of records or function(start, count) that returns the data or function(start, count, callback) that asynchronously fetches the data and passes it to the callback.</param>
    /// <param name="start" type="Number">Index of the first element desired. If null or undefined, 0 is implied.</param>
    /// <param name="count" type="Number">Number of elements desired. If null or undefined, the entire data set is fetched.</param>
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

window.jpvs = window.jpvs || {};

jpvs.Event = function (widget) {
    /// <summary>Generic widget event. The result of "new jpvs.Event(...)" is the object "obj", which has props "widget" and "handlers" and can also be called as a function (the "bind" function).</summary>
    /// <param name="widget" type="Widget">The widget to which the event is to be attached.</param>
    /// <returns type="jpvs.Event">The newly-created event.</returns>
    var obj = function (handlerName, handler) {
        /// <summary>Binds an handler to this event.</summary>
        /// <param name="handlerName" type="String">Optional: the handler name. This argument may be omitted.</param>
        /// <param name="handler" type="Function">The event handler to bind to this event. The event handler is a function handler(widget) {} that receives the widget that received the event as the argument. Also, in the handler function body, "this" refers to the same widget that is passed as the argument.</param>
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
    /// <summary>Binds an handler to this event.</summary>
    /// <param name="handlerName" type="String">Optional: the handler name. This argument may be omitted.</param>
    /// <param name="handler" type="Function">The event handler to bind to this event. The event handler is a function handler(widget) {} that receives the widget that received the event as the argument. Also, in the handler function body, "this" refers to the same widget that is passed as the argument.</param>
    /// <returns type="Widget">The widget.</returns>
};

jpvs.Event.prototype.unbind = function (handlerName) {
    /// <summary>Unbinds an handler that has been bound by name.</summary>
    /// <param name="handlerName" type="String">Name of the handler to unbound.</param>
    /// <returns type="Widget">The widget.</returns>
};

jpvs.Event.prototype.fire = function (widget, handlerName, params) {
    /// <summary>Fires this event.</summary>
    /// <param name="widget" type="Widget">The widget that is generating the event.</param>
    /// <param name="handlerName" type="String">Optional: name of the handler to trigger, in case only a specific handler must be triggered. This argument may be omitted.</param>
    /// <param name="params" type="Object">Parameters that are passed to the handler. The handler is called as handler(params) and inside the handler "this" refers to the "widget".</param>
    /// <returns type="Widget">The widget.</returns>
};

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
    
