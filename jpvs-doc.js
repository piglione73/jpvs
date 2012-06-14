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

jpvs.Event.prototype.fire = function (widget, handlerName, params) {
    /// <summary>Fires this event.</summary>
    /// <param name="widget" type="Widget">The widget that is generating the event.</param>
    /// <param name="handlerName" type="String">Optional: name of the handler to trigger, in case only a specific handler must be triggered. This argument may be omitted.</param>
    /// <param name="params" type="Object">Parameters that are passed to the handler. The handler is called as handler(params) and inside the handler "this" refers to the "widget".</param>
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
    

window.jpvs = window.jpvs || {};

jpvs.randomString = function (len) {
    /// <summary>Creates a random string of a given length and containing uppercase letters and digits only.</summary>
    /// <param name="len" type="Number">The length of the string to be generated.</param>
    /// <returns type="String">A random string.</returns>
};

window.jpvs = window.jpvs || {};

jpvs.getSessionID = function () {
    /// <summary>Gets the current "jpvs session ID". When using the jpvs library, each browser session has a unique "jpvs session ID" that may be used instead of a session cookie.</summary>
    /// <returns type="String">The current session ID.</returns>
    return "ABCDEFG";
};

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
    /// <param name="buttons" type="Array">Array of button definitions. A button definition is like this: { text: "OK", click: eventHandler }</param>
    /// <returns type="jQuery">A jQuery object that wraps the element just written.</returns>

    return $("*");
};

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
            /// <summary>Property: list of combobox items and/or null items used to prompt the user with a list of sort/filter expressions. Only non-null items are used for the combobox that is propmted to the user. The null items are meant to provide the user with visual cues as to which columns are sortable/filterable. More specifically, if the item at index K is null, then the column with index K will not have the sorting/filtering button. For example, if the first two columns should not be sortable while the others should, you can provide a list of items where the first two items are null and the others are not null. Typically, a sort/filter expression is a column name on which the user may perform sorting/filtering. The value of this property is an array of items in the form: { value: sort/filter expression name, text: textual representation of the sort/filter expression }. Example: grid.sortAndFilterExpressions([{ value: "FirstName", text: "First name" }]).</summary>
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
            /// <summary>Property: image urls. It is in the form { normal: String, hover: String }. The two urls contain the two states of the image button: the normal state and the hovering state.</summary>
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
        }
    }
});


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
            /// <summary>Property: total number of pages.</summary>
            return this;
        }
    }
});

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

        show: function () {
            /// <summary>Shows the popup.</summary>
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
            /// <summary>Property: title of the popup.</summary>
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
    /// <param name="onclose" type="Function">Optional: Function that will be called when the popup is closed or jpvs widget to be focused when the popup is closed.</param>
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

window.jpvs = window.jpvs || {};

jpvs.TextBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
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
        }
    }
});


