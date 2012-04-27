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
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
};

jpvs.writeln = function (container, text) {
    /// <summary>Writes text and terminates the current line.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
};

jpvs.writeTag = function (container, tagName, text) {
    /// <summary>Writes a tag with optional text inside.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="tagName" type="String">The tag name to write.</param>
    /// <param name="text" type="String">Optional: the text to write. Newlines in the string are handled correctly.</param>
    /// <returns type="jQuery">A jQuery object that wraps the element just written.</returns>
};

jpvs.applyTemplate = function (container, template, dataItem) {
    /// <summary>Writes content according to a template.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
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
