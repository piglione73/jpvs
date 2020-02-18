(function () {

    jpvs.Pager = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.Pager.allStrings = {
        en: {
            firstPage: "First page",
            previousPage: "Previous page",
            nextPage: "Next page",
            lastPage: "Last page",
            pag: "Page"
        },
        it: {
            firstPage: "Prima pagina",
            previousPage: "Pagina precedente",
            nextPage: "Pagina successiva",
            lastPage: "Ultima pagina",
            pag: "Pag."
        }
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
            var tr = jpvs.writeTag(tbody, "tr");

            var first = jpvs.writeTag(tr, "td");
            var prev = jpvs.writeTag(tr, "td");
            var combo = jpvs.writeTag(tr, "td");
            var next = jpvs.writeTag(tr, "td");
            var last = jpvs.writeTag(tr, "td");

            jpvs.Pager.strings = jpvs.Pager.allStrings[jpvs.currentLocale()];

            W.lnkFirst = jpvs.LinkButton.create(first).text(jpvs.Pager.strings.firstPage).click(function () {
                if (W.totalPages() != null)
                    W.page(Math.min(0, W.totalPages() - 1));
                else
                    W.page(0);

                W.change.fire(W);
            });

            W.lnkNext = jpvs.LinkButton.create(next).text(jpvs.Pager.strings.nextPage).click(function () {
                if (W.totalPages() != null)
                    W.page(Math.min(W.page() + 1, W.totalPages() - 1));
                else
                    W.page(W.page() + 1);

                W.change.fire(W);
            });

            W.lnkPrev = jpvs.LinkButton.create(prev).text(jpvs.Pager.strings.previousPage).click(function () {
                W.page(Math.max(0, W.page() - 1));
                W.change.fire(W);
            });

            W.lnkLast = jpvs.LinkButton.create(last).text(jpvs.Pager.strings.lastPage).click(function () {
                if (W.totalPages() != null) {
                    W.page(W.totalPages() - 1);
                    W.change.fire(W);
                }
            });

            //Either a DropDownList...
            W.cmbPages = jpvs.DropDownList.create(combo).change(function () {
                var val = parseInt(this.selectedValue());
                W.page(Math.min(val, W.totalPages() - 1));
                W.change.fire(W);
            });

            //...or a plain TextBox if the total number of pages is too high or unknown
            W.pnl = jpvs.writeTag(combo, "div").css({
                "white-space": "nowrap",
                "display": "none"
            });
            jpvs.write(W.pnl, jpvs.Pager.strings.pag + " ");
            W.txt = jpvs.TextBox.create(W.pnl).width("3em");
            W.txt.element.css("text-align", "right").on("keydown", onKeyDown(W));
            W.lblTot = jpvs.writeTag(W.pnl, "span");
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            page: jpvs.property({
                get: function () { return this.element.data("page") || 0; },
                set: function (value) {
                    if (value != null && isFinite(value) && value >= 0) {
                        if (this.totalPages() == null || value < this.totalPages()) {
                            this.element.data("page", value);

                            this.cmbPages.selectedValue(value.toString());
                            this.txt.text((value + 1).toString());

                            refreshEnableDisable(this);
                        }
                    }
                }
            }),

            totalPages: jpvs.property({
                get: function () { return this.element.data("totalPages") || null; },
                set: function (value) {
                    var oldValue = this.totalPages();
                    if (oldValue != value || value == null)
                        refreshTotal(this, value);

                    this.element.data("totalPages", value);

                    //Clip, only if there is at least one page and this.page() is out of range
                    //If there are no pages, there is no need to do anything
                    if (value != null && value > 0 && this.page() >= value) {
                        this.page(value - 1);
                        this.change.fire(this);
                    }
                }
            })
        }
    });

    function refreshEnableDisable(W) {
        W.lnkFirst.enabled(W.page() > 0);
        W.lnkPrev.enabled(W.page() > 0);

        if (W.totalPages() != null) {
            W.lnkNext.enabled(W.page() < W.totalPages() - 1);
            W.lnkLast.enabled(W.page() < W.totalPages() - 1);
            W.lnkLast.element.show();
        }
        else {
            W.lnkNext.enabled(true);
            W.lnkLast.enabled(false);
            W.lnkLast.element.hide();
        }
    }

    function refreshTotal(W, value) {
        W.cmbPages.clearItems();

        if (value != null && value <= 50) {
            //DropDownList
            W.useDropDown = true;
            W.cmbPages.element.show();
            W.pnl.hide();

            for (var i = 0; i < value; i++)
                W.cmbPages.addItem(i.toString(), jpvs.Pager.strings.pag + " " + (i + 1) + " / " + value);
        }
        else {
            //TextBox
            W.useDropDown = false;
            W.cmbPages.element.hide();
            W.pnl.show();

            if (value != null) {
                W.lblTot.text("\u00a0/\u00a0" + value.toString());
                W.lblTot.show();
            }
            else
                W.lblTot.hide();
        }
    }

    function onKeyDown(W) {
        var UP = 38;
        var DOWN = 40;
        var ENTER = 13;

        return function (e) {
            if (e.which == DOWN) {
                W.page(W.page() + 1);
                W.change.fire(W);
            }
            else if (e.which == UP) {
                W.page(W.page() - 1);
                W.change.fire(W);
            }
            else if (e.which == ENTER) {
                W.page(parseInt(W.txt.text()) - 1);
                W.change.fire(W);
            }
        };
    }


})();
