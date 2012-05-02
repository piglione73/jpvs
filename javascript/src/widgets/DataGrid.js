/* JPVS
Module: widgets
Classes: DataGrid
Depends: core, Pager
*/

(function () {

    jpvs.DataGrid = function (selector) {
        this.attach(selector);

        this.dataItemClick = jpvs.event(this);
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
            //Attach a click handler to all rows, even those we will add later
            this.element.on("click", "tr", function (e) {
                onRowClicked(W, e.currentTarget);
            });
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            template: jpvs.property({
                get: function () { return this.element.data("template"); },
                set: function (value) { this.element.data("template", value); }
            }),

            emptyRowTemplate: jpvs.property({
                get: function () { return this.element.data("emptyRowTemplate"); },
                set: function (value) { this.element.data("emptyRowTemplate", value); }
            }),

            binder: jpvs.property({
                get: function () { return this.element.data("binder"); },
                set: function (value) { this.element.data("binder", value); }
            }),

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
                return this;
            },

            dataBind: function (data) {
                dataBind(this, "tbody", data);
                return this;
            },

            dataBindHeader: function (data) {
                dataBind(this, "thead", data);
                return this;
            },

            dataBindFooter: function (data) {
                dataBind(this, "tfoot", data);
                return this;
            },

            addBodyRow: function (item, index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            addHeaderRow: function (item, index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            addFooterRow: function (item, index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            removeBodyRow: function (index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeHeaderRow: function (index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeFooterRow: function (index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeBodyRows: function (index, count) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
            },

            removeHeaderRows: function (index, count) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
            },

            removeFooterRows: function (index, count) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
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
        var sectionElement = W.element.children(section);
        if (sectionElement.length == 0) {
            sectionElement = $(document.createElement(section));
            W.element.append(sectionElement);
        }

        return sectionElement;
    }

    function addRow(W, sectionName, sectionElement, item, index) {
        //If item is null or undefined, continue anyway. We will add an empty row with a special "empty row template".
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
            var trs = sectionElement.children("tr");
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
        var emptyRowTmpl = W.emptyRowTemplate();
        if (tmpl)
            applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item);
    }

    function removeRow(W, sectionElement, index, count) {
        //By default, count = 1
        if (count === null || count === undefined)
            count = 1;

        if (count == 1)
            sectionElement.children("tr").eq(index).remove();
        else if (count > 1)
            sectionElement.children("tr").slice(index, index + count).remove();

        //Update the even/odd state of all rows from "index" on
        if (W.enableEvenOdd())
            updateEvenOdd(index, sectionElement);
    }

    function updateEvenOdd(start, sectionElement) {
        var rows = sectionElement.children("tr");

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

    function applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item) {
        //Remove the existing cells
        tr.empty();

        //Then write the new cells
        if (item) {
            //We have a record
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

            //Keep track of the fact we are NOT using the empty row template
            tr.data("fromEmptyRowTemplate", false);

            //Keep track of the data item (used for the dataItemClick event)
            tr.data("dataItem", item);
        }
        else {
            //We don't have a record. Let's use the empty row template, if any, or the default empty row template
            jpvs.applyTemplate(tr, emptyRowTmpl || createDefaultEmptyRowTemplate(tmpl.length), item);

            //Keep track of the fact we are using the empty row template
            tr.data("fromEmptyRowTemplate", true);
        }
    }

    function createDefaultEmptyRowTemplate(numCols) {
        return function (dataItem) {
            //Since it's an empty row template, we have no data, so we ignore the "dataItem" argument
            //Let's create a single cell that spans the entire row
            var singleTD = jpvs.writeTag(this, "td").attr("colspan", numCols);

            //Loading animated GIF
            jpvs.writeTag(singleTD, "img").attr("src", jpvs.Resources.images.loading);

            //Then let's create an invisible dummy text so the row has the correct height automagically
            jpvs.writeTag(singleTD, "span", ".").css("visibility", "hidden");
        };
    }

    function onRowClicked(grid, tr) {
        var dataItem = $(tr).data("dataItem");
        if (dataItem)
            grid.dataItemClick.fire(grid, null, dataItem);
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
        var preserveCurrentPage = (params && params.preserveCurrentPage);

        var copyOfCurPage = 0;

        function binder(section, data) {
            var W = this;

            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curPage = preserveCurrentPage ? copyOfCurPage : 0;
            copyOfCurPage = curPage;

            //Ensure the pager is present
            var pager = getPager();

            //Refresh the current page
            refreshPage();

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
                copyOfCurPage = curPage;
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
                    pager.totalPages(totPages);
                    pager.page(curPage);
                }
            }
        }

        function getCurrentPage() {
            return copyOfCurPage;
        }

        binder.currentPage = jpvs.property({
            get: getCurrentPage
        });


        return binder;
    };



    /*
    Scrolling binder

    Displays at most one page and allows up/down scrolling
    */
    jpvs.DataGrid.scrollingBinder = function (params) {
        var pageSize = (params && params.pageSize) || 10;
        var chunkSize = (params && params.chunkSize) || (5 * pageSize);
        var forcedWidth = (params && params.width);
        var forcedHeight = (params && params.height);

        function binder(section, data) {
            var W = this;
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curScrollPos = null;

            var cachedData = [];
            var totalRecords = null;

            //In this variables we keep the maximum grid size encountered
            var maxGridWidth = 0;
            var maxGridHeight = 0;

            //Ensure the scroller is present
            var scroller = getScroller();

            //Load the first chunk of data (only the visible page for faster turnaround times)
            jpvs.readDataSource(data, 0, pageSize, onDataLoaded(function () {
                updateGrid(0);

                //After loading and displaying the first page, load some more records in background
                jpvs.readDataSource(data, pageSize, chunkSize, onDataLoaded(updateRows));
            }));

            function ensurePageOfDataLoaded(newScrollPos, next) {
                //Let's make sure we have all the records in memory (at least for the page we have to display)
                var start = newScrollPos;
                var end = start + pageSize;
                var allPresent = true;
                var firstMissingIndex;
                for (var i = start; i < end && i < totalRecords; i++) {
                    var recordPresent = cachedData[i];
                    if (!recordPresent) {
                        allPresent = false;
                        firstMissingIndex = i;
                        break;
                    }
                }

                //If we don't have all records in memory, let's call the datasource
                if (allPresent)
                    next();
                else {
                    //Read from firstMissingIndex up to firstMissingIndex + chunkSize
                    var end = Math.min(firstMissingIndex + chunkSize, totalRecords);
                    var numOfRecsToRead = end - firstMissingIndex;
                    jpvs.readDataSource(data, firstMissingIndex, numOfRecsToRead, onDataLoaded(next));
                }
            }

            function onDataLoaded(next) {
                //This function gets called whenever new records are returned from the data source
                return function (ret) {
                    //Write to cache
                    if (totalRecords === null)
                        totalRecords = ret.total;

                    var start = ret.start;
                    var count = ret.count;

                    //Resize cache if necessary
                    while (cachedData.length < totalRecords)
                        cachedData.push(undefined);

                    //Now write into the array
                    var i = start, j = 0;
                    while (j < count)
                        cachedData[i++] = ret.data[j++];

                    //Call the next function
                    if (next)
                        next();
                };
            }

            function updateGrid(newScrollPos) {
                if (curScrollPos === null) {
                    //First time: write the entire page
                    refreshPage(newScrollPos);
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
            }

            function refreshPage(newScrollPos) {
                //Remove all rows
                sectionElement.empty();

                //Add one page of rows
                var end = Math.min(newScrollPos + pageSize, totalRecords);
                for (var i = newScrollPos; i < end; i++)
                    addRow(W, sectionName, sectionElement, cachedData[i]);

                //Refresh the scroller
                refreshScroller();
            }

            function scrollGrid(newScrollPos, delta) {
                if (delta > 0) {
                    //Scroll forward: remove "delta" lines from the beginning and append "delta" lines at the end
                    W.removeBodyRows(0, delta);

                    var i = newScrollPos + pageSize - delta;
                    var j = 0;
                    while (j++ < delta) {
                        if (i < totalRecords)
                            addRow(W, sectionName, sectionElement, cachedData[i++]);
                    }
                }
                else if (delta < 0) {
                    delta = -delta;

                    //Scroll backwards: remove "delta" lines at the end and insert "delta" lines at the beginning
                    W.removeBodyRows(pageSize - delta, delta);

                    var i = newScrollPos;
                    var j = 0;
                    while (j < delta) {
                        if (i < totalRecords)
                            addRow(W, sectionName, sectionElement, cachedData[i++], j++);
                    }
                }

                //After the move, refresh the scroller
                refreshScroller();
            }

            function updateRows() {
                //Row templates
                var tmpl = W.template();
                var emptyRowTmpl = W.emptyRowTemplate();

                //See what records are displayed
                var visibleRows = sectionElement.children("tr");
                var start = curScrollPos;
                var end = start + visibleRows.length;

                //Update the rows, if we now have the data
                var updatedSomething = false;
                var j = 0;
                for (var i = start; i < end; i++) {
                    var item = cachedData[i];
                    var tr = visibleRows.eq(j++);

                    //Only if the row is empty, substitute the cells with up-to-date values
                    //If the row is not empty, leave it unchanged
                    if (item && tr.data("fromEmptyRowTemplate")) {
                        if (tmpl) {
                            applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item);
                            updatedSomething = true;
                        }
                    }
                }

                //Refresh the scroller
                if (updatedSomething)
                    refreshScroller();
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

                    //Move the DataGrid inside the scroller
                    scroller.content.append(W.element);

                    //Setup the content area so that it's virtually unlimited and causes no text-wrapping or column-shrinking
                    //To do this, we just set it "wide enough"
                    //The height does not matter much, because the real scrolling only occurs horizontally (vertically, we only
                    //simulate scrolling by moving rows in the DataGrid)
                    scroller.contentSize({ width: "1000%", height: "200%" });

                    //Measure the grid
                    measureMaxGridSize();

                    //Set the scroller bounding box size
                    scroller.objectSize({
                        width: maxGridWidth + scroller.scrollbarW,
                        height: maxGridHeight + scroller.scrollbarH
                    });
                }

                //Bind events
                scroller.change.unbind("DataGrid");
                scroller.change.bind("DataGrid", onScrollChange);

                return scroller;
            }

            function onScrollChange() {
                //Current scroll position
                var scrollPos = this.scrollPosition();

                //Horizontal scrolling: connect scroll position to content position directly, so the horizontal scrollbar immediately
                //moves the grid on the horizontal axis
                //Vertical scrolling: don't move content here because we artificially scroll rows in the DataGrid
                var newHorzPos = scrollPos.left;
                var newVertPos = 0;
                this.contentPosition({ top: newVertPos, left: newHorzPos });

                //Now handle the vertical scrolling by artificially moving rows in the DataGrid
                //measureMaxGridSize();
                var maxST = maxGridHeight / pageSize * totalRecords - maxGridHeight;
                var newScrollPos = Math.min(totalRecords, Math.floor(scrollPos.top / maxST * (totalRecords - pageSize + 5)));

                //Update immediately scrolling the rows to "newScrollPos", even if no data is in cache (in that case,
                //the missing records are rendered by the grid's "emptyRowTemplate")
                updateGrid(newScrollPos);

                //Then, call the datasource and update the rows as soon as they arrive from the datasource, without scrolling
                //(because we already did the scrolling in "updateGrid")
                ensurePageOfDataLoaded(newScrollPos, updateRows);
            }

            function measureMaxGridSize() {
                var gridSize = {
                    width: W.element.outerWidth(),
                    height: W.element.outerHeight()
                };

                maxGridHeight = Math.max(maxGridHeight, gridSize.height);
                maxGridWidth = Math.max(maxGridWidth, gridSize.width);
            }

            function refreshScroller() {
                if (!scroller)
                    return;

                //Let's adjust the scrollbars to reflect the content (the DataGrid)
                measureMaxGridSize();
                var totalGridHeight = maxGridHeight / pageSize * totalRecords;

                //The scrollable area is as wide as the grid and as high as the total grid height
                scroller.scrollableSize({ width: maxGridWidth, height: totalGridHeight });

                //Set the scroller bounding box size
                scroller.objectSize({
                    width: forcedWidth || (maxGridWidth + scroller.scrollbarW),
                    height: forcedHeight || (maxGridHeight + scroller.scrollbarH)
                });
            }
        }

        return binder;
    };
})();
