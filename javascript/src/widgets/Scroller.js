/* JPVS
Module: widgets
Classes: Scroller
Depends: core
*/

(function () {

    jpvs.Scroller = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.makeWidget({
        widget: jpvs.Scroller,
        type: "Scroller",
        cssClass: "Scroller",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            /* Create a DIV with a bigger DIV inside, so as to display scrollbars. */
            W.scroller = $(document.createElement("div"));
            W.scrollerContent = $(document.createElement("div"));

            W.element.append(W.scroller).css({ position: "relative" });
            W.scroller.append(W.scrollerContent);

            W.scroller.css({ position: "absolute", left: "0px", top: "0px", overflow: "scroll" });

            //Measure scrollbars
            W.scrollerContent.width("100%").height("100%");
            W.scrollbarW = W.scroller.innerWidth() - W.scrollerContent.innerWidth();
            W.scrollbarH = W.scrollbarW;

            //Refresh
            refreshScroller(W);

            //Events
            W.scroller.scroll(onScroll(W));
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            objectSize: jpvs.property({
                get: function () {
                    return {
                        width: this.element.width(),
                        height: this.element.height()
                    };
                },
                set: function (value) {
                    W.element.width(value.width).height(value.height);
                    refreshScroller(this);
                }
            }),

            visibleSize: jpvs.property({
                get: function () {
                    return this.element.data("visibleSize") || { width: "50", height: "40" };
                },
                set: function (value) {
                    this.element.data("visibleSize", value);
                    refreshScroller(this);
                }
            }),

            totalSize: jpvs.property({
                get: function () {
                    return this.element.data("totalSize") || { width: "500", height: "400" };
                },
                set: function (value) {
                    this.element.data("totalSize", value);
                    refreshScroller(this);
                }
            }),

            scrollPosition: jpvs.property({
                get: function () {
                    var st = this.scroller.scrollTop();
                    var sl = this.scroller.scrollLeft();

                    var os = this.objectSize();
                    var vs = this.visibleSize();
                    var ts = this.totalSize();

                    var maxST = (ts.height / vs.height - 1) * os.height;
                    var maxSL = ts.width / vs.width * os.width - os.width - this.scrollbarW;

                    return {
                        top: st / maxST * ts.height,
                        left: sl / maxSL * ts.width
                    };
                }
            })
        }
    });


    function refreshScroller(W) {
        //Set scroller's size equal to widget's size
        var size = W.objectSize();
        //size.width += W.scrollbarW;
        size.height += W.scrollbarH;
        W.scroller.css(size);

        //Set scrollbars, as needed
        var vs = W.visibleSize();
        var ts = W.totalSize();
        var ratioX = ts.width / vs.width * 100 + "%";
        var ratioY = ts.height / vs.height * 100 + "%";
        W.scrollerContent.css({ width: ratioX, height: ratioY });
    }

    function onScroll(W) {
        return function () {
            W.change.fire(W);
        };
    }

})();
