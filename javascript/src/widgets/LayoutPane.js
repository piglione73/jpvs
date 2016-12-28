(function () {

    //On browser resize, we relayout everything
    $(window).on("resize", refresh);

    //On drag, handle resizing as appropriate
    $(document).on("mousedown", onStartDrag);
    $(document).on("mousemove", onContinueDrag);
    $(document).on("mouseup", onEndDrag);
    jpvs.addGestureListener(document, {
        allowedEventTargets: function (target) {
            return $(target).is(".LayoutPane-Resizer");
        }
    }, onTouch);

    jpvs.LayoutPane = function (selector) {
        this.attach(selector);
    };

    //Static function for refreshing the entire layout
    jpvs.LayoutPane.refresh = refresh;

    jpvs.makeWidget({
        widget: jpvs.LayoutPane,
        type: "LayoutPane",
        cssClass: "LayoutPane",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            refresh();
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            anchor: jpvs.property({
                get: function () {
                    return (this.element.data("anchor") || "fill").toLowerCase();
                },
                set: function (value) { this.element.data("anchor", value); refresh(); }
            }),

            size: jpvs.property({
                get: function () {
                    return (this.element.data("size") || "auto").toLowerCase();
                },
                set: function (value) { this.element.data("size", value); refresh(); }
            }),

            resizable: jpvs.property({
                get: function () {
                    var x = this.element.data("resizable");
                    return x == true || x == "true";
                },
                set: function (value) { this.element.data("resizable", value); refresh(); }
            }),

            addClass: function (className) {
                this.element.addClass(className);
                return this;
            },

            originalSizePx: function () {
                var anchor = this.anchor();
                if (anchor == "left" || anchor == "right")
                    return this.element.outerWidth();
                else if (anchor == "top" || anchor == "bottom")
                    return this.element.outerHeight();
                else
                    return undefined;
            }
        }
    });

    function refresh() {
        //Remove all resizers (we recreate them at the correct updated positions)
        $("div.LayoutPane-Resizer").remove();

        //We must relayout the entire hierarchy of LayoutPane's starting from the roots
        var roots = getRoots();

        //Relayout recursively
        var ctx = {
            x1: 0, x2: 0, y1: 0, y2: 0,
            panes: roots
        };

        relayout(ctx);
    }

    function getRoots() {
        var x = $("div.LayoutPane").first();
        while (getLayoutPane(x)) {
            //Go up one level
            x = x.parent();
        }

        //Now x is the first non-LayoutPane that contains at least one LayoutPane
        //The "roots" are all the LayoutPane's contained in x
        return getLayoutPanes(x);
    }

    function getLayoutPanes(element) {
        //Get all the LayoutPane's contained in element
        var panes = [];
        element.children("div.LayoutPane").each(function () {
            var pane = getLayoutPane($(this));
            if (pane)
                panes.push(pane);
        });

        return panes;
    }

    function getLayoutPane(element) {
        //If element is a LayoutPane, then return the corresponding widget. Otherwise return null.
        var widget = jpvs.find(element);
        if (widget && widget.toString() == "LayoutPane")
            return widget;
        else
            return null;
    }

    function relayout(ctx) {
        //Assign space to all panes one at a time
        for (var i in ctx.panes) {
            var pane = ctx.panes[i];
            var anchor = (pane.anchor() || "fill").toLowerCase();
            var size = (pane.size() || "auto").toLowerCase();
            var resizable = pane.resizable();
            var childPanes = getLayoutPanes(pane.element);

            allocate(pane.element, anchor, size, childPanes);

            //Then, if the pane is anchored and requires to be resizable, let's allocate a second special thin pane that
            //acts as the border/handle for resizing
            if (resizable) {
                var resizer = jpvs.writeTag("body", "div");
                resizer.data("LayoutPane", pane);

                if (anchor == "left" || anchor == "right") {
                    allocate(resizer, anchor, "10px", []);
                    resizer.addClass("LayoutPane-Resizer LayoutPane-VerticalResizer");
                }
                else if (anchor == "top" || anchor == "bottom") {
                    allocate(resizer, anchor, "10px", []);
                    resizer.addClass("LayoutPane-Resizer LayoutPane-HorizontalResizer");
                }

                //No scrollbars on the resizer
                resizer.css("overflow", "hidden");
            }
        }

        //Depending on the anchor setting, allocate the pane on the screen
        function allocate(paneElement, anchor, size, childPanes) {
            //We have some reasonable constraints for ease of implementation
            if (childPanes.length > 0 && anchor != "fill" && size == "auto") {
                //If we have child LayoutPane's, then we don't support "auto" size
                paneElement.empty().text("Error: since nested LayoutPane's are present, the combination " + anchor + "/" + size + " is not supported. Please set an explicit size for this LayoutPane.");
                return;
            }

            //Checks OK. Allocate the pane on the screen.
            paneElement.css({
                position: "fixed",
                overflow: "auto"
            });

            if (anchor == "top") {
                //Anchor to the top, eating space from ctx.y1
                paneElement.css({
                    left: ctx.x1 + "px",
                    right: ctx.x2 + "px",
                    top: ctx.y1 + "px",
                    bottom: "auto",
                    height: size
                });

                var usedHeight = paneElement.outerHeight();

                //Layout nested panes, if present
                relayout({
                    panes: childPanes,
                    x1: ctx.x1,
                    x2: ctx.x2,
                    y1: ctx.y1,
                    y2: $(window).height() - (ctx.y1 + usedHeight)
                });

                //Mark the space as used
                ctx.y1 += usedHeight;
            }
            else if (anchor == "bottom") {
                //Anchor to the bottom, eating space from ctx.y2
                paneElement.css({
                    left: ctx.x1 + "px",
                    right: ctx.x2 + "px",
                    top: "auto",
                    bottom: ctx.y2 + "px",
                    height: size
                });

                var usedHeight = paneElement.outerHeight();

                //Layout nested panes, if present
                relayout({
                    panes: childPanes,
                    x1: ctx.x1,
                    x2: ctx.x2,
                    y1: $(window).height() - (ctx.y2 + usedHeight),
                    y2: ctx.y2
                });

                //Mark the space as used
                ctx.y2 += usedHeight;
            }
            else if (anchor == "left") {
                //Anchor to the left, eating space from ctx.x1
                paneElement.css({
                    left: ctx.x1 + "px",
                    right: "auto",
                    top: ctx.y1 + "px",
                    bottom: ctx.y2 + "px",
                    width: size
                });

                var usedWidth = paneElement.outerWidth();

                //Layout nested panes, if present
                relayout({
                    panes: childPanes,
                    x1: ctx.x1,
                    x2: $(window).width() - (ctx.x1 + usedWidth),
                    y1: ctx.y1,
                    y2: ctx.y2
                });

                //Mark the space as used
                ctx.x1 += usedWidth;
            }
            else if (anchor == "right") {
                //Anchor to the right, eating space from ctx.x2
                paneElement.css({
                    top: "auto",
                    right: ctx.x2 + "px",
                    top: ctx.y1 + "px",
                    bottom: ctx.y2 + "px",
                    width: size
                });

                var usedWidth = paneElement.outerWidth();

                //Layout nested panes, if present
                relayout({
                    panes: childPanes,
                    x1: $(window).width() - (ctx.x2 + usedWidth),
                    x2: ctx.x2,
                    y1: ctx.y1,
                    y2: ctx.y2
                });

                //Mark the space as used
                ctx.x2 += usedWidth;
            }
            else if (anchor == "fill") {
                //Fill the remaining space
                paneElement.css({
                    left: ctx.x1 + "px",
                    right: ctx.x2 + "px",
                    top: ctx.y1 + "px",
                    bottom: ctx.y2 + "px"
                });

                //Layout nested panes, if present
                relayout({
                    panes: childPanes,
                    x1: ctx.x1,
                    x2: ctx.x2,
                    y1: ctx.y1,
                    y2: ctx.y2
                });
            }
            else {
                //If invalid, let's show the error
                paneElement.empty().text("Invalid anchor for LayoutPane: " + anchor);
            }
        }
    }

    var dragCtx = {};

    function onStartDrag(e) {
        if ($(e.target).is(".LayoutPane-Resizer")) {
            //Mouse down on a LayoutPane Resizer --> start dragging
            startDragging(e.clientX, e.clientY, e.target);
            return false;
        }
    }

    function startDragging(clientX, clientY, target) {
        dragCtx.dragging = true;
        dragCtx.x0 = clientX;
        dragCtx.y0 = clientY;
        dragCtx.pane = $(target).data("LayoutPane");
        dragCtx.resizer = $(target);
        dragCtx.originalSizePx = dragCtx.pane.originalSizePx();
        dragCtx.originalResizerPosition = $(target).offset();
    }

    function onContinueDrag(e) {
        if (dragCtx.dragging) {
            //Dragging in progress --> let's move the resizer following the mouse pointer
            continueDragging(e.clientX, e.clientY);
            return false;
        }
    }

    function continueDragging(clientX, clientY) {
        var anchor = dragCtx.pane && dragCtx.pane.anchor();
        if (anchor == "left" || anchor == "right") {
            //Move the X
            var delta = clientX - dragCtx.x0;
            var newX = dragCtx.originalResizerPosition.left + delta;
            $(dragCtx.resizer).css("left", newX + "px");
        }
        else if (anchor == "top" || anchor == "bottom") {
            //Move the Y
            var delta = clientY - dragCtx.y0;
            var newY = dragCtx.originalResizerPosition.top + delta;
            $(dragCtx.resizer).css("top", newY + "px");
        }
    }

    function onEndDrag(e) {
        if (dragCtx.dragging) {
            //Dragging in progress --> let's end the dragging operation
            endDragging(e.clientX, e.clientY);
            return false;
        }
    }

    function endDragging(clientX, clientY) {
        dragCtx.dragging = false;

        var anchor = dragCtx.pane && dragCtx.pane.anchor();
        if (anchor == "left") {
            //Increase size
            var delta = clientX - dragCtx.x0;
            dragCtx.pane.size((dragCtx.originalSizePx + delta) + "px");
        }
        else if (anchor == "right") {
            //Decrease size
            var delta = clientX - dragCtx.x0;
            dragCtx.pane.size((dragCtx.originalSizePx - delta) + "px");
        }
        else if (anchor == "top") {
            //Increase size
            var delta = clientY - dragCtx.y0;
            dragCtx.pane.size((dragCtx.originalSizePx + delta) + "px");
        }
        else if (anchor == "bottom") {
            //Decrease size
            var delta = clientY - dragCtx.y0;
            dragCtx.pane.size((dragCtx.originalSizePx - delta) + "px");
        }

        //Refresh all with the new sizes
        refresh();
    }

    function onTouch(e) {
        if (e.isDrag && !dragCtx.dragging && $(e.target).is(".LayoutPane-Resizer")) {
            //Start dragging
            startDragging(e.start.clientX, e.start.clientY, e.target);
        }
        else if (e.isDrag && dragCtx.dragging) {
            //Continue dragging
            continueDragging(e.current.clientX, e.current.clientY);
        }
        else if (e.isEndDrag && dragCtx.dragging) {
            //End dragging
            endDragging(e.current.clientX, e.current.clientY);
        }
    }

})();
