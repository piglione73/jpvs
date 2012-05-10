/* JPVS
Module: widgets
Classes: Table
Depends: core
*/

(function () {

    jpvs.Table = function (selector) {
        this.attach(selector);
    };

    jpvs.makeWidget({
        widget: jpvs.Table,
        type: "Table",
        cssClass: "Table",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
        },

        canAttachTo: function (obj) {
            return $(obj).is("table");
        },

        prototype: {
            addClass: function (classNames) {
                //Proxy to jQuery method
                this.element.addClass(classNames);
                return this;
            },

            removeClass: function (classNames) {
                //Proxy to jQuery method
                this.element.removeClass(classNames);
                return this;
            },

            css: function () {
                //Proxy to jQuery method
                this.element.css.apply(this.element, arguments);
                return this;
            },

            writeHeaderRow: function () {
                return writeRow(this, "thead");
            },

            writeBodyRow: function () {
                return writeRow(this, "tbody");
            },

            writeRow: function () {
                return this.writeBodyRow();
            },

            writeFooterRow: function () {
                return writeRow(this, "tfoot");
            },

            caption: jpvs.property({
                get: function () {
                    var caption = this.element.children("caption");
                    if (caption.length != 0)
                        return caption.text();
                    else
                        return null;
                },
                set: function (value) {
                    var caption = this.element.children("caption");
                    if (caption.length == 0) {
                        caption = $(document.createElement("caption"));
                        this.element.prepend(caption);
                    }

                    caption.text(value);
                }
            }),

            clear: function () {
                this.element.find("tr").remove();
                return this;
            }
        }
    });

    function getSection(W, section) {
        //Ensure the "section" exists (thead, tbody or tfoot)
        var sectionElement = W.element.children(section);
        if (sectionElement.length == 0) {
            sectionElement = $(document.createElement(section));
            W.element.append(sectionElement);
        }

        return sectionElement;
    }

    function writeRow(W, section) {
        var sectionElement = getSection(W, section);

        //Add a new row
        var tr = $(document.createElement("tr"));
        sectionElement.append(tr);

        //Wrap the row in a row object
        return new RowObject(W, tr);
    }

    function RowObject(W, tr) {
        this.table = W;
        this.element = tr;
    }

    RowObject.prototype.writeHeaderCell = function (text) {
        return jpvs.writeTag(this.element, "th", text);
    };

    RowObject.prototype.writeCell = function (text) {
        return jpvs.writeTag(this.element, "td", text);
    };

    RowObject.prototype.getMainContentElement = function () {
        return this.element;
    };
})();
