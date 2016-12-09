jpvs.Event = function (widget) {
    //The result of "new jpvs.Event(...)" is the object "obj", which has props "widgets" and "handlers" and can also be called as a function
    //(the "bind" function)
    var obj = function (handlerName, handler) {
        return obj.bind(handlerName, handler);
    };

    obj.bind = jpvs.Event.prototype.bind;
    obj.unbind = jpvs.Event.prototype.unbind;
    obj.fire = jpvs.Event.prototype.fire;

    obj.widget = widget;
    obj.handlers = {};
    obj.internalCounter = 0;
    return obj;
};

jpvs.Event.prototype.bind = function (handlerName, handler) {
    if (!handler) {
        handler = handlerName;
        handlerName = (this.internalCounter++).toString();
    }

    this.handlers[handlerName] = handler;

    return this.widget;
};

jpvs.Event.prototype.unbind = function (handlerName) {
    delete this.handlers[handlerName];
    return this.widget;
};

jpvs.Event.prototype.fire = function (widget, handlerName, params, browserEvent) {
    if (handlerName)
        return fireHandler(this.handlers[handlerName]);
    else {
        var ret = true;
        for (var hn in this.handlers) {
            var h = this.handlers[hn];
            var ret2 = fireHandler(h);

            //Combine the return values of all handlers. If any returns false, we return false
            ret = ret && ret2;
        }

        return ret;
    }

    function fireHandler(handler) {
        if (handler) {
            if (widget)
                widget.currentBrowserEvent = browserEvent;

            var hret = handler.call(widget, params);

            if (widget)
                widget.currentBrowserEvent = null;
            return hret;
        }
    }
};
