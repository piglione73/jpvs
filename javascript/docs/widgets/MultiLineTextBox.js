window.jpvs = window.jpvs || {};

jpvs.MultiLineTextBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiLineTextBox,
    type: "MultiLineTextBox",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the multi-line textbox.</summary>
            return this;
        }
    }
});


