﻿/* JPVS
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

            enableEvenOdd: jpvs.property({
                get: function () {
                    var val = this.element.data("enableEvenOdd");
                    if (val === true || val === false)
                        return val;
                    else
                        return true;    //Default value
                },
                set: function (value) { this.element.data("enableEvenOdd", value); }
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

            addBodyRow: function (item, index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
            },

            addHeaderRow: function (item, index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
            },

            addFooterRow: function (item, index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
            },

            removeBodyRow: function (index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
            },

            removeHeaderRow: function (index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
            },

            removeFooterRow: function (index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
            },

            removeBodyRows: function (index, count) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
            },

            removeHeaderRows: function (index, count) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
            },

            removeFooterRows: function (index, count) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
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

    function addRow(W, sectionName, sectionElement, item, index) {
        if (!item)
            return;

        //Add a new row
        var tr = $(document.createElement("tr"));

        if (index === null || index === undefined) {
            //Append, because no index was specified
            sectionElement.append(tr);

            //Only update the even/odd of the last row
            if (W.enableEvenOdd())
                updateEvenOdd(-1, sectionElement);
        }
        else {
            //An index was specified: insert the row at that index
            var trs = sectionElement.find("tr");
            if (trs.length == 0)
                sectionElement.append(tr);
            else
                trs.eq(index).before(tr);

            //Update the even/odd state of all rows from "index" on
            if (W.enableEvenOdd())
                updateEvenOdd(index, sectionElement);
        }

        //Create the cells according to the row template
        var tmpl = W.template();
        if (tmpl)
            applyRowTemplate(tr, sectionName, tmpl, item);
    }

    function removeRow(W, sectionElement, index, count) {
        //By default, count = 1
        if (count === null || count === undefined)
            count = 1;

        if (count == 1)
            sectionElement.find("tr").eq(index).remove();
        else if (count > 1)
            sectionElement.find("tr").slice(index, index + count).remove();

        //Update the even/odd state of all rows from "index" on
        if (W.enableEvenOdd())
            updateEvenOdd(index, sectionElement);
    }

    function updateEvenOdd(start, sectionElement) {
        var rows = sectionElement.find("tr");

        if (start < 0)
            start += rows.length;

        var even = ((start % 2) == 0);

        for (var i = start; i < rows.length; i++) {
            var row = rows.eq(i);
            row.removeClass("Even Odd").addClass(even ? "Even" : "Odd");

            //Toggle "even"
            even = !even;
        }
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

                    pagerId = jpvs.randomString(20);
                    pager.element.attr("id", pagerId);
                    W.element.data("pagerId", pagerId);
                }

                //Bind events
                pager.change.unbind("DataGrid");
                pager.change.bind("DataGrid", onPageChange);

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
        var chunkSize = (params && params.chunkSize) || (5 * pageSize);

        function binder(section, data) {
            var W = this;
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curScrollPos = null;

            var cachedData = [];
            var totalRecords = +Infinity;

            //Ensure the scroller is present
            var scroller = getScroller();

            //Load the first chunk of data
            ensurePageOfDataLoaded(0, updateGrid(0));

            function ensurePageOfDataLoaded(newScrollPos, next) {
                //Let's make sure we have all the records in memory (at least for the page we have to display)
                //Let's also check beyond "totalRecords"
                var start = newScrollPos;
                var end = start + pageSize;
                var allPresent = true;
                for (var i = start; i < end; i++) {
                    var recordPresent = cachedData[i];
                    if (!recordPresent) {
                        allPresent = false;
                        break;
                    }
                }

                //If we don't have all records in memory, let's call the datasource
                if (allPresent)
                    next();
                else
                    jpvs.readDataSource(data, newScrollPos, chunkSize, onDataLoaded(next));
            }

            function onDataLoaded(next) {
                return function (ret) {
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

                    //Update the scroller
                    scroller.visibleSize({ width: 100, height: pageSize });
                    scroller.totalSize({ width: 100, height: Math.max(1, totalRecords - pageSize + 3) });

                    //Call the next function
                    if (next)
                        next();
                };
            }

            function updateGrid(newScrollPos) {
                return function () {
                    if (curScrollPos === null) {
                        //First time: write the entire page
                        refreshPage(newScrollPos);

                        //Fix the scroller size by setting the size explicitly
                        var scrollerSize = scroller.objectSize();
                        scroller.objectSize(scrollerSize);
                    }
                    else {
                        //Not first time. Determine if it's faster to refresh the entire page or to delete/insert selected rows
                        var delta = newScrollPos - curScrollPos;

                        //"delta" represents the number of rows to delete and the number of new rows to insert
                        //Refreshing the entire page requires deleting all rows and inserting the entire page (pageSize)
                        if (Math.abs(delta) < pageSize) {
                            //Incremental is better
                            scrollGrid(newScrollPos, delta);
                        }
                        else {
                            //Full redraw is better
                            refreshPage(newScrollPos);
                        }
                    }

                    //At the end, the new position becomes the current position
                    curScrollPos = newScrollPos;
                };
            }

            function refreshPage(newScrollPos) {
                //Remove all rows
                sectionElement.empty();

                //Add one page of rows
                var end = Math.min(cachedData.length, newScrollPos + pageSize);
                for (var i = newScrollPos; i < end; i++)
                    addRow(W, sectionName, sectionElement, cachedData[i]);
            }

            function scrollGrid(newScrollPos, delta) {
                if (delta > 0) {
                    //Scroll forward: remove "delta" lines from the beginning and append "delta" lines at the end
                    W.removeBodyRows(0, delta);

                    var i = newScrollPos + pageSize - delta;
                    var j = 0;
                    while (j++ < delta)
                        addRow(W, sectionName, sectionElement, cachedData[i++]);
                }
                else if (delta < 0) {
                    delta = -delta;

                    //Scroll backwards: remove "delta" lines at the end and insert "delta" lines at the beginning
                    W.removeBodyRows(pageSize - delta, delta);

                    var i = newScrollPos;
                    var j = 0;
                    while (j < delta)
                        addRow(W, sectionName, sectionElement, cachedData[i++], j++);
                }
            }

            function getScroller() {
                //Let's see if a scroller has already been created for this datagrid
                var scrollerId = W.element.data("scrollerId");
                var scroller;
                if (scrollerId) {
                    //There is a scroller
                    scroller = jpvs.find("#" + scrollerId);
                }
                else {
                    //No scroller, let's create one
                    var scrollerContainer = document.createElement("div");
                    W.element.after(scrollerContainer);
                    scroller = jpvs.Scroller.create(scrollerContainer);

                    scrollerId = jpvs.randomString(20);
                    scroller.element.attr("id", scrollerId);
                    W.element.data("scrollerId", scrollerId);

                    //Move the DataGrid inside the scroller, so the scroller gets the same size as the DataGrid
                    scroller.element.append(W.element);
                }

                //Bind events
                scroller.change.unbind("DataGrid");
                scroller.change.bind("DataGrid", onScrollChange);

                return scroller;
            }

            function onScrollChange() {
                var newScrollPos = Math.min(totalRecords, Math.floor(this.scrollPosition().top));
                ensurePageOfDataLoaded(newScrollPos, updateGrid(newScrollPos));
            }
        }

        return binder;
    };
})();
