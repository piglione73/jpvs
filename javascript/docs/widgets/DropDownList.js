window.jpvs = window.jpvs || {};

jpvs.DropDownList = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DropDownList,
    type: "DropDownList",

    prototype: {
        clearItems: function () {
            /// <summary>Removes all the items.</summary>
            return this;
        },

        addItem: function (value, text) {
            /// <summary>Adds an item.</summary>
            /// <param name="value" type="String">Value of the item.</param>
            /// <param name="text" type="String">Text of the item. If omitted, the "value" is used.</param>
            return this;
        },

        addItems: function (items) {
            /// <summary>Adds multiple items.</summary>
            /// <param name="items" type="Array">Array of items to add. Each item may be a string or an object like this: { value: String, text: String }.</param>
            return this;
        },

        count: function () {
            /// <summary>Returns the number of items.</summary>
            return 10;
        },

        selectedValue: function (value) {
            /// <summary>Property: selected value.</summary>
            return this;
        }
    }
});
