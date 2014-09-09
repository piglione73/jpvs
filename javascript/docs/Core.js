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


jpvs.write = function (container, text) {
    /// <summary>Writes text.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
};

jpvs.writeln = function (container, text) {
    /// <summary>Writes text and terminates the current line.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
    return $("");
};

jpvs.writeTag = function (container, tagName, text) {
    /// <summary>Writes a tag with optional text inside.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="tagName" type="String">The tag name to write.</param>
    /// <param name="text" type="String">Optional: the text to write. Newlines in the string are handled correctly.</param>
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
    /// <returns type="Object">An object containing the "refresh" function, that forces a repositioning of the header. 
    /// Calling the refresh function after changing the table content ensures the header is properly repositioned.</returns>
    return {
        refresh: function () { }
    };
};
