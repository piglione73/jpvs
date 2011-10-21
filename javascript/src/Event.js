jpvs.Event = function (widget) {
    this.widget = widget;
    this.handlers = {};
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
