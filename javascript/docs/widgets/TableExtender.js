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

    Extender.prototype.apply = function () {
        /// <summary>Activates this TableExtender. First, you must create the extender via the "create" function. Then,
        /// you must configure it through its properties (e.g.: resizableColumns, persistColumnSizes, ...). Finally,
        /// you activate it by calling "apply". After modifying the set of columns, it is possible to call this method again
        /// in order to reapply the extender to the table.</summary>
    };

})();
