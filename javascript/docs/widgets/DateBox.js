window.jpvs = window.jpvs || {};

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
        },

        dateString: function (value) {
            /// <summary>Property: date of the datebox as a string in the YYYYMMDD format.</summary>
            return this;
        },

        dateStringISO: function (value) {
            /// <summary>Property: date of the datebox as a string in the ISO YYYY-MM-DDT00:00:00.000 format.</summary>
            return this;
        }

    }
});


