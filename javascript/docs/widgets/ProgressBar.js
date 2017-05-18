window.jpvs = window.jpvs || {};

jpvs.ProgressBar = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.ProgressBar,
    type: "ProgressBar",

    prototype: {
        width: function (value) {
            /// <summary>Property: width in CSS units (e.g.: 100px or 20em); may be null, which means the CSS class width, if any, is applied.</summary>
            return this;
        },

        progress: function (value) {
            /// <summary>Property: progress percentage (number between 0 and 100, inclusive). Default: 50.</summary>
            return this;
        },

        text: function (value) {
            /// <summary>Property: text to write inside the progress bar; may be null, which means no text is displayed.</summary>
            return this;
        },

        color: function (value) {
            /// <summary>Property: progress bar color; may be null, which means the CSS class color, if any, is applied.</summary>
            return this;
        }
    }
});

