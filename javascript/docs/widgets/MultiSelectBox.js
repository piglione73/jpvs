window.jpvs = window.jpvs || {};

jpvs.MultiSelectBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiSelectBox,
    type: "MultiSelectBox",

    prototype: {
        caption: function () {
            /// <summary>Property: caption of the widget. Used as the title of the selection popup.</summary>
            return this;
        },

        prompt: function () {
            /// <summary>Property: prompt string used in the selection popup. May be empty, which means "no prompt string".</summary>
            return this;
        },

        containerTemplate: function () {
            /// <summary>Property: container template. Must create a container and return it. If not specified, 
            /// a default container template is used which creates and returns a UL element. When used, no dataItem is passed to this template.</summary>
            return this;
        },

        itemTemplate: function () {
            /// <summary>Property: item template. Must create an item. If not specified, 
            /// a default item template is used which creates an LI element with a checkbox inside.
            /// The template must return an object that has a "selected" property and a "change" event. This object allows
            /// the MultiSelectBox to select/unselect the item, read its state and subscribe to its "change" event.</summary>
            return this;
        },

        clearItems: function () {
            /// <summary>Removes all the items.</summary>
            return this;
        },

        addItem: function (value, text, selected) {
            /// <summary>Adds an item.</summary>
            /// <param name="value" type="String">Value of the item.</param>
            /// <param name="text" type="String">Text of the item. If omitted, the "value" is used.</param>
            /// <param name="selected" type="Boolean">Specifies if the item must be initially selected.</param>
            return this;
        },

        addItems: function (items) {
            /// <summary>Adds multiple items.</summary>
            /// <param name="items" type="Array">Array of items to add. Each item may be a string or an object like this: { value: String, text: String, selected: Boolean }.</param>
            return this;
        },

        count: function () {
            /// <summary>Returns the number of items.</summary>
            return 10;
        },

        selectedValues: function (value) {
            /// <summary>Property: array of selected values.</summary>
            return this;
        },

        selectedValuesString: function (value) {
            /// <summary>Property: selected values as a comma-separated list.</summary>
            return this;
        }
    }
});
