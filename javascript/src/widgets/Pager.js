/* JPVS
Module: widgets
Classes: Pager
Depends: core, LinkButton
*/

(function () {

    jpvs.Pager = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.Pager.strings = {
        firstPage: "First page",
        previousPage: "Previous page",
        nextPage: "Next page",
        lastPage: "Last page",
        pag: "Page"
    };

    jpvs.makeWidget({
        widget: jpvs.Pager,
        type: "Pager",
        cssClass: "Pager",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            var tbody = jpvs.writeTag(W.element, "tbody");

            var first = jpvs.writeTag(tbody, "td");
            var prev = jpvs.writeTag(tbody, "td");
            var combo = jpvs.writeTag(tbody, "td");
            var next = jpvs.writeTag(tbody, "td");
            var last = jpvs.writeTag(tbody, "td");

            jpvs.LinkButton.create(first).text(jpvs.Pager.strings.firstPage).click(function () {
                W.page(Math.min(0, W.totalPages() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(next).text(jpvs.Pager.strings.nextPage).click(function () {
                W.page(Math.min(W.page() + 1, W.totalPages() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(prev).text(jpvs.Pager.strings.previousPage).click(function () {
                W.page(Math.max(0, W.page() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(last).text(jpvs.Pager.strings.lastPage).click(function () {
                W.page(W.totalPages() - 1);
                W.change.fire(W);
            });

            var cmbPages = jpvs.DropDownList.create(combo).change(function () {
                var val = parseInt(this.selectedValue());
                W.page(Math.min(val, W.totalPages() - 1));
                W.change.fire(W);
            });

            this.element.data("cmbPages", cmbPages);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            page: jpvs.property({
                get: function () { return this.element.data("page") || 0; },
                set: function (value) {
                    this.element.data("page", value);

                    var cmbPages = this.element.data("cmbPages");
                    cmbPages.selectedValue(value.toString());
                }
            }),

            totalPages: jpvs.property({
                get: function () { return this.element.data("totalPages") || 0; },
                set: function (value) {
                    var oldValue = this.totalPages();
                    if (oldValue != value) {
                        var cmbPages = this.element.data("cmbPages");
                        cmbPages.clearItems();
                        for (var i = 0; i < value; i++)
                            cmbPages.addItem(i.toString(), jpvs.Pager.strings.pag + " " + (i + 1));
                    }

                    this.element.data("totalPages", value);
                }
            })
        }
    });
})();
