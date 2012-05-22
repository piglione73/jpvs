/* JPVS
Module: widgets
Classes: DataGrid
Depends: core
*/

(function () {

    jpvs.DataGrid = function (selector) {
        this.attach(selector);

        this.dataItemClick = jpvs.event(this);
        this.changedSortFilter = jpvs.event(this);
    };

    jpvs.DataGrid.allStrings = {
        en: {
            clickToSortAndFilter: "Click here for sorting/filtering options",
            clickToSort: "Click here for sorting options",
            clickToFilter: "Click here for filtering options",

            titleSortAndFilter: "Sorting/filtering options",
            titleSort: "Sorting options",
            titleFilter: "Filtering options",

            ok: "OK",
            cancel: "Cancel",

            orderBy: "Order by",
            thenBy: "Then by",
            descending: "Descending"
        },

        it: {
            clickToSortAndFilter: "Clicca qui per ordinare/filtrare i dati",
            clickToSort: "Clicca qui per ordinare i dati",
            clickToFilter: "Clicca qui per filtrare i dati",

            titleSortAndFilter: "Ordinamento/filtro",
            titleSort: "Ordinamento",
            titleFilter: "Filtro",

            ok: "OK",
            cancel: "Annulla",

            orderBy: "Ordina per",
            thenBy: "Poi per",
            descending: "Ordine inverso"
        }
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
            jpvs.DataGrid.strings = jpvs.DataGrid.allStrings[jpvs.currentLocale()];

            //Attach a click handler to all rows, even those we will add later
            this.element.on("click", "tr", function (e) {
                return onRowClicked(W, e.currentTarget);
            });

            //Attach a hovering effect on the header row, for handling sorting/filtering
            this.element.on("mouseenter", "thead > tr", function (e) {
                onHeaderRowMouseOver(W, e.currentTarget);
            });
            this.element.on("mouseleave", "thead > tr", function (e) {
                onHeaderRowMouseOut(W, e.currentTarget);
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

            enableSorting: jpvs.property({
                get: function () {
                    var val = this.element.data("enableSorting");
                    if (val === true || val === false)
                        return val;
                    else
                        return false;    //Default value
                },
                set: function (value) { this.element.data("enableSorting", value); }
            }),

            enableFiltering: jpvs.property({
                get: function () {
                    var val = this.element.data("enableFiltering");
                    if (val === true || val === false)
                        return val;
                    else
                        return false;    //Default value
                },
                set: function (value) { this.element.data("enableFiltering", value); }
            }),

            //This is used for filling the "order by" combos in the "Sorting options" popup
            sortExpressions: jpvs.property({
                get: function () {
                    var val = this.element.data("sortExpressions");
                    if (!val) {
                        //If not initialized, attempt to determine a list of expressions (the header texts)
                        val = [];
                        this.element.find("thead > tr > th").each(function () {
                            var txt = $(this).text();
                            val.push({ value: txt, text: txt });
                        });
                    }

                    return val;
                },
                set: function (value) {
                    this.element.data("sortExpressions", value);
                }
            }),

            currentSortExpression: jpvs.property({
                get: function () {
                    return this.element.data("currentSortExpression");
                },
                set: function (value) {
                    this.element.data("currentSortExpression", value);
                }
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
            return grid.dataItemClick.fire(grid, null, dataItem);
    }

    function onHeaderRowMouseOver(grid, tr) {
        //If neither sorting nor filtering are enabled, no hovering effect
        var enableSorting = grid.enableSorting();
        var enableFiltering = grid.enableFiltering();
        if (!enableSorting && !enableFiltering)
            return;

        var tooltip = "";
        if (enableSorting && enableFiltering)
            tooltip = jpvs.DataGrid.strings.clickToSortAndFilter;
        else if (enableSorting)
            tooltip = jpvs.DataGrid.strings.clickToSort;
        else if (enableFiltering)
            tooltip = jpvs.DataGrid.strings.clickToFilter;

        //Otherwise, let's give visual cues so the user can sort/filter
        //Let's add an unobtrusive button to each cell, unless the buttons are already displayed
        var buttons = $(tr).data("jpvsColButtons") || [];
        if (buttons.length == 0) {
            $(tr).find("td,th").each(function (index) {
                //Measure the cell
                var cell = $(this);
                var pos = cell.position();
                var x = pos.left;
                var y = pos.top;
                var w = cell.innerWidth();
                var h = cell.outerHeight();

                var imgTop = y;
                var imgLeft = x + w;

                var img = jpvs.ImageButton.create(cell).imageUrls({
                    normal: jpvs.Resources.images.dataGridColumnButton,
                    hover: jpvs.Resources.images.dataGridColumnButtonHover
                });

                imgLeft -= img.element.width();

                img.element.css({
                    position: "absolute",
                    left: imgLeft + "px",
                    top: imgTop + "px"
                }).attr("title", tooltip);

                img.click(onHeaderButtonClickFunc(grid, index));

                buttons.push(img);
            });

            //Keep track of the buttons
            $(tr).data("jpvsColButtons", buttons);
        }
    }

    function onHeaderRowMouseOut(grid, tr) {
        //Let's make the buttons disappear
        var buttons = $(tr).data("jpvsColButtons");
        if (buttons) {
            setTimeout(function () {
                $.each(buttons, function (i, button) {
                    button.destroy();
                });
            }, 5000);
        }
        $(tr).data("jpvsColButtons", null);
    }

    function onHeaderButtonClickFunc(grid, colIndex) {
        return function () {
            onHeaderButtonClick(grid, colIndex);
        };
    }

    function onHeaderButtonClick(grid, colIndex) {
        var enableSorting = grid.enableSorting();
        var enableFiltering = grid.enableFiltering();
        if (!enableSorting && !enableFiltering)
            return;

        var title = "";
        if (enableSorting && enableFiltering)
            title = jpvs.DataGrid.strings.titleSortAndFilter;
        else if (enableSorting)
            title = jpvs.DataGrid.strings.titleSort;
        else if (enableFiltering)
            title = jpvs.DataGrid.strings.titleFilter;

        //Open a popup with sorting/filtering options
        var pop = jpvs.Popup.create().title(title).show();

        var bothEnabled = enableSorting && enableFiltering;

        //If both are enabled, group fields together for clarity
        var pnlSort = pop;
        var pnlFilter = pop;
        if (bothEnabled) {
            pnlSort = jpvs.writeTag(pop, "fieldset");
            pnlFilter = jpvs.writeTag(pop, "fieldset");

            jpvs.writeTag(pnlSort, "legend", jpvs.DataGrid.strings.titleSort);
            jpvs.writeTag(pnlFilter, "legend", jpvs.DataGrid.strings.titleFilter);
        }

        //Sorting panel
        var sortControls = [];
        if (enableSorting) {
            var tblSort = jpvs.Table.create(pnlSort);

            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.orderBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));

            //Set the combos to the current sort expression, if any, otherwise set only the first combo to the "colIndex" (the
            //clicked column)
            var sortExpr = grid.currentSortExpression();
            if (!sortExpr) {
                var allExprs = grid.sortExpressions();
                var colIndexName = allExprs && allExprs[colIndex] && allExprs[colIndex].value;
                if (colIndexName)
                    sortExpr = [{ name: colIndexName}];
                else
                    sortExpr = [];
            }

            //Set the combos to "sortExpr"
            for (var i = 0; i < sortControls.length; i++)
                setSortingRowValue(sortControls[i], sortExpr[i]);
        }

        //Filtering panel
        if (enableFiltering) {
            jpvs.write(pnlFilter, "TODO: Filter");
        }

        //Finally, button bar and close button
        jpvs.writeButtonBar(pop, [
            { text: jpvs.DataGrid.strings.ok, click: onOK },
            { text: jpvs.DataGrid.strings.cancel, click: onCancel }
        ]);
        pop.close(onCancel);

        //Events
        function onCancel() {
            pop.destroy();
        }

        function onOK() {
            //Save settings
            if (enableSorting) {
                //Save the sorting settings
                var sortExpr = [];
                for (var i = 0; i < sortControls.length; i++) {
                    var cmb = sortControls[i].cmbSort;
                    var chk = sortControls[i].chkDesc;

                    var name = cmb.selectedValue();
                    var desc = chk.checked();
                    if (name && name != "") {
                        sortExpr.push({ name: name, descending: desc });
                    }
                }

                grid.currentSortExpression(sortExpr);
            }

            //Finally, close the popup and fire event that sort/filter has just changed, so that binders
            //can take appropriate action (refresh grid/page)
            grid.changedSortFilter.fire(grid);
            pop.destroy();
        }

        //Utilities
        function writeSortingRow(tblSort, caption) {
            //Order by: COMBO (field name) CHECKBOX (ascending/descending)
            var row = tblSort.writeRow();
            row.writeCell(caption + ": ");
            var cmbSort = jpvs.DropDownList.create(row.writeCell());
            var chkDesc = jpvs.CheckBox.create(row.writeCell());
            chkDesc.text(jpvs.DataGrid.strings.descending);

            //Fill the combo with the header names
            cmbSort.addItem("");
            cmbSort.addItems(grid.sortExpressions());

            return { cmbSort: cmbSort, chkDesc: chkDesc };
        }

        function setSortingRowValue(sortControl, sortPred) {
            if (sortPred) {
                sortControl.cmbSort.selectedValue(sortPred.name);
                sortControl.chkDesc.checked(sortPred.descending);
            }
        }

    }


    function getDataSourceOptions(W) {
        //Returns sorting/filtering options, as needed by the call to jpvs.readDataSource
        return {
            sortExpression: W.currentSortExpression()
        };
    }

    /*
    Default binder

    Displays all rows in the datasource
    */
    jpvs.DataGrid.defaultBinder = function (section, data) {
        var W = this;

        //Refresh the grid now...
        refresh();

        //...and whenever sorting/filtering options are changed by the user
        W.changedSortFilter.unbind("binder");
        W.changedSortFilter.bind("binder", refresh);

        function refresh() {
            //Remove all rows
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            //Read the entire data set...
            jpvs.readDataSource(data, null, null, getDataSourceOptions(W), next);

            //...and bind all the rows
            function next(ret) {
                sectionElement.empty();
                $.each(ret.data, function (i, item) {
                    addRow(W, sectionName, sectionElement, item);
                });
            }
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

            //Whenever the user changes sorting/filtering, refresh the current page
            W.changedSortFilter.unbind("binder");
            W.changedSortFilter.bind("binder", refreshPage);

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
                jpvs.readDataSource(data, start, pageSize, getDataSourceOptions(W), next);

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
            jpvs.readDataSource(data, 0, pageSize, getDataSourceOptions(W), onDataLoaded(function () {
                updateGrid(0);

                //After loading and displaying the first page, load some more records in background
                jpvs.readDataSource(data, pageSize, chunkSize, getDataSourceOptions(W), onDataLoaded(updateRows));
            }));

            //When sort/filter is changed, reload and empty the cache
            W.changedSortFilter.unbind("binder");
            W.changedSortFilter.bind("binder", function () {
                cachedData = [];
                totalRecords = null;

                jpvs.readDataSource(data, 0, pageSize, getDataSourceOptions(W), onDataLoaded(function () {
                    updateGrid(0);

                    //After loading and displaying the first page, load some more records in background
                    jpvs.readDataSource(data, pageSize, chunkSize, getDataSourceOptions(W), onDataLoaded(updateRows));
                }));
            });

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
                    jpvs.readDataSource(data, firstMissingIndex, numOfRecsToRead, getDataSourceOptions(W), onDataLoaded(next));
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
