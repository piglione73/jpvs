(function () {

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
            refresh(W);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            anchor: jpvs.property({
                get: function () { return this.element.data("anchor"); },
                set: function (value) { this.element.data("anchor", value); refresh(this); }
            }),

            size: jpvs.property({
                get: function () { return this.element.data("size"); },
                set: function (value) { this.element.data("size", value); refresh(this); }
            }),

            resizable: jpvs.property({
                get: function () {
                    var x = this.element.data("resizable");
                    return x == true || x == "true";
                },
                set: function (value) { this.element.data("resizable", value); refresh(this); }
            })
        }
    });

    function refresh(W) {
        //We must relayout the entire hierarchy of LayoutPane's starting from the roots
        var roots = getRoots(W);

        //Relayout recursively
        var ctx = {
            x1: 0, x2: 0, y1: 0, y2: 0,
            panes: roots
        };

        relayout(ctx);
    }

    function getRoots(W) {
        var x = W.element;
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
        element.children("div").each(function () {
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

        function allocate(pane) {
            //Depending on the anchor setting, allocate the pane on the screen
            var anchor = (pane.anchor() || "fill").toLowerCase();
            var size = pane.size();

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

                ctx.y1 += pane.element.height();
            }
            else if (anchor == "bottom") {
                //Anchor to the bottom, eating space from ctx.y2
                pane.element.css({
                    left: ctx.x1 + "px",
                    right: ctx.x2 + "px",
                    bottom: ctx.y2 + "px",
                    height: size
                });

                ctx.y2 += pane.element.height();
            }
            else if (anchor == "left") {
                //Anchor to the left, eating space from ctx.x1
                pane.element.css({
                    left: ctx.x1 + "px",
                    top: ctx.y1 + "px",
                    bottom: ctx.y2 + "px",
                    width: size
                });

                ctx.x1 += pane.element.width();
            }
            else if (anchor == "right") {
                //Anchor to the right, eating space from ctx.x2
                pane.element.css({
                    right: ctx.x2 + "px",
                    top: ctx.y1 + "px",
                    bottom: ctx.y2 + "px",
                    width: size
                });

                ctx.x2 += pane.element.width();
            }
            else if (anchor == "fill") {
                //Fill the remaining space
                pane.element.css({
                    left: ctx.x1 + "px",
                    right: ctx.x2 + "px",
                    top: ctx.y1 + "px",
                    bottom: ctx.y2 + "px"
                });
            }
            else {
                //If invalid, let's show the error
                pane.element.empty().text("Invalid anchor for LayoutPane: " + anchor);
            }
        }
    }

})();
