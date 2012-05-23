window.jpvs = window.jpvs || {};


jpvs.DataGrid = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.dataItemClick = jpvs.event(this);
    this.changedSortFilter = jpvs.event(this);
};


jpvs.DataGrid.getFilteringOperands = function () {
    /// <summary>Returns the list of combobox items for the operand combobox in the filtering options popup.</summary>
    return [];
};


jpvs.makeWidget({
    widget: jpvs.DataGrid,
    type: "DataGrid",

    prototype: {
        template: function (value) {
            /// <summary>Property: grid template. The grid template specifies how data items must be rendered in the data grid. The grid template is an array of column templates (a column template is applied on each row to the corresponding TD element). A column template is in the form: { header: headerTemplate, body: bodyTemplate, footer: footerTemplate } or simply: bodyTemplate when only the body template needs to be specified. The headerTemplate/bodyTemplate/footerTemplate is in the form: TEMPLATE or { isHeader: true/false, template: TEMPLATE }. Here, TEMPLATE is a template in the form used by the jpvs.applyTemplate function. Example: { fieldName: "FirstName" } or function(dataItem) { ... }.</summary>
            return this;
        },

        emptyRowTemplate: function (value) {
            /// <summary>Property: empty row template. This template is used whenever a row with a null/undefined data item is added to the grid. This template, unlike the standard data grid template, is applied to the TR element.</summary>
            return this;
        },

        binder: function (value) {
            /// <summary>Property: binder. The binder specifies how binding is performed. Examples of binders are: defaultBinder (all rows are displayed), pagingBinder (rows are displayed one page at a time with paging enabled), scrollingBinder (rows are displayed one page at a time with a scrollbar on the right side of the data grid).</summary>
            return this;
        },

        caption: function (value) {
            /// <summary>Property: grid caption.</summary>
            return this;
        },

        enableEvenOdd: function (value) {
            /// <summary>Property: true to enable even/odd row styling. If enabled, even rows get an "Even" CSS class and odd rows get an "Odd" CSS class.</summary>
            return this;
        },

        enableSorting: function (value) {
            /// <summary>Property: true to enable sorting.</summary>
            return this;
        },

        enableFiltering: function (value) {
            /// <summary>Property: true to enable filtering.</summary>
            return this;
        },

        sortAndFilterExpressions: function (value) {
            /// <summary>Property: list of combobox items and/or null items used to prompt the user with a list of sort/filter expressions. Only non-null items are used for the combobox that is propmted to the user. The null items are meant to provide the user with visual cues as to which columns are sortable/filterable. More specifically, if the item at index K is null, then the column with index K will not have the sorting/filtering button. For example, if the first two columns should not be sortable while the others should, you can provide a list of items where the first two items are null and the others are not null. Typically, a sort/filter expression is a column name on which the user may perform sorting/filtering. The value of this property is an array of items in the form: { value: sort/filter expression name, text: textual representation of the sort/filter expression }. Example: grid.sortAndFilterExpressions([{ value: "FirstName", text: "First name" }]).</summary>
            return this;
        },

        currentSort: function (value) {
            /// <summary>Property: list of items that specify how the records of the datasource must be sorted. Array items must be in the form: { name: sort expression name, descending: true/false }. Example: grid.currentSort([{ name: "FirstName", descending: false }, { name: "LastName", descending: true }]).</summary>
            return this;
        },

        currentFilter: function (value) {
            /// <summary>Property: list of items that specify how the records of the datasource must be filtered. Array items must be in the form: { name: filter expression name, operand: LT|LTE|EQ|NEQ|GT|GTE|CONTAINS|NCONTAINS|STARTS|NSTARTS, value: ... }. Example: grid.currentFilter([{ name: "FirstName", operand: "GTE", value: "John" }, { name: "FirstName", operand: "LTE", value: "Tom" }]). This filter extracts all records whose FirstName is between "John" and "Tom".</summary>
            return this;
        },

        clear: function (value) {
            /// <summary>Removes all header, body and footer rows from the grid.</summary>
            return this;
        },

        dataBind: function (data) {
            /// <summary>Fills the body section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        dataBindHeader: function (data) {
            /// <summary>Fills the header section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        dataBindFooter: function (data) {
            /// <summary>Fills the footer section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        addBodyRow: function (item, index) {
            /// <summary>Adds a row to the body section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        addHeaderRow: function (item, index) {
            /// <summary>Adds a row to the header section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        addFooterRow: function (item, index) {
            /// <summary>Adds a row to the footer section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeBodyRow: function (index) {
            /// <summary>Removes a row from the body section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeHeaderRow: function (index) {
            /// <summary>Removes a row from the header section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeFooterRow: function (index) {
            /// <summary>Removes a row from the footer section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeBodyRows: function (index, count) {
            /// <summary>Removes rows from the body section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        },

        removeHeaderRows: function (index, count) {
            /// <summary>Removes rows from the header section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        },

        removeFooterRows: function (index, count) {
            /// <summary>Removes rows from the footer section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        }
    }
});


jpvs.DataGrid.defaultBinder = function (section, data) {
    /// <summary>This binder displays all the rows in the datasource. This function can be used directly as the value of the data grid "binder" property.</summary>
};

jpvs.DataGrid.pagingBinder = function (params) {
    /// <summary>This binder displays rows one page at a time with paging enabled. This function creates a paging binder with the specified parameters and returns it. The returned value can be used as the value of the data grid "binder" property.</summary>
    /// <param name="params" type="Object">{ pageSize: Number, preserveCurrentPage: Boolean }. The "preserveCurrentPage" specifies whether the current page must be preserved when the dataBind method is called again.</param>
    /// <returns type="Function">The paging binder.</returns>
};

jpvs.DataGrid.scrollingBinder = function (params) {
    /// <summary>This binder displays rows one page at a time with a scrollbar on the right side. This function creates a scrolling binder with the specified parameters and returns it. The returned value can be used as the value of the data grid "binder" property.</summary>
    /// <param name="params" type="Object">{ pageSize: Number, chunkSize: Number, forcedWidth: CSS value, forcedHeight: CSS value }. The "chunkSize" value specifies how many rows are read from the datasource for caching purposes. The forced width and height, if provided, are applied to the data grid.</param>
    /// <returns type="Function">The scrolling binder.</returns>
};
