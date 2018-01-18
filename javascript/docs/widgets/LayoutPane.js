window.jpvs = window.jpvs || {};

jpvs.LayoutPane = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.LayoutPane.refresh = function () {
    /// <summary>Static function for refreshing the entire hierarchy of LayoutPane's.</summary>
};

jpvs.makeWidget({
    widget: jpvs.LayoutPane,
    type: "LayoutPane",

    prototype: {
        anchor: function (value) {
            /// <summary>
            /// Property: specifies where the LayoutPane will be placed. Possible values are:
            ///    - "top": the pane will be anchored to the top edge of the available space
            ///    - "bottom": the pane will be anchored to the bottom edge of the available space
            ///    - "left": the pane will be anchored to the left edge of the available space
            ///    - "right": the pane will be anchored to the right edge of the available space
            ///    - "fill" (default): the pane will fill all the remaining space
            ///
            /// This property may also be specified in HTML by setting the "data-anchor" attribute.
            /// </summary>
            return this;
        },

        size: function (value) {
            /// <summary>
            /// Property: specifies the size of the LayoutPane.
            /// For top-anchored and bottom-anchored panes, the size is the height.
            /// For left-anchored and right-anchored panes, the size is the width.
            /// If the anchor type is "fill", this property is ignored.
            ///
            /// The size may be expressed in CSS units (e.g.: "200px", "10em"). The default value is "auto", which means that
            /// the pane's size will be determined based on its content. However, if the pane contains nested LayoutPanes, 
            /// the "auto" size setting is forbidden.
            ///
            /// This property may also be specified in HTML by setting the "data-size" attribute.
            /// </summary>
            return this;
        },

        resizable: function (value) {
            /// <summary>
            /// Property: specifies whether the LayoutPane may be resized by the user.
            /// If the anchor type is "fill", this property is ignored. Only left/right/top/bottom panes can be resized.
            ///
            /// This property may also be specified in HTML by setting the "data-resizable" attribute.
            /// </summary>
            return this;
        },

        scrollable: function (value) {
            /// <summary>
            /// Property: specifies whether the LayoutPane may be scrolled by the user.
            /// This property may also be specified in HTML by setting the "data-scrollable" attribute.
            /// Default is true.
            /// </summary>
            return this;
        },

        addClass: function (className) {
            /// <summary>Adds a CSS class to the LayoutPane. Adding a CSS class allows the appearance of the LayoutPane to be
            /// customized with borders, background, ...</summary>
            /// <param name="className" type="String">Name of the CSS class to add (or multiple names separated by a space).</param>
            return this;
        },

        actualSizePx: function () {
            /// <summary>
            /// For top/bottom/left/right panes, returns the current/actual size in pixels.
            /// For panes whose anchor property is "fill" returns undefined.
            /// </summary>
            return 100;
        }
    }
});
