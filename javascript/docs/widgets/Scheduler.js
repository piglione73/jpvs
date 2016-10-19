window.jpvs = window.jpvs || {};

jpvs.Scheduler = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.Scheduler,
    type: "Scheduler",

    prototype: {
        readDataFunction: function (value) {
            /// <summary>
            /// Property: get/set current function responsible for loading the data items to display.
            /// The function must have the following signature: function(start, to, callback) {}.
            /// The two "start" and "to" parameters are dates in the YYYYMMDD format. The function must call the callback passing
            /// an array of data items satisfying the passed date range criterion. Each item, at a minimum, must have four string properties:
            /// - dateFrom and dateTo (YYYYMMDD)
            /// - timeFrom and timeTo (HHmm)
            /// </summary>
            return this;
        },

        mode: function (value) {
            /// <summary>Property: get/set current display mode (one of the following strings: "day", "week", "month", "agenda").</summary>
            return this;
        },

        date: function (value) {
            /// <summary>Property: get/set the current date in YYYYMMDD format.</summary>
            return this;
        },

        refresh: function () {
            /// <summary>Reloads fresh data into the widget.</summary>
            return this;
        },

        dayItemTemplate: function (value) {
            /// <summary>Property: get/set the current template used for data items when the mode is "day".</summary>
            return this;
        },

        weekItemTemplate: function (value) {
            /// <summary>Property: get/set the current template used for data items when the mode is "week".</summary>
            return this;
        },

        monthItemTemplate: function (value) {
            /// <summary>Property: get/set the current template used for data items when the mode is "month".</summary>
            return this;
        },

        agendaItemTemplate: function (value) {
            /// <summary>Property: get/set the current template used for data items when the mode is "agenda".</summary>
            return this;
        }

    }
});


