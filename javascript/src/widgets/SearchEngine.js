(function () {

    jpvs.SearchEngine = function (selector) {
        this.attach(selector);
    };

    jpvs.makeWidget({
        widget: jpvs.SearchEngine,
        type: "SearchEngine",
        cssClass: "SearchEngine",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            W.lbl = jpvs.writeTag(W, "div", "Missing 'label' property.").addClass("Label");

            W.txt = jpvs.TextBox.create(W);
            W.txt.lazychange(onLazyChangeText(W));

            //Here additional search fields may be added, if necessary
            W.pnlAdditionalFields = jpvs.writeTag(W, "div").addClass("AdditionalFields");

            W.pnl = jpvs.writeTag(W, "div").addClass("Results").hide();
            W.grid = jpvs.DataGrid.create(W.pnl);
            W.grid.enableEvenOdd(true);
            W.grid.element.addClass("Grid");
        },

        canAttachTo: function (obj) {
            return false;
        },

        focus: function () {
            this.txt.focus();
        },

        prototype: {
            label: jpvs.property({
                get: function () { return this.lbl.text(); },
                set: function (value) { this.lbl.text(value); }
            }),

            applyAdditionalFieldsTemplate: function (template) {
                if (template)
                    jpvs.applyTemplate(this.pnlAdditionalFields, template, this);

                return this;
            },

            searchFunction: jpvs.property({
                get: function () {
                    return this.element.data("searchFunction") || function () {
                        alert("Missing 'searchFunction' property.");
                    };
                },
                set: function (value) {
                    this.element.data("searchFunction", value);
                }
            }),

            gridTemplate: jpvs.property({
                get: function () {
                    return this.element.data("gridTemplate") || [{
                        header: "Missing 'gridTemplate' property.",
                        body: "Missing 'gridTemplate' property."
                    }];
                },
                set: function (value) {
                    this.element.data("gridTemplate", value);
                }
            }),

            pageSize: jpvs.property({
                get: function () {
                    return this.element.data("pageSize") || null;
                },
                set: function (value) {
                    this.element.data("pageSize", value);
                }
            }),

            refresh: function () {
                onLazyChangeText(this)();
                return this;
            }
        }
    });

    function onLazyChangeText(W) {
        return function () {
            //Whenever the user entered something (even empty text) into the textbox, we call a function to get some data to display
            var functionToCall = W.searchFunction();
            functionToCall(W.txt.text(), function (returnedItems) {
                //If no results, then hide the results grid
                if (!returnedItems || !returnedItems.length) {
                    W.pnl.hide();
                    return;
                }

                //If we have results, then let's display them
                W.grid.clear().template(W.gridTemplate());
                W.grid.binder(W.pageSize() ? jpvs.DataGrid.pagingBinder({ pageSize: W.pageSize() }) : jpvs.DataGrid.defaultBinder);
                W.grid.addHeaderRow({}).dataBind(returnedItems);
                W.pnl.show();
            });
        };
    }
})();
