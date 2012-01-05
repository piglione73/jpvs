/* JPVS
Module: widgets
Classes: DataGrid
Depends: core
*/

(function () {

    jpvs.DataGrid = function (selector) {
        this.attach(selector);
    };

    jpvs.makeWidget({
        widget: jpvs.DataGrid,
        type: "DataGrid",
        cssClass: "DataGrid",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            template: jpvs.property({
                get: function () { return this.element.data("template"); },
                set: function (value) { this.element.data("template", value); }
            }),

            caption: jpvs.property({
                get: function () {
                    var caption = this.element.find("caption");
                    if (caption.length != 0)
                        return caption.text();
                    else
                        return null;
                },
                set: function (value) {
                    var caption = this.element.find("caption");
                    if (caption.length == 0) {
                        caption = $(document.createElement("caption"));
                        this.element.prepend(caption);
                    }

                    caption.text(value);
                }
            }),

            clear: function () {
                this.element.find("tr").remove();
            },

            dataBind: function (data) {
                dataBind(this, "tbody", data);
            },

            dataBindHeader: function (data) {
                dataBind(this, "thead", data);
            },

            dataBindFooter: function (data) {
                dataBind(this, "tfoot", data);
            },

            addBodyRow: function (item) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item);
            },

            addHeaderRow: function (item) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item);
            },

            addFooterRow: function (item) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item);
            }
        }
    });

    function dataBind(W, section, data) {
        function getList() {
            if (!data)
                return [];
            else if (typeof (data) == "function")
                return data();
            else
                return data;
        }

        //Obtain the list of record to display
        var list = getList();

        //Remove all rows and recreate them
        var sectionElement = getSection(W, section);
        var sectionName = decodeSectionName(section);
        sectionElement.empty();

        $.each(list, function (i, item) {
            addRow(W, sectionName, sectionElement, item);
        });
    }

    function getSection(W, section) {
        //Ensure the "section" exists (thead, tbody or tfoot)
        var sectionElement = W.element.find(section);
        if (sectionElement.length == 0) {
            sectionElement = $(document.createElement(section));
            W.element.append(sectionElement);
        }

        return sectionElement;
    }

    function addRow(W, sectionName, sectionElement, item) {
        //Add a new row
        var tr = $(document.createElement("tr"));
        sectionElement.append(tr);

        //Create the cells according to the row template
        var tmpl = W.template();
        if (tmpl)
            applyRowTemplate(tr, sectionName, tmpl, item);
    }

    function decodeSectionName(section) {
        if (section == "thead") return "header";
        else if (section == "tfoot") return "footer";
        else return "body";
    }

    function applyRowTemplate(tr, sectionName, tmpl, item) {
        //The template is a collection of column templates. For each element, create a cell.
        $.each(tmpl, function (i, columnTemplate) {
            /*
            Determine the cell template, given the column template.
            The column template may be in the form:
            { header: headerCellTemplate, body: bodyCellTemplate, footer: footerCellTemplate } where any element may be missing.
            Or it may contain the cell template directly.
            */
            var cellTemplate = columnTemplate;
            if (columnTemplate.header || columnTemplate.body || columnTemplate.footer)
                cellTemplate = columnTemplate[sectionName];

            //Determine if we have to create a TH or a TD
            var cellTag = "td";
            if ((cellTemplate && cellTemplate.isHeader) || sectionName == "header" || sectionName == "footer")
                cellTag = "th";

            //Create the cell
            var cell = $(document.createElement(cellTag));
            tr.append(cell);

            //Populate the cell by applying the cell template
            jpvs.applyTemplate(cell, cellTemplate, item);
        });
    }
})();
