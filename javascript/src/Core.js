﻿/* JPVS
Module: core
Classes: jpvs
Depends:
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
        };
    }

    function addState(wd) {
        return function (state) {
            this.element.addClass("Widget-" + state);
            this.element.addClass(wd.cssClass + "-" + state);
        };
    }

    function removeState(wd) {
        return function (state) {
            this.element.removeClass("Widget-" + state);
            this.element.removeClass(wd.cssClass + "-" + state);
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
        $.each(lines, function (i, line) {
            $(container).append(document.createTextNode(line));
            $(container).append(document.createElement("br"));
        });
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
    Or it could be in the form: { fieldName: "ABC", tagName: "TAG" }.
    Extract dataItem.ABC and write it as text (optionally in the specified tag name).
    */
    if (template.fieldName) {
        if (template.tagName)
            jpvs.writeTag(container, template.tagName, dataItem && dataItem[template.fieldName]);
        else
            jpvs.write(container, dataItem && dataItem[template.fieldName]);

        return;
    }

    /*
    Or it could be a function. Call it with this = container.
    */
    if (typeof (template) == "function") {
        template.call(container, dataItem);
        return;
    }

    /*
    Don't know what to do here.
    */
    jpvs.alert("JPVS Error", "The specified template is not valid.");
};
