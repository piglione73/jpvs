/* JPVS
Module: widgets
Classes: DataGrid
Depends: core, Pager
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

            binder: jpvs.property({
                get: function () { return this.element.data("binder"); },
                set: function (value) { this.element.data("binder", value); }
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
        //Get the current binder or the default one
        var binder = W.binder() || jpvs.DataGrid.defaultBinder;

        //Call the binder, setting this=WIDGET and passing section and data
        binder.call(W, section, data);
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


    /*
    Default binder

    Displays all rows in the datasource
    */
    jpvs.DataGrid.defaultBinder = function (section, data) {
        var W = this;

        //Remove all rows
        var sectionElement = getSection(W, section);
        var sectionName = decodeSectionName(section);

        //Read the entire data set...
        jpvs.readDataSource(data, null, null, next);

        //...and bind all the rows
        function next(ret) {
            sectionElement.empty();
            $.each(ret.data, function (i, item) {
                addRow(W, sectionName, sectionElement, item);
            });
        }
    };



    /*
    Paging binder

    Displays rows in the grid one page at a time
    */
    jpvs.DataGrid.pagingBinder = function (params) {
        var pageSize = (params && params.pageSize) || 10;

        function binder(section, data) {
            var W = this;
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curPage = 0;

            //Ensure the pager is present
            var pager = getPager();

            //Refresh the current page
            refreshPage(W, section, data, pager);

            function getPager() {
                //Let's see if a pager has already been created for this datagrid
                var pagerId = W.element.data("pagerId");
                var pager;
                if (pagerId) {
                    //There is a pager
                    pager = jpvs.find("#" + pagerId);
                }
                else {
                    //No pager, let's create one
                    var pagerContainer = document.createElement("div");
                    W.element.before(pagerContainer);
                    pager = jpvs.Pager.create(pagerContainer);

                    //Bind events
                    pager.change(onPageChange);
                }

                return pager;
            }

            function onPageChange() {
                var newPage = this.page();
                curPage = newPage;
                refreshPage(W, section, data, pager);
            }

            function refreshPage() {
                //Read the current page...
                var start = curPage * pageSize;
                jpvs.readDataSource(data, start, pageSize, next);

                //...and bind all the rows
                function next(ret) {
                    //Remove all rows
                    sectionElement.empty();

                    //Add rows
                    $.each(ret.data, function (i, item) {
                        addRow(W, sectionName, sectionElement, item);
                    });

                    //Update the pager, based on the current situation
                    var totPages = Math.floor((ret.total + pageSize - 1) / pageSize);
                    pager.page(curPage);
                    pager.totalPages(totPages);
                }
            }
        }

        return binder;
    };



    /*
    Scrolling binder

    Displays at most one page and allows up/down scrolling
    */
    jpvs.DataGrid.scrollingBinder = function (params) {
        var pageSize = (params && params.pageSize) || 10;
        var chunkSize = (params && params.pageSize) || (5 * pageSize);

        function binder(section, data) {
            var W = this;
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curScrollPos = null;
            var newScrollPos = 0;

            var cachedData = [];
            var totalRecords = 0;

            //Ensure the scroller is present
            var scroller = getScroller();

            //Load the first chunk of data
            jpvs.readDataSource(data, newScrollPos, chunkSize, onDataLoaded);

            function onDataLoaded(ret) {
                //Write to cache
                totalRecords = ret.total;
                var start = ret.start;
                var count = ret.count;
                var requiredCacheLength = start + count;

                //Resize cache if necessary
                while (cachedData.length < requiredCacheLength)
                    cachedData.push(undefined);

                //Now write into the array
                var i = start, j = 0;
                while (j < count)
                    cachedData[i++] = ret.data[j++];

                //Finally, update the grid incrementally, if possible
                updateGrid();
            }

            function updateGrid() {
                if (!curScrollPos) {
                    //First time: write the entire page
                    refreshPage();
                }
                else {
                    //Not first time. Determine if it's faster to refresh the entire page or to delete/insert selected rows
                    var delta = newScrollPos - curScrollPos;

                    //"delta" represents the number of rows to delete and the number of new rows to insert
                    //Refreshing the entire page requires deleting all rows and inserting the entire page (pageSize)
                    if (delta < pageSize) {
                        //Incremental is better
                        scrollGrid(delta);
                    }
                    else {
                        //Full redraw is better
                        refreshPage();
                    }
                }

                //At the end, the new position becomes the current position
                curScrollPos = newScrollPos;
            }

            function refreshPage() {
                //Remove all rows
                sectionElement.empty();

                //Add one page of rows
                var end = Math.min(cachedData.length, newScrollPos + pageSize);
                for (var i = newScrollPos; i < end; i++)
                    addRow(W, sectionName, sectionElement, cachedData[i]);

                //Update the scroller, based on the current situation
                scroller.page(newScrollPos);
                scroller.totalPages(totalRecords);
            }

            function scrollRows(delta) {
                alert("TODO: scroll " + delta);
            }

            function getScroller() {
                //Let's see if a scroller has already been created for this datagrid
                var pagerId = W.element.data("pagerId");
                var pager;
                if (pagerId) {
                    //There is a pager
                    pager = jpvs.find("#" + pagerId);
                }
                else {
                    //No pager, let's create one
                    var pagerContainer = document.createElement("div");
                    W.element.before(pagerContainer);
                    pager = jpvs.Pager.create(pagerContainer);

                    //Bind events
                    pager.change(onScrollChange);
                }

                return pager;
            }

            function onScrollChange() {
                var newScrollPos = this.page();
                scrollRows(newScrollPos - curScrollPos, W, section, data, scroller);
                curScrollPos = newScrollPos;
                refreshPage(W, section, data, scroller);
            }
        }

        return binder;
    };
})();
