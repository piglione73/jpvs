window.jpvs = window.jpvs || {};


jpvs.Table = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.Table,
    type: "Table",

    prototype: {
        addClass: function (classNames) {
            /// <summary>Proxy to jQuery addClass function.</summary>
            return this;
        },

        removeClass: function (classNames) {
            /// <summary>Proxy to jQuery removeClass function.</summary>
            return this;
        },

        css: function () {
            /// <summary>Proxy to jQuery css function.</summary>
            return this;
        },

        writeHeaderRow: function () {
            /// <summary>Writes a new row in the header.</summary>
            return new JPVS_RowObject();
        },

        writeBodyRow: function () {
            /// <summary>Writes a new row in the body.</summary>
            return new JPVS_RowObject();
        },

        writeRow: function () {
            /// <summary>Writes a new row in the body.</summary>
            return new JPVS_RowObject();
        },

        writeFooterRow: function () {
            /// <summary>Writes a new row in the footer.</summary>
            return new JPVS_RowObject();
        },

        caption: function (value) {
            /// <summary>Property: table caption.</summary>
            return this;
        },

        clear: function () {
            /// <summary>Removes all rows from header, body and footer.</summary>
            return this;
        }
    }
});

function JPVS_RowObject() {
}

JPVS_RowObject.prototype.writeHeaderCell = function (text) {
    /// <summary>Writes a header cell (TH) and returns the jQuery object that represents the cell.</summary>
    /// <param name="text" type="String">Optional: text to write in the cell.</param>
    return $("");
};

JPVS_RowObject.prototype.writeCell = function (text) {
    /// <summary>Writes a cell (TD) and returns the jQuery object that represents the cell.</summary>
    /// <param name="text" type="String">Optional: text to write in the cell.</param>
    return $("");
};
