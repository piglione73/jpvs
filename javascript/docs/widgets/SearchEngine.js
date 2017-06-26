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

        applyAdditionalFieldsTemplate: function (template) {
            /// <summary>Allows writing additional search fields below the search string textbox.</summary>
            /// <param name="template" type="Object">Template that will be passed to jpvs.applyTemplate for writing the additional
            /// fields. The data item that will be passed to the jpvs.applyTemplate is this SearchEngine widget.
            /// It is the template's responsibility to call the refresh function whenever the search results must be updated.</param>
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

