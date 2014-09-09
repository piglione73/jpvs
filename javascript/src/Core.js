/* JPVS
Module: core
Classes: jpvs
Depends: bootstrap
*/

(function () {

    //If X is a jpvs widget, get the jQuery object representing the main content element of X
    //Otherwise, return X
    function toElement(X) {
        if (!X)
            return X;

        if (X.getMainContentElement)
            return X.getMainContentElement();
        else
            return $(X);
    }

    jpvs.getElementIfWidget = toElement;

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

            //Add an "each" method for easily iterating over the returned widgets
            widgets.each = function (action) {
                for (var i = 0; i < widgets.length; i++) {
                    var w = widgets[i];
                    action.call(w, w);
                }
            };

            return widgets;
        }
    };

    jpvs.states = {
        HOVER: "Hover",
        FOCUS: "Focus",
        ERROR: "Error",
        DISABLED: "Disabled"
    };

    jpvs.property = function (propdef) {
        return function (value, flagAsync, onSuccess, onProgress, onError) {
            if (value === undefined) {
                //Get property value (synchronous style)
                return propdef.get.call(this);
            }
            else {
                //Set property value (synchronous/asynchronous style)
                //For synchronous, no callbacks
                //For asynchronous, use callbacks if specified
                //We may have set and/or setTask or none and thus we have a few cases
                if (flagAsync) {
                    //Asynchronous setter --> we prefer setTask
                    if (propdef.setTask) {
                        //Real asynchronous setter (task version)
                        //Get setter task function
                        var task = propdef.setTask.call(this, value);

                        //Now we have a task that knows how to set the property value
                        jpvs.runBackgroundTask(task, onSuccess, onProgress, onError);
                    }
                    else if (propdef.set) {
                        //Dummy asynchronous setter (actually it's just synchronous but with the callback)
                        try {
                            propdef.set.call(this, value);
                            if (onSuccess)
                                onSuccess();
                        }
                        catch (e) {
                            if (onError)
                                onError(e);
                        }
                    }
                    else {
                        //Neither set nor setTask --> nothing to set                
                        //Just call the onSuccess callback
                        if (onSuccess)
                            onSuccess();
                    }
                }
                else {
                    //Synchronous setter --> we prefer set
                    if (propdef.set) {
                        //Real synchronous setter, no callbacks
                        propdef.set.call(this, value);
                    }
                    else if (propdef.setTask) {
                        //Synchronous setter but with a task (we launch it as a foreground task)
                        //Get setter task function
                        var task = propdef.setTask.call(this, value);

                        //Now we have a task that knows how to set the property value
                        //No callbacks
                        jpvs.runForegroundTask(task);
                    }
                    else {
                        //Neither set nor setTask --> nothing to set                
                        //No callbacks
                        //NO OPERATION
                    }
                }

                //At the end always return this for chaining
                return this;
            }
        };
    };

    jpvs.currentLocale = (function () {
        var curLoc = "en";

        return jpvs.property({
            get: function () { return curLoc; },
            set: function (value) { curLoc = value; }
        });
    })();

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
        fn.prototype.getMainContentElement = getMainContentElement(widgetDef);

        fn.prototype.id = jpvs.property({
            get: function () { return this.element.attr("id"); },
            set: function (value) { this.element.attr("id", value); }
        });

        fn.prototype.ensureId = function () {
            if (this.id() && this.id() != "")
                return;
            else
                this.id(jpvs.randomString(20));
        };

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

                //The "selector" may also be a jpvs widget. The following line handles this case
                selector = toElement(selector);

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
                if (!selector)
                    return;

                //The "selector" may also be a jpvs widget. The following line handles this case
                selector = toElement(selector);

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
                var execDefault = true;

                if (widgetDef.destroy)
                    execDefault = widgetDef.destroy.call(this, this);

                if (execDefault) {
                    //The default behavior is to remove the element from the DOM.
                    //The default behavior is suppressed
                    this.element.remove();
                }
            };
        }

        function getMainContentElement(widgetDef) {
            return function () {
                //If the widget definition defines a "getMainContentElement" function, let's call it
                if (widgetDef.getMainContentElement)
                    return widgetDef.getMainContentElement.call(this, this);

                //Otherwise, the default behavior: let's return THE "element"
                return this.element;
            };
        }

        function init(W) {
            //Hovering
            W.element.hover(function () {
                W.addState(jpvs.states.HOVER);
            }, function () {
                W.removeState(jpvs.states.HOVER);
            });

            //Focusing
            W.element.focusin(function () {
                W.addState(jpvs.states.FOCUS);
            });

            W.element.focusout(function () {
                W.removeState(jpvs.states.FOCUS);
            });
        }

        function focus(widgetDef) {
            return function () {
                if (widgetDef.focus)
                    widgetDef.focus.call(this, this);
                else
                    this.element.focus();

                return this;
            };
        }

        function addState(wd) {
            return function (state) {
                this.element.addClass("Widget-" + state);
                this.element.addClass(wd.cssClass + "-" + state);

                return this;
            };
        }

        function removeState(wd) {
            return function (state) {
                this.element.removeClass("Widget-" + state);
                this.element.removeClass(wd.cssClass + "-" + state);

                return this;
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

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        if (text) {
            //Handle multiple lines
            text = text.replace("\r", "");
            var lines = text.split("\n");
            if (lines.length == 1)
                $(container).append(document.createTextNode(lines[0]));
            else if (lines.length > 1) {
                $.each(lines, function (i, line) {
                    $(container).append(document.createTextNode(line));
                    $(container).append(document.createElement("br"));
                });
            }
        }
    };

    jpvs.writeln = function (container, text) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        jpvs.write(container, text);
        $(container).append(document.createElement("br"));
    };

    jpvs.writeTag = function (container, tagName, text) {
        if (!container)
            return;
        if (!tagName)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

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

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        /*
        When used with DataGrid, the template might be in the form { isHeader: true, template: .... }
        */
        if (template.template)
            return jpvs.applyTemplate(container, template.template, dataItem);

        /*
        The template might be a string, in which case we just write it
        */
        if (typeof (template) == "string") {
            jpvs.write(container, template);
            return;
        }

        /*
        Or it could be in the form: { fieldName: "ABC", tagName: "TAG", css: {}, selector: function(fieldValue, dataItem) {} }.
        Extract dataItem.ABC and write it as text (optionally in the specified tag name).
        */
        if (template.fieldName) {
            var fieldValue = dataItem && dataItem[template.fieldName];
            if (template.selector)
                fieldValue = template.selector(fieldValue, dataItem);
            else
                fieldValue = fieldValue && fieldValue.toString();

            if (template.tagName)
                jpvs.writeTag(container, template.tagName, fieldValue);
            else
                jpvs.write(container, fieldValue);

            //Apply CSS by means of jQuery.css()
            if (template.css)
                container.css(template.css);

            return;
        }

        /*
        Or it could be a function. Call it with this = container.
        */
        if (typeof (template) == "function")
            return template.call($(container), dataItem);

        /*
        Don't know what to do here.
        */
        jpvs.alert("JPVS Error", "The specified template is not valid.");
    };

    /*
    This function handles extraction of data from various types of data sources and returns data asynchronously to a callback.
    The object passed to the callback is as follows: 
    {
    total: total number of records in the full data set,
    start: offset in the data set of the first record returned in the "data" field,
    count: number of records returned in the "data" field; this is <= total,
    data: array with the returned records
    }

    Parameter "start" is optional. When not specified (null or undefined), 0 is implied.
    Parameter "count" is optional. When not specified (null or undefined), the entire data set is returned.
    Parameter "options" is optional and may contain sorting/filtering options. When not specified, the default sort/filter is intended.
    */
    jpvs.readDataSource = function (data, start, count, options, callback) {
        if (!data) {
            //No data source provided. Return no data.
            returnNoData();
        }
        else if (typeof (data) == "function") {
            //The data source is a function. It might be either synchronous or asynchronous.
            //Let's try to call it and see what comes back. Pass whatever comes back to our internalCallback function.
            var ret = data(start, count, options, internalCallback);

            if (ret === undefined) {
                //No return value. The function is probably asynchronous. The internalCallback will receive the data.
            }
            else if (ret === null) {
                //The function explicitly returned null. Means "no data". Let's return no data.
                returnNoData();
            }
            else {
                //The function explicitly returned something. That's the data we are looking for. Let's pass it to the internal callback
                internalCallback(ret);
            }
        }
        else if (data.length) {
            //"data" is a static collection of records, not a function. We are supposed to return records between start and start+count
            var tot = data.length;
            var sliceStart = Math.max(0, start || 0);
            var dataPortion;
            if (count === undefined || count === null) {
                //Get from start to end
                dataPortion = data.slice(sliceStart);
            }
            else {
                //Get from start to start+count
                var sliceCount = Math.max(0, count || 0);
                var sliceEnd = sliceStart + sliceCount;
                dataPortion = data.slice(sliceStart, sliceEnd);
            }

            callback({
                total: tot,
                start: sliceStart,
                count: dataPortion.length,
                data: dataPortion
            });
        }
        else {
            //"data" is not an array-like object. Let's return no data
            returnNoData();
        }

        function returnNoData() {
            callback({
                total: 0,
                start: 0,
                count: 0,
                data: []
            });
        }

        function internalCallback(val) {
            /*
            "val" is the return value of the "data" function. It might be a plain array or it might be structured as a partial data set.
            */
            if (val.total && val.data) {
                //Return it directly
                callback({
                    total: val.total,
                    start: val.start || 0,
                    count: val.data.length || 0,
                    data: val.data
                });
            }
            else if (val.length) {
                //The function returned an array. We must assume this is the entire data set, since we have no info as to which part it is.
                callback({
                    total: val.length,
                    start: 0,
                    count: val.length,
                    data: val
                });
            }
            else {
                //No data or unknown format
                returnNoData();
            }
        }
    };


    jpvs.showDimScreen = function (delayMilliseconds, fadeInDuration, template) {
        //Schedule creation
        if (jpvs.showDimScreen.timeout)
            return;

        jpvs.showDimScreen.timeout = setTimeout(create, delayMilliseconds != null ? delayMilliseconds : 500);

        function create() {
            jpvs.showDimScreen.timeout = null;

            if (jpvs.showDimScreen.element)
                return;

            //Create a DIV that covers the entire window
            jpvs.showDimScreen.element = jpvs.writeTag("body", "div").addClass("DimScreen").css({
                position: "fixed",
                top: "0px", left: "0px", width: "100%", height: "100%",
                display: "none"
            });

            //If provided, we can use a custom template for filling the DIV
            jpvs.applyTemplate(jpvs.showDimScreen.element, template);

            //Finally, fade in the DIV
            jpvs.showDimScreen.element.fadeIn(fadeInDuration != null ? fadeInDuration : 250);
        }
    };

    jpvs.hideDimScreen = function (fadeOutDuration) {
        //If we are still waiting for the timeout to elapse, simply cancel the timeout
        if (jpvs.showDimScreen.timeout) {
            clearTimeout(jpvs.showDimScreen.timeout);
            jpvs.showDimScreen.timeout = null;
        }

        //If a screen dimmer is present, fade it out and remove it
        if (jpvs.showDimScreen.element) {
            var x = jpvs.showDimScreen.element;
            jpvs.showDimScreen.element = null;
            x.fadeOut(fadeOutDuration != null ? fadeOutDuration : 250, function () { x.remove(); });
        }
    };

    jpvs.fitInWindow = function (element) {
        if (!element)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = toElement(element);

        //Measure the element, relative to the document
        var pos = element.offset();
        var x = pos.left;
        var y = pos.top;
        var w = element.outerWidth();
        var h = element.outerHeight();

        //Measure the window, relative to the document and account for scrolling
        var wnd = $(window);
        var wx = wnd.scrollLeft();
        var wy = wnd.scrollTop();
        var ww = wnd.width();
        var wh = wnd.height();

        //Now move x and y, trying to make sure "element" [valMin, valMax] is entirely visible in the window [min, max]
        var dx = translate(wx, wx + ww, x, x + w);
        var dy = translate(wy, wy + wh, y, y + h);

        if (dx != 0 || dy != 0) {
            var newX = x + dx;
            var newY = y + dy;

            element.show().css({
                position: "absolute",
                left: newX + "px",
                top: newY + "px"
            });
        }

        function translate(min, max, valMin, valMax) {
            if (valMin < min)
                return min - valMin;
            else if (valMax > max)
                return max - valMax;
            else
                return 0;
        }
    };

    jpvs.fixTableHeader = function (element) {
        if (!element)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = toElement(element);

        //Let's find the element's scrolling container (the first ancestor that has overflow: auto/scroll/hidden)
        var scrollingContainer = element;
        while (true) {
            scrollingContainer = scrollingContainer.parent();
            var test = scrollingContainer[0].nodeName;
            if (!scrollingContainer || scrollingContainer.length == 0 || scrollingContainer[0].nodeName.toLowerCase() == "body") {
                //We have just climbed up to the body, so we have no scrolling container (we scroll the window)
                scrollingContainer = null;
                break;
            } else {
                var overflow = scrollingContainer.css("overflow");
                if (overflow == "auto" || overflow == "scroll" || overflow == "hidden") {
                    //We have found it
                    break;
                }
            }
        }

        //Measure all tbody columns
        var colWidths = [];
        element.find("tbody > tr:first").each(function () {
            $(this).children("td").each(function (i, td) {
                colWidths[i] = $(td).width();
            });
        });

        //Set fixed table layout and explicitly set columns widths
        var sumOfAllCols = 0;
        $.each(colWidths, function (i, colWidth) {
            sumOfAllCols += colWidth;
        });

        element.css({
            "table-layout": "fixed",
            "width": sumOfAllCols + "px"
        });

        element.children("colgroup, col").remove();

        var colgroup = jpvs.writeTag(element, "colgroup");
        $.each(colWidths, function (i, colWidth) {
            jpvs.writeTag(colgroup, "col").css("width", colWidth + "px");
        });

        //Split the table into two tables. The first one contains the thead, the second the tbody
        var header = element.clone().attr("id", element.attr("id") + "_header");
        header.insertBefore(element);

        header.children("tbody, tfoot").remove();
        element.children("caption, thead").remove();

        //No margin between the two tables
        header.css("margin-bottom", "0px");
        element.css("margin-top", "0px");

        //Placeholder, for keeping other things in place when we use absolute positioning for the header
        var headerPlaceHolder = jpvs.writeTag(element.parent(), "div");
        headerPlaceHolder.insertBefore(element);

        headerPlaceHolder.css({
            width: sumOfAllCols + "px",
            height: header.outerHeight() + "px"
        });

        //On scroll, decide where to put the header
        var yHeaderRTSC;        //Relative To Scrolling Container (or window)
        var calcX, calcY;       //Functions that calculate (x, y) when we must float the header
        measurePosition();

        (scrollingContainer || $(window)).resize(measurePosition).scroll(refreshHeaderPosition);

        //Let's return an object that allows code manipulation (manual refreshing, for now)
        return {
            refresh: function () {
                //Re-measure and reposition
                measurePosition();
            }
        };


        function measurePosition() {
            //Before measuring, let's reposition the header into its natural location
            setNormal();

            var position = scrollingContainer && scrollingContainer.css("position");
            var absolute = (position == "absolute" || position == "fixed" || position == "relative");

            //From Relative To Offset Parent...
            var xHeaderRTOP = header.position().left;
            var yHeaderRTOP = header.position().top;
            var yScrollingContainerRTOP = scrollingContainer && !absolute && scrollingContainer.position().top || 0;

            //...to Relative To Scrolling Container
            yHeaderRTSC = yHeaderRTOP - yScrollingContainerRTOP;

            //Table margins and border sizes in pixels, so we can subtract them when absolute positioning
            var xDelta = parseFloat(header.css("margin-left")) + parseFloat(header.css("border-left-width"));
            var yDelta = parseFloat(header.css("margin-top")) + parseFloat(header.css("border-top-width"));

            //Functions for applying the floating position
            calcY = function () {
                if (scrollingContainer) {
                    if (absolute)
                        return scrollingContainer.scrollTop() - yDelta;
                    else
                        return yScrollingContainerRTOP - yDelta - parseFloat(scrollingContainer.css("padding-top"));
                }
                else
                    return $(window).scrollTop() - yDelta;
            };

            calcX = function () {
                if (scrollingContainer)
                    return xHeaderRTOP;
                else
                    return xHeaderRTOP;
            };

            //At the end, let's restore the correct positioning based on scroll state
            refreshHeaderPosition();
        }

        function getScrollingContainerScrollState() {
            var $scr = scrollingContainer || $(window);

            return {
                top: $scr.scrollTop(),
                left: $scr.scrollLeft()
            };
        }

        function refreshHeaderPosition() {
            //If the header is scrolling upwards out of the container, then fix the header, otherwise leave it in the
            //original position
            var scroll = getScrollingContainerScrollState();
            if (scroll.top > yHeaderRTSC)
                setFloating();
            else
                setNormal();
        }

        function setNormal() {
            headerPlaceHolder.hide();
            header.css({
                position: "static"
            });
        }

        function setFloating() {
            //Float the header
            headerPlaceHolder.show();
            header.css({
                position: "absolute",
                top: calcY() + "px",
                left: calcX() + "px",
                "z-index": 99999
            });
        }
    };

})();
