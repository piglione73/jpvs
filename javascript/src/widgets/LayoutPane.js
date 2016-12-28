(function () {

    //On browser resize, we relayout everything
    $(window).on("resize", refresh);


    jpvs.LayoutPane = function (selector) {
        this.attach(selector);
    };

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
                get: function () { return this.element.data("anchor"); },
                set: function (value) { this.element.data("anchor", value); refresh(); }
            }),

            size: jpvs.property({
                get: function () { return this.element.data("size"); },
                set: function (value) { this.element.data("size", value); refresh(); }
            }),

            resizable: jpvs.property({
                get: function () {
                    var x = this.element.data("resizable");
                    return x == true || x == "true";
                },
                set: function (value) { this.element.data("resizable", value); refresh(); }
            })
        }
    });

    function refresh() {
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
            allocate(pane);
        }

        //Depending on the anchor setting, allocate the pane on the screen
        function allocate(pane) {
            var anchor = (pane.anchor() || "fill").toLowerCase();
            var size = (pane.size() || "auto").toLowerCase();
            var resizable = pane.resizable();
            var childPanes = getLayoutPanes(pane.element);

            //We have some reasonable constraints for ease of implementation
            if (childPanes.length > 0 && anchor != "fill" && size == "auto") {
                //If we have child LayoutPane's, then we don't support "auto" size
                pane.element.empty().text("Error: since nested LayoutPane's are present, the combination " + anchor + "/" + size + " is not supported. Please set an explicit size for this LayoutPane.");
                return;
            }

            //Checks OK. Allocate the pane on the screen.
            pane.element.css({
                position: "fixed",
                overflow: "auto"
            });

            if (anchor == "top") {
                //Anchor to the top, eating space from ctx.y1
                pane.element.css({
                    left: ctx.x1 + "px",
                    right: ctx.x2 + "px",
                    top: ctx.y1 + "px",
                    height: size
                });

                var usedHeight = pane.element.outerHeight();

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
                pane.element.css({
                    left: ctx.x1 + "px",
                    right: ctx.x2 + "px",
                    bottom: ctx.y2 + "px",
                    height: size
                });

                var usedHeight = pane.element.outerHeight();

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
                pane.element.css({
                    left: ctx.x1 + "px",
                    top: ctx.y1 + "px",
                    bottom: ctx.y2 + "px",
                    width: size
                });

                var usedWidth = pane.element.outerWidth();

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
                pane.element.css({
                    right: ctx.x2 + "px",
                    top: ctx.y1 + "px",
                    bottom: ctx.y2 + "px",
                    width: size
                });

                var usedWidth = pane.element.outerWidth();

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
                pane.element.css({
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
                pane.element.empty().text("Invalid anchor for LayoutPane: " + anchor);
            }
        }
    }

})();
