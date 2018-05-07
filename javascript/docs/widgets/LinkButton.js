window.jpvs = window.jpvs || {};

jpvs.LinkButton = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.LinkButton,
    type: "LinkButton",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the link button.</summary>
            return this;
        },

        enabled: function (value) {
            /// <summary>Property: true if enabled (default). If disabled, the LinkButton-Disabled class is added.</summary>
            return this;
        }
    }
});

