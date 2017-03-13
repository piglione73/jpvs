window.jpvs = window.jpvs || {};

jpvs.SearchEngine = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.SearchEngine,
    type: "SearchEngine",

    prototype: {
        label: function (value) {
            /// <summary>Property: label displayed on top of the search string textbox.</summary>
            return this;
        },

        searchFunction: function (value) {
            /// <summary>Property: function that this widget uses for searching whenever the user enters text into
            /// the textbox. The function must be declared as: function(text, callback) {} and must search for the
            /// given text. At the end, it must call callback(searchResults) where "searchResults" is the array of items
            /// to be displayed.</summary>
            return this;
        },

        gridTemplate: function (value) {
            /// <summary>Property: template used for the jpvs.DataGrid that displays the results. Please see the
            /// documentation of jpvs.DataGrid for information on the "template" property.</summary>
            return this;
        },

        pageSize: function (value) {
            /// <summary>Property: page size for grid pagination. If null, no pagination is applied. Otherwise, a pager is
            /// displayed on top of the DataGrid.</summary>
            return this;
        },

        refresh: function () {
            /// <summary>Causes the search results to be refreshed immediately, rather than wait for the user to enter text.</summary>
            return this;
        }
    }
});

