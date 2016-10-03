window.jpvs = window.jpvs || {};

jpvs.Scheduler = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Scheduler,
    type: "Scheduler",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the textbox.</summary>
            return this;
        },

        width: function (value) {
            /// <summary>Property: width in CSS units (e.g.: 200px or 25em).</summary>
            return this;
        }
    }
});


