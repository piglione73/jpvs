(function () {

    var uniqueNameCounter = 1;
    var handleToleranceX = 5;

    jpvs.TableExtender = {
        create: function (table) {
            //"table" can be an element, a selector or a widget
            var tableElement = jpvs.getElementIfWidget(table);

            return new Extender(tableElement);
        }
    };


    function Extender(tableElement) {
        this.tableElement = tableElement;

        //The unique name is applied as a CSS class name on THEAD and TBODY in order to uniquely identify cells affected by this extender (i.e.:
        //cells in subtables of tableElement must not be affected by this extender). This allows the allCellsSelector to work.
        this.uniqueName = "TableExtender" + (uniqueNameCounter++);
        this.allCellsSelector = ".NAME>tr>th, .NAME>tr>td".replace(/NAME/g, this.uniqueName);
        this.allHeaderCellsSelector = ".NAME>tr>th".replace(/NAME/g, this.uniqueName);

        this.afterResize = new jpvs.Event();
        this.changeFilterSort = new jpvs.Event();
    }

    Extender.prototype.resizableColumns = jpvs.property({
        get: function () { return !!this._resizableColumns; },
        set: function (value) { this._resizableColumns = !!value; }
    });

    Extender.prototype.persistColumnSizes = jpvs.property({
        get: function () { return !!this._persistColumnSizes; },
        set: function (value) { this._persistColumnSizes = !!value; }
    });

    Extender.prototype.enableSorting = jpvs.property({
        get: function () { return !!this._enableSorting; },
        set: function (value) { this._enableSorting = !!value; }
    });

    Extender.prototype.enableFiltering = jpvs.property({
        get: function () { return !!this._enableFiltering; },
        set: function (value) { this._enableFiltering = !!value; }
    });

    Extender.prototype.getSortAndFilterSettings = function () {
        return {
            sort: this.sortSettings,
            filter: this.filterSettings
        };
    };

    Extender.prototype.apply = function () {
        //We need some DataGrid's strings. Let's ensure they are properly initialized based on the current locale
        jpvs.DataGrid.strings = jpvs.DataGrid.allStrings[jpvs.currentLocale()];

        //Apply the CSS class "uniqueName" to THEAD and TBODY, so the allCellsSelector can distinguish cells of this table from cells of subtables
        applyUniqueName(this);

        //We need table layout fixed, so we can precisely do the layout manually
        setTableLayoutFixed(this);

        //Column sizes are persisted?
        if (this.persistColumnSizes())
            loadColSizesFromStorage(this);

        if (this.resizableColumns() && !this.eventsBound_Resizing) {
            //Activate resizable visual cues on vertical grid lines
            activateResizeCursorOnVerticalLines(this);

            //Handle cell border dragging
            handleCellBorderDragging(this);

            //Mark events as bound, so a subsequent call to this method does not bind events again
            this.eventsBound_Resizing = true;
        }

        //Let's activate sorting/filtering, if required
        var sortingOrFiltering = this.enableFiltering() || this.enableSorting();
        if (sortingOrFiltering && !this.eventsBound_FilterSort) {
            //Activate filtering/sorting on TH elements
            activateFilterSort(this);

            //Mark events as bound, so a subsequent call to this method does not bind events again
            this.eventsBound_FilterSort = true;
        }
    };

    function getColSpan(cell) {
        return cell.prop("colspan") || 1;
    }

    function getLeftBorderIndex(cell) {
        //In case we have colspans, sum all colspans up to (and excluding) this cell
        var sumOfAllColspans = 0;
        cell.prevAll().each(function () {
            var cell = $(this);
            sumOfAllColspans += getColSpan(cell);
        });

        return sumOfAllColspans;
    }

    function isResizingLeftBorder(cell, relX) {
        var leftBorderIndex = getLeftBorderIndex(cell);
        return leftBorderIndex > 0 && relX < handleToleranceX;
    }

    function isResizingRightBorder(cell, relX) {
        var cellWidth = cell.outerWidth();
        return cellWidth - relX < handleToleranceX;
    }

    function getColElements(tbl) {
        //Return all COL elements whose parent or grandparent is the table itself
        return tbl.find("col").filter(function () {
            return $(this).parent()[0] === tbl[0] || $(this).parent().parent()[0] === tbl[0];
        });
    }

    function getScrollingContainer(tbl) {
        //Let's find the element's scrolling container (the first ancestor that has overflow: auto/scroll/hidden)
        var scrollingContainer = tbl;
        while (true) {
            scrollingContainer = scrollingContainer.parent();
            var test = scrollingContainer[0].nodeName;
            if (!scrollingContainer || scrollingContainer.length == 0 || scrollingContainer[0].nodeName.toLowerCase() == "body") {
                //We have just climbed up to the body, so we have no scrolling container (we scroll the window)
                scrollingContainer = null;
                break;
            } else {
                var overflow = scrollingContainer.css("overflow");
                if (overflow == "auto" || overflow == "scroll" || overflow == "hidden") {
                    //We have found it
                    break;
                }
            }
        }

        return scrollingContainer || $(window);
    }

    function applyUniqueName(extender) {
        extender.tableElement.children("thead,tbody,tfoot").addClass(extender.uniqueName);
    }

    function activateResizeCursorOnVerticalLines(extender) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        tbl.on("mousemove", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            var cellOffset = cell.offset();
            var relX = e.pageX - cellOffset.left;

            if (isResizingLeftBorder(cell, relX) || isResizingRightBorder(cell, relX))
                cell.addClass("ColumnResize");
            else
                cell.removeClass("ColumnResize");
        });

        tbl.on("mouseleave", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            cell.removeClass("ColumnResize");
        });
    }

    function setTableLayoutFixed(extender) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        //Measure all columns that have colspan = 1
        var colWidths = [];
        tbl.find(allCellsSelector).each(function () {
            var cell = $(this);
            var cellIndex = getLeftBorderIndex(cell);
            var colspan = cell.prop("colspan") || 1;
            var cellWidth = cell.outerWidth();

            if (colspan == 1)
                colWidths[cellIndex] = cellWidth;
        });

        //Set fixed table layout and explicitly set columns widths
        var sumOfAllCols = 0;
        $.each(colWidths, function (i, colWidth) {
            sumOfAllCols += colWidth;
        });

        tbl.css({
            "table-layout": "fixed",
            "width": sumOfAllCols + "px"
        });

        var existingCols = getColElements(tbl);

        $.each(colWidths, function (i, colWidth) {
            //Ensure the i-th COL element exists and has the correct width
            var col = existingCols.eq(i);
            if (!col.length) {
                var colgroup = jpvs.writeTag(tbl, "colgroup");
                col = jpvs.writeTag(colgroup, "col");
            }

            col.css("width", colWidth + "px");
        });

        //Set overflow: hidden on all cells
        tbl.find(allCellsSelector).css("overflow", "hidden");
    }

    function handleCellBorderDragging(extender) {
        var draggingCol;
        var draggingColIndex;
        var originalTableX;
        var originalColWidth;
        var originalSumOfAllColWidths;

        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;
        var scrollingContainer = getScrollingContainer(tbl);
        var lastEventParams;

        tbl.on("mousedown", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);

            //Coordinates, relative to the table
            var tblOffset = tbl.offset();
            var tableX = e.pageX - tblOffset.left;

            //Coordinates, relative to the cell
            var cellOffset = cell.offset();
            var relX = e.pageX - cellOffset.left;

            if (isResizingLeftBorder(cell, relX)) {
                //The cell we are resizing is the previous one
                startResizing(cell.prev(), tableX);

                //Stop propagation: this event has been fully handled now
                return false;
            }
            else if (isResizingRightBorder(cell, relX)) {
                //This is the cell we are resizing
                startResizing(cell, tableX);

                //Stop propagation: this event has been fully handled now
                return false;
            }
        });

        $(document).on("mousemove", function (e) {
            if (draggingCol) {
                //Coordinates, relative to the table
                var tblOffset = tbl.offset();
                var tableX = e.pageX - tblOffset.left;

                //Resize the COL element. Let's set a minimum so the column can be easily restored
                var totalDeltaX = tableX - originalTableX;
                var newColWidth = originalColWidth + totalDeltaX;

                newColWidth = Math.max(newColWidth, 2 * handleToleranceX);

                //Resize the table
                var newTblWidth = originalSumOfAllColWidths - originalColWidth + newColWidth;

                tbl.css("width", newTblWidth + "px");
                draggingCol.css("width", newColWidth + "px");

                //If required, persist column sizes
                if (extender.persistColumnSizes())
                    saveColSizesIntoStorage(extender, draggingCol, draggingColIndex, newColWidth);

                //Fire event
                lastEventParams = {
                    newTableWidth: newTblWidth,
                    columnIndex: draggingColIndex,
                    newColumnWidth: newColWidth,
                    resizing: true
                };

                extender.afterResize.fire(extender, null, lastEventParams);
            }
        });

        $(document).on("mouseup", function (e) {
            //End dragging, if active
            if (draggingCol && lastEventParams) {
                //Fire one last event
                lastEventParams.resizing = false;
                extender.afterResize.fire(extender, null, lastEventParams);
                draggingCol = null;

                //Stop propagation: this event has been fully handled now
                return false;
            }
        });

        function startResizing(cell, tableX) {
            //What COL are we resizing?
            var leftBorderIndex = getLeftBorderIndex(cell);
            var colIndex = leftBorderIndex + getColSpan(cell) - 1;
            var cols = getColElements(tbl);

            draggingCol = cols.eq(colIndex);
            draggingColIndex = colIndex;
            originalTableX = tableX;
            originalColWidth = draggingCol.width();

            originalSumOfAllColWidths = 0;
            cols.each(function () {
                var col = $(this);
                originalSumOfAllColWidths += col.width();
            });

            lastEventParams = null;
        }
    }

    function loadSavedSizesFromStorage(tbl) {
        if (window.localStorage) {
            //Load from localstorage
            var tableName = tbl.data("tableName") || "__GenericTable__";
            var savedObjectAsString = localStorage["jpvs.TableExtenders.Sizes." + tableName];
            var savedObject = savedObjectAsString ? jpvs.parseJSON(savedObjectAsString) : {};
            savedObject = savedObject || {};
            return savedObject;
        }
        else
            return {};
    }

    function loadColSizesFromStorage(extender) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        if (window.localStorage) {
            //Load from localstorage
            var savedObject = loadSavedSizesFromStorage(tbl);

            //Load and apply column sizes
            var sumOfAllCols = 0;
            var cols = getColElements(tbl);
            cols.each(function (colIndex) {
                var col = $(this);
                var colName = col.data("colName") || ("ColIndex" + colIndex);
                var colWidth = savedObject[colName] || col.width();

                col.css("width", colWidth + "px");
                sumOfAllCols += colWidth;
            });

            //Set table width
            tbl.css("width", sumOfAllCols + "px");
        }
    }

    function saveColSizesIntoStorage(extender, col, colIndex, width) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        if (window.localStorage) {
            var cols = getColElements(tbl);

            var savedObject = loadSavedSizesFromStorage(tbl);
            var colName = col.data("colName") || ("ColIndex" + colIndex);

            savedObject[colName] = width;

            var savedObjectAsString = jpvs.toJSON(savedObject);

            //Save into localstorage
            var tableName = tbl.data("tableName") || "__GenericTable__";
            localStorage["jpvs.TableExtenders.Sizes." + tableName] = savedObjectAsString;
        }
    }

    function activateFilterSort(extender) {
        var tbl = extender.tableElement;
        var allHeaderCellsSelector = extender.allHeaderCellsSelector;

        //Handle sorting filtering visual cues
        tbl.on("mousemove", allHeaderCellsSelector, function (e) {
            var cell = $(e.currentTarget);

            if (isFilteringAndOrSorting(extender, cell, e))
                cell.addClass("SortOrFilter");
            else
                cell.removeClass("SortOrFilter");
        });

        tbl.on("mouseleave", allHeaderCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            cell.removeClass("SortOrFilter");
        });

        //Handle sorting/filtering requests
        tbl.on("mousedown", allHeaderCellsSelector, function (e) {
            var cell = $(e.currentTarget);

            if (isFilteringAndOrSorting(extender, cell, e)) {
                openFilterSortPopup(extender, cell);

                //Stop propagation: this event has been fully handled now
                return false;
            }
        });
    }

    function isFilteringAndOrSorting(extender, cell, e) {
        var tbl = extender.tableElement;

        //Coordinates, relative to the cell
        var cellOffset = cell.offset();
        var relX = e.pageX - cellOffset.left;

        //What COL are we filtering/sorting?
        var leftBorderIndex = getLeftBorderIndex(cell);
        var cols = getColElements(tbl);
        var colElement = cols.eq(leftBorderIndex);

        //It's a sorting/filtering only if sorting/filter is enabled AND, based on pointer position, this is not a resize
        //Keep into account whether or not sorting/filtering is disabled for this particular cell
        var isSorting = extender.enableSorting() && isTrueFilterSort(colElement, "colSort");
        var isFiltering = extender.enableFiltering() && isTrueFilterSort(colElement, "colFilter");
        var sortingOrFiltering = isSorting || isFiltering;

        var isNotResizing = !isResizingLeftBorder(cell, relX) && !isResizingRightBorder(cell, relX);
        return sortingOrFiltering && isNotResizing;
    }

    function isTrueFilterSort(colElement, dataAttrName) {
        var dataAttr = colElement.data(dataAttrName);

        //If missing, we assume a default value of true
        if (dataAttr == null)
            return true;
        else if (dataAttr == "true" || dataAttr == true)
            return true;
        else if (dataAttr == "false" || dataAttr == false)
            return false;
        else
            return true;
    }

    function openFilterSortPopup(extender, cell) {
        var tbl = extender.tableElement;

        extender.sortSettings = extender.sortSettings || [];
        extender.filterSettings = extender.filterSettings || [];

        //What COL are we filtering/sorting?
        var leftBorderIndex = getLeftBorderIndex(cell);
        var cols = getColElements(tbl);
        var colElement = cols.eq(leftBorderIndex);

        var isSorting = extender.enableSorting() && isTrueFilterSort(colElement, "colSort");
        var isFiltering = extender.enableFiltering() && isTrueFilterSort(colElement, "colFilter");

        var colName = colElement.data("colName") || leftBorderIndex.toString();
        var colHeader = colElement.data("colHeader") || colName;

        //Open the popup
        var popTitle = "???";
        if (extender.enableSorting() && extender.enableFiltering())
            popTitle = jpvs.DataGrid.strings.titleSortAndFilter;
        else if (extender.enableSorting())
            popTitle = jpvs.DataGrid.strings.titleSort;
        else if (extender.enableFiltering())
            popTitle = jpvs.DataGrid.strings.titleFilter;

        var pop = jpvs.Popup.create().title(popTitle).close(onClosePopup);

        //Section with column details
        jpvs.write(pop, jpvs.DataGrid.strings.currentColumn + ": ");
        jpvs.writeTag(pop, "strong", colHeader);
        jpvs.write(pop, "\u00a0\u00a0\u00a0");

        if (isFiltering)
            jpvs.LinkButton.create(pop).text(jpvs.DataGrid.strings.addFilter).click(onAddFilter);

        jpvs.write(pop, "\u00a0\u00a0\u00a0");

        if (isSorting)
            jpvs.LinkButton.create(pop).text(jpvs.DataGrid.strings.addSort).click(onAddSort);

        jpvs.writeln(pop);

        //Section with filtering info
        var tblFilter;
        if (isFiltering) {
            jpvs.writeTag(pop, "hr");
            tblFilter = jpvs.Table.create(pop);
            writeFilterSettings();
        }

        //Section with sorting info
        var tblSort;
        if (isSorting) {
            jpvs.writeTag(pop, "hr");
            tblSort = jpvs.Table.create(pop);
            writeSortSettings();
        }

        //Finally, show the popup
        pop.show();

        function onAddFilter() {
            extender.filterSettings.push({
                colName: colName,
                operand: "EQ",
                value: ""
            });

            //Refresh
            writeFilterSettings();
        }

        function onAddSort() {
            extender.sortSettings.push({
                colName: colName,
                descending: false
            });

            //Refresh
            writeSortSettings();
        }

        function writeFilterSettings() {
            //Clear and rewrite
            tblFilter.clear();

            if (extender.filterSettings.length) {
                for (var i = 0; i < extender.filterSettings.length; i++) {
                    var item = extender.filterSettings[i];
                    writeFilterSettingsRow(item, i);
                }
            }
            else {
                var row = tblFilter.writeRow();
                jpvs.write(row.writeCell(), jpvs.DataGrid.strings.noFilterSpecified);
            }
        }

        function writeFilterSettingsRow(item, itemIndex) {
            //(field name) COMBO (operand), TEXTBOX (value), Remove button
            var row = tblFilter.writeRow();

            jpvs.write(row.writeCell(), jpvs.DataGrid.strings.condition + ": ");
            jpvs.writeTag(row.writeCell(), "strong", item.colName);

            var cmbOp = jpvs.DropDownList.create(row.writeCell());
            cmbOp.addItem("");
            cmbOp.addItems(jpvs.DataGrid.getFilteringOperands());
            cmbOp.selectedValue(item.operand).change(function () { item.operand = this.selectedValue(); });

            var txtValue = jpvs.TextBox.create(row.writeCell());
            txtValue.text(item.value).change(function () { item.value = this.text(); });

            jpvs.LinkButton.create(row.writeCell()).text(jpvs.DataGrid.strings.remove).click(function () {
                //Remove and refresh
                extender.filterSettings.splice(itemIndex, 1);
                writeFilterSettings();
            });
        }

        function writeSortSettings() {
            //Clear and rewrite
            tblSort.clear();

            if (extender.sortSettings.length) {
                for (var i = 0; i < extender.sortSettings.length; i++) {
                    var item = extender.sortSettings[i];
                    writeSortSettingsRow(item, i);
                }

                //Enable manual reordering of sorting rules
                tblSort.element.find("tbody").sortable({
                    handle: "td:first",
                    update: onSortUpdate
                });
            }
            else {
                var row = tblSort.writeRow();
                jpvs.write(row.writeCell(), jpvs.DataGrid.strings.noSortSpecified);
            }
        }

        function onSortUpdate() {
            //Apply the new ordering
            extender.sortSettings = [];
            tblSort.element.find("tr").each(function () {
                var tr = $(this);
                var item = tr.data("item");
                extender.sortSettings.push(item);
            });

            //Refresh
            writeSortSettings();
        }

        function writeSortSettingsRow(item, itemIndex) {
            //MOVE ICON Order by: (field name) CHECKBOX (descending), Remove button
            var row = tblSort.writeRow();
            row.element.data("item", item);

            jpvs.writeTag(row.writeCell().css("cursor", "move"), "img").attr("src", jpvs.Resources.images.moveButton);
            jpvs.write(row.writeCell(), (itemIndex == 0 ? jpvs.DataGrid.strings.orderBy : jpvs.DataGrid.strings.thenBy) + ": ");
            jpvs.writeTag(row.writeCell(), "strong", item.colName);
            jpvs.CheckBox.create(row.writeCell()).text(jpvs.DataGrid.strings.descending).checked(item.descending).change(function () { item.descending = this.checked(); });

            jpvs.LinkButton.create(row.writeCell()).text(jpvs.DataGrid.strings.remove).click(function () {
                //Remove and refresh
                extender.sortSettings.splice(itemIndex, 1);
                writeSortSettings();
            });
        }

        function onClosePopup() {
            //Fire the event
            extender.changeFilterSort.fire(extender);
        }
    }

})();
