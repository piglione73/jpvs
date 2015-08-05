window.jpvs = window.jpvs || {};

(function () {

    jpvs.TableExtender = {
        create: function (table) {
            /// <summary>Creates a TableExtender and attaches it to an existing table widget, table selector, table element.</summary>
            /// <param name="table" type="Object">The DOM element or jQuery object or JPVS widget to which the TableExtender must be associated.</param>
            return new Extender();
        }
    };


    function Extender(tableElement) {
        this.afterResize = new jpvs.Event();
        this.changeFilterSort = new jpvs.Event();
    }

    Extender.prototype.resizableColumns = function (value) {
        /// <summary>Property: true/false. Specifies whether the resizable columns extension must be activated.</summary>
        return this;
    };

    Extender.prototype.persistColumnSizes = function (value) {
        /// <summary>Property: true/false. Specifies whether the column sizes after a resize must be persisted on localStorage.
        /// Two custom attributes should be used in order to identify the table and its columns. The first one is "data-table-name" and
        /// must be applied to the table element. Then, on each COL element, a "data-col-name" should be used.</summary>
        return this;
    };

    Extender.prototype.enableFiltering = function (value) {
        /// <summary>Property: true/false. Specifies whether row filtering has to be enabled. Column names must be identified by the
        /// "data-col-name" attribute on each COL element. Column friendly names (displayed in the filtering popup) are taken
        /// from the "data-col-header" attribute. Set the "data-col-filter" attribute to "false" to disable filtering on single columns.</summary>
        return this;
    };

    Extender.prototype.enableSorting = function (value) {
        /// <summary>Property: true/false. Specifies whether row sorting has to be enabled. Column names must be identified by the
        /// "data-col-name" attribute on each COL element. Column friendly names (displayed in the sorting popup) are taken
        /// from the "data-col-header" attribute. Set the "data-col-sort" attribute to "false" to disable filtering on single columns.</summary>
        return this;
    };

    Extender.prototype.getSortAndFilterSettings = function () {
        /// <summary>Gets sorting and filtering settings. Returns an object of type { sort: [], filter: [] }.
        /// The "sort" field is an array of sorting rules. Each sorting rule has this form: { colName: <value of the COL's "data-col-name" attribute>,
        /// descending: <true/false> }.
        /// The "filter" field is an array of filtering rules. Each filtering rule has this form:
        /// { 
        ///     colName: <value of the COL's "data-col-name" attribute>, 
        ///     operand: <"EQ" | "NEQ" | "CONTAINS" | "NCONTAINS" | "STARTS" | "NSTARTS" | "LT" | "LTE" | "GT" | "GTE">, 
        ///     value: <value set by the user>
        /// }
    };

    Extender.prototype.apply = function () {
        /// <summary>Activates this TableExtender. First, you must create the extender via the "create" function. Then,
        /// you must configure it through its properties (e.g.: resizableColumns, persistColumnSizes, ...). Finally,
        /// you activate it by calling "apply". After modifying the set of columns, it is possible to call this method again
        /// in order to reapply the extender to the table.</summary>
    };

})();
