﻿window.jpvs = window.jpvs || {};

jpvs.DateBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DateBox,
    type: "DateBox",

    prototype: {
        date: function (value) {
            /// <summary>Property: date of the datebox.</summary>
            return this;
        }
    }
});

