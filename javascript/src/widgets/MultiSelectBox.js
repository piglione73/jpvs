/* JPVS
Module: widgets
Classes: MultiSelectBox
Depends: core
*/

(function () {

    jpvs.MultiSelectBox = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.makeWidget({
        widget: jpvs.MultiSelectBox,
        type: "MultiSelectBox",
        cssClass: "MultiSelectBox",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Read items
            var items = [];
            this.element.find("option").each(function () {
                var opt = $(this);
                var value = opt.val();
                var text = opt.text();
                var selected = opt.prop("selected");

                items.push({ value: value, text: text, selected: selected });
            });

            //Remove this.element and substitute it with a table
            var newElem = jpvs.writeTag(this.element.parent(), "table");
            newElem.insertAfter(this.element);
            this.element.remove();
            newElem.attr("id", this.element.attr("id"));
            newElem.attr("class", this.element.attr("class"));
            this.element = newElem;

            //Attach the items collection
            setItems(W, items);

            //Create the label and the button
            var tbody = jpvs.writeTag(W, "tbody");
            var tr = jpvs.writeTag(tbody, "tr");

            this.label = jpvs.writeTag(tr, "td");

            var buttonContainer = jpvs.writeTag(tr, "td");

            this.button = jpvs.Button.create(buttonContainer).text("...").click(function () {
                showPopup(W);
            });

            //Update the label
            updateLabel(W);
        },

        canAttachTo: function (obj) {
            //No autoattach
            return false
        },

        prototype: {
            clearItems: function () {
                setItems(this, []);
                updateLabel(this);
                return this;
            },

            addItem: function (value, text, selected) {
                var V = value;
                var T = text != null ? text : value;

                if (V != null & T != null) {
                    var items = getItems(this);
                    items.push({ value: V, text: T, selected: !!selected });
                    setItems(this, items);
                    updateLabel(this);
                }

                return this;
            },

            addItems: function (items) {
                var W = this;
                $.each(items, function (i, item) {
                    if (item != null) {
                        if (item.value != null)
                            W.addItem(item.value, item.text);
                        else
                            W.addItem(item);
                    }
                });

                return this;
            },

            count: function () {
                var items = getItems(this);
                return items.length;
            },

            selectedValues: jpvs.property({
                get: function () { return getSelectedValues(this); },
                set: function (value) { setSelectedValues(this, value); }
            })
        }
    });

    function getItems(W) {
        return W.element.data("items");
    }

    function setItems(W, items) {
        W.element.data("items", items);
    }

    function getSelectedItems(W) {
        var items = getItems(W);
        var selItems = [];
        $.each(items, function (i, item) {
            if (item.selected)
                selItems.push(item);
        });

        return selItems;
    }

    function getSelectedTexts(W) {
        var selItems = getSelectedItems(W);
        var texts = [];
        $.each(selItems, function (i, item) {
            texts.push(item.text);
        });

        return texts;
    }

    function getSelectedValues(W) {
        var selItems = getSelectedItems(W);
        var values = [];
        $.each(selItems, function (i, item) {
            values.push(item.value);
        });

        return values;
    }

    function setSelectedValues(W, values) {
        var items = getItems(W);
        var mapItems = {};

        //Deselect all...
        $.each(items, function (i, item) {
            item.selected = false;
            mapItems[item.value] = item;
        });

        //... and select
        $.each(values, function (i, value) {
            var item = mapItems[value];
            if (item)
                item.selected = true;
        });

        setItems(W, items);
        updateLabel(W);
    }

    function updateLabel(W) {
        var texts = getSelectedTexts(W);
        jpvs.write(W.label.empty(), texts.join(", "));
    }

    function showPopup(W) {
        var items = getItems(W);

        var pop = jpvs.Popup.create().title("...").close(function () { pop.destroy(); });
        var ul = jpvs.writeTag(pop, "ul");

        $.each(items, function (i, item) {
            var li = jpvs.writeTag(ul, "li");
            jpvs.CheckBox.create(li).text(item.text).checked(!!item.selected).change(onItemSelectChange(item));
        });

        pop.show();

        function onItemSelectChange(item) {
            return function () {
                item.selected = this.checked();
                setItems(W, items);
                updateLabel(W);

                //Fire the change event
                W.change.fire(W);
            };
        }
    }

})();
