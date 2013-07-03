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
            //Park the size
            var parkedSize = {
                width: W.element.width(),
                height: W.element.height()
            };

            //Make the div a container for scrolling
            W.element.css({ position: "relative", width: "200px", height: "200px" });

            //Park the content for later inclusion in the appropriate DIV
            var parkedContent = W.element.contents();

            //Create a scroller box DIV with overflow auto, same size as the widget
            W.scrollerBox = jpvs.writeTag(W.element, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "scroll"
            });

            //Inside the scroller box, create a DIV that is used as a sizer for the scrollbars of the scroller box
            W.scrollerSizer = jpvs.writeTag(W.scrollerBox, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Create a content box DIV with overflow hidden, same size as the widget, overlapping the scroller box
            //Later, we reduce width and height so as to leave the scrollerBox's scrollbars uncovered
            W.contentBox = jpvs.writeTag(W.element, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Inside the content box, create a content DIV that will hold the actual content
            W.content = jpvs.writeTag(W.contentBox, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Measure scrollbars
            W.scrollbarW = scrollbarWidth();
            W.scrollbarH = W.scrollbarW;

            //Then reduce the content size, so the scrollbars are not covered by the content
            var width = W.element.innerWidth() - W.scrollbarW;
            var height = W.element.innerHeight() - W.scrollbarH;
            W.contentBox.css({
                width: width + "px", height: height + "px"
            });

            //Events
            W.scrollerBox.scroll(onScroll(W));

            //Finally, copy the content into the "content" DIV and set sizes
            if (parkedContent.length) {
                W.content.append(parkedContent);
                parkedSize.height += W.scrollbarH;
                parkedSize.width += W.scrollbarW;
                W.scrollableSize(parkedSize).contentSize(parkedSize);
            }
        },

        canAttachTo: function (obj) {
            return false;
        },

        getMainContentElement: function () {
            return this.content;
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
                    this.element.width(value.width).height(value.height);
                }
            }),

            scrollableSize: jpvs.property({
                get: function () {
                    return {
                        width: this.scrollerSizer.width(),
                        height: this.scrollerSizer.height()
                    };
                },
                set: function (value) {
                    this.scrollerSizer.width(value.width).height(value.height);
                }
            }),

            contentSize: jpvs.property({
                get: function () {
                    return {
                        width: this.content.width(),
                        height: this.content.height()
                    };
                },
                set: function (value) {
                    this.content.width(value.width).height(value.height);
                }
            }),

            scrollPosition: jpvs.property({
                get: function () {
                    var st = this.scrollerBox.scrollTop();
                    var sl = this.scrollerBox.scrollLeft();

                    return { top: st, left: sl };
                },
                set: function (value) {
                    this.scrollerBox.scrollTop(value.top).scrollLeft(value.left);
                }
            }),

            contentPosition: jpvs.property({
                get: function () {
                    var st = this.contentBox.scrollTop();
                    var sl = this.contentBox.scrollLeft();

                    return { top: st, left: sl };
                },
                set: function (value) {
                    this.contentBox.scrollTop(value.top).scrollLeft(value.left);
                }
            })
        }
    });


    function onScroll(W) {
        return function () {
            W.change.fire(W);
        };
    }

    function scrollbarWidth() {
        var $inner = $('<div style="width: 100%; height:200px;">test</div>');
        var $outer = $('<div style="width:200px;height:150px; position: absolute; top: 0px; left: 0px; visibility: hidden; overflow:hidden;"></div>').append($inner);
        var inner = $inner[0];
        var outer = $outer[0];

        $('body').append(outer);
        var width1 = inner.offsetWidth;
        $outer.css('overflow', 'scroll');
        var width2 = outer.clientWidth;
        $outer.remove();

        return (width1 - width2);
    }

})();
