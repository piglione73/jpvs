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
        $.each(widgetDef.prototype, function (memberName, member) {
            fn.prototype[memberName] = member;
        });
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

