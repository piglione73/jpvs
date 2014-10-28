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
