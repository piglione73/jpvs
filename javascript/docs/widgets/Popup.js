window.jpvs = window.jpvs || {};


jpvs.Popup = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.close = jpvs.event(this);
};

jpvs.Popup.getTopMost = function () {
    /// <summary>Returns the top-most popup at any given time. Returns null if no popup is currently active.</summary>
    return new jpvs.Popup();
};

jpvs.makeWidget({
    widget: jpvs.Popup,
    type: "Popup",

    prototype: {
        modal: function (value) {
            /// <summary>Property: modal flag (true/false).</summary>
            return this;
        },

        autoHide: function (value) {
            /// <summary>Property: auto-hide flag (true/false). 
            /// If true, when the user clicks outside the popup, the popup is hidden automatically</summary>
            return this;
        },

        autoDestroy: function (value) {
            /// <summary>Property: auto-destroy flag (true/false). 
            /// If true, when the user clicks outside the popup, the popup is destroyed automatically</summary>
            return this;
        },

        position: function (value) {
            /// <summary>Property: specifies how to position the popup when shown. By default, the popup is displayed
            /// centered in the browser viewport. In order to customize the positioning, pass an object like the
            /// following: { my: ..., at: ..., of: ..., collision: ..., position: ... }.
            /// Please see the jQuery UI Position utility for information about "my", "at", "of" and "collision". 
            /// As regards the "position" property, it is applied as a CSS property to the popup. You can pass either "absolute"
            /// or "fixed" depending on how the popup should behave on page scrolling. If "absolute", the popup will scroll together
            /// with the page. If "fixed", the popup will not move when the user scrolls the page.
            /// The default value is: { my: "center", at: "center", of: $(window), collision: "fit", position: "fixed" }, which
            /// means that the popup is centered in the viewport and must not move on page scrolling.</summary>
            return this;
        },

        applyPosition: function (flagAnimate) {
            /// <summary>This function applies the positioning set into the "position" property and makes sure
            /// this popup is not bigger than the viewport. If bigger, it is automatically reduced and scrollbars
            /// are displayed.</summary>
            /// <param name="flagAnimate" type="Boolean">Set to true for animating</param>
            return this;
        },

        show: function (callback) {
            /// <summary>Shows the popup.</summary>
            /// <param name="callback" type="Function">Optional: Function that will be called at the end of the showing animation.</param>
            return this;
        },

        hide: function (callback) {
            /// <summary>Hides the popup.</summary>
            /// <param name="callback" type="Function">Optional: Function that will be called at the end of the hiding animation.</param>
            return this;
        },

        center: function () {
            /// <summary>Centers the popup in the browser window.</summary>
            return this;
        },

        bringForward: function () {
            /// <summary>Brings the popup on top.</summary>
            return this;
        },

        title: function (value) {
            /// <summary>Property: title of the popup. If false or null or empty, no title bar is displayed.</summary>
            return this;
        },

        width: function (value) {
            /// <summary>Property: width of the popup in CSS units (e.g.: 400px or 30em).</summary>
            return this;
        },

        maxWidth: function (value) {
            /// <summary>Property: maximum width of the popup in CSS units (e.g.: 400px or 30em).</summary>
            return this;
        },

        zIndex: function (value) {
            /// <summary>Property: z-index of the popup.</summary>
            return this;
        }
    }
});



jpvs.alert = function (title, text, onclose, buttons) {
    /// <summary>Displays an alert popup with a title, a text, an on-close action, and one or more buttons.</summary>
    /// <param name="title" type="String">Optional: Title of the popup.</param>
    /// <param name="text" type="String">Text of the popup.</param>
    /// <param name="onclose" type="Function">Optional: Function that will be called when the popup is closed or jpvs widget to be focused when the popup is closed or jQuery selector of control to be focused when the popup is closed.</param>
    /// <param name="buttons" type="Array">Optional: Array of button definitions. A button definition is like this: { text: "OK", click: eventHandler }. The jpvs.writeButtonBar is used; see it for additional info.</param>
};


jpvs.confirm = function (title, text, onYes, onNo, textYes, textNo) {
    /// <summary>Displays a confirmation popup with two customizable Yes/No buttons.</summary>
    /// <param name="title" type="String">Title of the popup.</param>
    /// <param name="text" type="String">Text of the popup.</param>
    /// <param name="onYes" type="Function">Optional: Function that will be called if the user clicks the Yes button.</param>
    /// <param name="onNo" type="Function">Optional: Function that will be called if the user clicks the No button.</param>
    /// <param name="textYes" type="String">Optional: Text of the Yes button (default = "OK").</param>
    /// <param name="textNo" type="String">Optional: Text of the No button (default = "Cancel").</param>
};
