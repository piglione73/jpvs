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

    jpvs.MultiSelectBox.allStrings = {
        en: {
            selectAll: "Select all",
            unselectAll: "Unselect all"
        },

        it: {
            selectAll: "Seleziona tutto",
            unselectAll: "Deseleziona tutto"
        }
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
            jpvs.MultiSelectBox.strings = jpvs.MultiSelectBox.allStrings[jpvs.currentLocale()];

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
            this.label.addClass("Label");

            var buttonContainer = jpvs.writeTag(tr, "td");
            buttonContainer.addClass("ButtonContainer");

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
            caption: jpvs.property({
                get: function () {
                    return this.element.data("caption");
                },
                set: function (value) {
                    this.element.data("caption", value);
                }
            }),

            prompt: jpvs.property({
                get: function () {
                    return this.element.data("prompt");
                },
                set: function (value) {
                    this.element.data("prompt", value);
                }
            }),

            containerTemplate: jpvs.property({
                get: function () {
                    return this.element.data("containerTemplate");
                },
                set: function (value) {
                    this.element.data("containerTemplate", value);
                }
            }),

            itemTemplate: jpvs.property({
                get: function () {
                    return this.element.data("itemTemplate");
                },
                set: function (value) {
                    this.element.data("itemTemplate", value);
                }
            }),

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
            }),

            selectedValuesString: jpvs.property({
                get: function () { return this.selectedValues().join(","); },
                set: function (value) {
                    var x = $.trim(value);
                    if (x != "")
                        this.selectedValues(x.split(","));
                    else
                        this.selectedValues([]);
                }
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

        //Create the popup with no title, not modal and below the label
        //Autoclose if the user clicks outside
        var pop = jpvs.Popup.create().addState("MultiSelectBox").title(null).modal(false).position({ my: "left top", at: "left bottom", of: W.label, collision: "fit", position: "absolute" });
        pop.autoDestroy(true);

        //Write the prompt string
        var prompt = W.prompt();
        if (prompt)
            jpvs.writeln(pop, prompt);

        //Select all/unselect all buttons
        jpvs.LinkButton.create(pop).text(jpvs.MultiSelectBox.strings.selectAll).click(onSelectAll);
        jpvs.write(pop, " ");
        jpvs.LinkButton.create(pop).text(jpvs.MultiSelectBox.strings.unselectAll).click(onUnselectAll);
        jpvs.writeln(pop);

        //Create the container, using a default container template (UL)
        //No data item is passed to this template
        var containerTemplate = W.containerTemplate() || defaultContainerTemplate;
        var ul = jpvs.applyTemplate(pop, containerTemplate);

        //Then create the data items (checkboxes), using the item template
        //Use a default item template that renders the item as an LI element with a checkbox inside
        //The item template must return an object with a "selected" property and a "change" event, so we can use it from here no
        //matter how the item is rendered
        var itemTemplate = W.itemTemplate() || defaultItemTemplate;
        var itemObjects = [];
        $.each(items, function (i, item) {
            var itemObject = jpvs.applyTemplate(ul, itemTemplate, item);
            itemObjects.push(itemObject);

            //Set the state and subscribe to the change event
            itemObject.selected(!!item.selected);
            itemObject.change(onItemSelectChange(itemObject, item));
        });

        pop.show();

        function onSelectAll() {
            selectAll(true);
        }

        function onUnselectAll() {
            selectAll(false);
        }

        function selectAll(value) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var itemObject = itemObjects[i];

                itemObject.selected(value);
                item.selected = value;
            }

            updateAndFire();
        }

        function onItemSelectChange(itemObject, item) {
            return function () {
                item.selected = itemObject.selected();
                updateAndFire();
            };
        }

        function updateAndFire() {
            setItems(W, items);
            updateLabel(W);

            //Fire the change event
            W.change.fire(W);
        }

        function defaultContainerTemplate() {
            return jpvs.writeTag(this, "ul");
        }

        function defaultItemTemplate(dataItem) {
            var li = jpvs.writeTag(this, "li");
            var chk = jpvs.CheckBox.create(li).text(dataItem.text).change(onCheckBoxChange);

            //Prepare the item object with the "selected" property and the "change" event
            var itemObject = {
                selected: jpvs.property({
                    get: function () {
                        return chk.checked();
                    },
                    set: function (value) {
                        chk.checked(value);
                    }
                }),

                change: jpvs.event(W)
            };

            return itemObject;

            function onCheckBoxChange() {
                //We just fire the change event
                itemObject.change.fire(itemObject);
            }
        }
    }

})();
