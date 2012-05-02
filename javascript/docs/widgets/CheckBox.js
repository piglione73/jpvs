window.jpvs = window.jpvs || {};

jpvs.CheckBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    
    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.CheckBox,
    type: "CheckBox",

    prototype: {
        checked: function (value) {
            /// <summary>Property: true if checked.</summary>
            return this;
        },

        text: function (value) {
            /// <summary>Property: checkbox label.</summary>
            return this;
        }
    }
});


