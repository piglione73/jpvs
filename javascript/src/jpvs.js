function jpvs(onready) {
    $(document).ready(onready);
}

jpvs.states = {
    HOVER: "Hover",
    FOCUS: "Focus",
    ERROR: "Error"
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

jpvs.makeWidget = function (widgetDef) {
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
    fn.prototype.bind = bind();
    fn.prototype.unbind = unbind();
    fn.prototype.addState = addState(widgetDef);
    fn.prototype.removeState = removeState(widgetDef);


    function bind() {
        return function (eventType, p1, p2) {
            var obj = this;
            var eventData, handler;
            if (typeof (p1) == "object") {
                eventData = p1;
                handler = p2;
            }
            else
                handler = p1;

            this.element.bind.call(this.element, eventType, eventData, function (event) {
                handler.call(obj, event);
            });

            return this;
        };
    }

    function unbind() {
        return function (eventType) {
            this.element.unbind.call(this.element, eventType);
            return this;
        };
    }

    function create_static(widgetDef) {
        return function (selector) {
            var objs = [];

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
            this.element.addClass(widgetDef.cssClass);

            //Initialize widget behavior
            init(this);
            widgetDef.init.call(this);
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

