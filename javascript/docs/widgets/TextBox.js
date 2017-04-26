window.jpvs = window.jpvs || {};

jpvs.TextBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
    this.lazychange = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.TextBox,
    type: "TextBox",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the textbox.</summary>
            return this;
        },

        width: function (value) {
            /// <summary>Property: width in CSS units (e.g.: 200px or 25em).</summary>
            return this;
        },

        autocomplete: function (autoCompleteItems) {
            /// <summary>Turns on or off the autocomplete feature of the TextBox.</summary>
            /// <param name="autoCompleteItems" type="Object">Pass null or false to disable the autocomplete feature. Pass an array of strings to enable it.</param>
        }
    }
});


