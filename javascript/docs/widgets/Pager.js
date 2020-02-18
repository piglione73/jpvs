window.jpvs = window.jpvs || {};


jpvs.Pager = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Pager,
    type: "Pager",

    prototype: {
        page: function (value) {
            /// <summary>Property: current page index.</summary>
            return this;
        },

        totalPages: function (value) {
            /// <summary>Property: total number of pages. If set to null, that means the total number of pages is unknown.</summary>
            return this;
        }
    }
});
