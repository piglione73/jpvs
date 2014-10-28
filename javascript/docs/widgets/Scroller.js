window.jpvs = window.jpvs || {};


jpvs.Scroller = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Scroller,
    type: "Scroller",

    prototype: {
        objectSize: function (value) {
            /// <summary>Property: total object size { width: CSS units, height: CSS units }. This is the visible size of the widget, which looks like a box with scrollbars inside.</summary>
            return this;
        },

        scrollableSize: function (value) {
            /// <summary>Property: size of the scrollable area ({ width: CSS units, height: CSS units }). The scrollable area is used only for sizing the scrollbars. It is assumed that this area is the total area that will be scrolled inside the object's visible viewport (the object size property).</summary>
            return this;
        },

        contentSize: function (value) {
            /// <summary>Property: size of the content area ({ width: CSS units, height: CSS units }). It may be different from the scrollable size because the jpvs Scroller decouples the amount of scrolling set by the scrollbars from the actual amount of scrolling of the contents.</summary>
            return this;
        },

        scrollPosition: function (value) {
            /// <summary>Property: scroll position as specified by the scrollbars ({ top: pixels, left: pixels }). Setting this property only affects the scrollbars, not the content.</summary>
            return this;
        },

        contentPosition: function (value) {
            /// <summary>Property: content position ({ top: pixels, left: pixels }). Setting this property only affects the content, not the scrollbars.</summary>
            return this;
        }
    }
});
