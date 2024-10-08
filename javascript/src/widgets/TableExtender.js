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
        this.floatingHeaderClone = null;

        //The unique name is applied as a CSS class name on THEAD and TBODY in order to uniquely identify cells affected by this extender (i.e.:
        //cells in subtables of tableElement must not be affected by this extender). This allows the allCellsSelector to work.
        this.uniqueName = "TableExtender" + (uniqueNameCounter++);
        this.allCellsSelector = ".NAME>tr>th, .NAME>tr>td".replace(/NAME/g, this.uniqueName);
        this.allHeaderCellsSelector = ".NAME>tr>th".replace(/NAME/g, this.uniqueName);

        this.defaultColWidths = {};

        this.afterResize = new jpvs.Event();
        this.changeFilterSort = new jpvs.Event();
    }

    Extender.prototype.defaultColWidth = function (colIndex, pixelWidth) {
        this.defaultColWidths[colIndex] = pixelWidth;
        return this;
    };

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

    Extender.prototype.persistSortSettings = jpvs.property({
        get: function () { return !!this._persistSortSettings; },
        set: function (value) { this._persistSortSettings = !!value; }
    });

    Extender.prototype.persistFilterSettings = jpvs.property({
        get: function () { return !!this._persistFilterSettings; },
        set: function (value) { this._persistFilterSettings = !!value; }
    });

    Extender.prototype.getSortAndFilterSettings = function () {
        return {
            sort: this.sortSettings,
            filter: this.filterSettings
        };
    };

    Extender.prototype.clearSortAndFilterSettings = function () {
        //Reset filter/sort settings
        this.sortSettings = [];
        this.filterSettings = [];
    };

    Extender.prototype.tableHeaderAlwaysVisible = jpvs.property({
        get: function () { return !!this._tableHeaderAlwaysVisible; },
        set: function (value) { this._tableHeaderAlwaysVisible = !!value; }
    });

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

        //Let's activate the table header fixing, if required
        if (this.tableHeaderAlwaysVisible())
            createFloatingHeaderClone(this);

        if (this.resizableColumns()) {
            //Activate resizable visual cues on vertical grid lines
            activateResizeCursorOnVerticalLines(this);

            //Handle cell border dragging
            handleCellBorderDragging(this);
        }

        //Let's activate sorting/filtering, if required
        var sortingOrFiltering = this.enableFiltering() || this.enableSorting();
        if (sortingOrFiltering) {
            //Activate filtering/sorting on TH elements
            activateFilterSort(this);
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

        //Same visual cues on the floating header clone, if present
        if (extender.floatingHeaderClone)
            tbl = tbl.add(extender.floatingHeaderClone);

        tbl.off("mousemove.jpvsTableExtender1").on("mousemove.jpvsTableExtender1", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            var cellOffset = cell.offset();
            var relX = e.pageX - cellOffset.left;

            if (isResizingLeftBorder(cell, relX) || isResizingRightBorder(cell, relX))
                cell.addClass("ColumnResize");
            else
                cell.removeClass("ColumnResize");
        });

        tbl.off("mouseleave.jpvsTableExtender1").on("mouseleave.jpvsTableExtender1", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            cell.removeClass("ColumnResize");
        });
    }

    function setTableLayoutFixed(extender) {
        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;

        //Before measuring/remeasuring columns, let's set table width "auto", so we don't have forced column scaling
        tbl.css("width", "auto");

        //Measure all columns that have colspan = 1
        var colWidths = [];
        tbl.find(allCellsSelector).each(function () {
            var cell = $(this);
            var cellIndex = getLeftBorderIndex(cell);
            var colspan = cell.prop("colspan") || 1;
            var cellWidth = cell.outerWidth();

            //If a default/starting width is defined, then use that one instead of the one measured
            if (extender.defaultColWidths[cellIndex])
                cellWidth = extender.defaultColWidths[cellIndex];

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

    function quickGetWidth(element) {
        //Avoid the jQuery width() function, which is painfully slow because it has to take the content box model
        //into account.
        //If the width is set in CSS in px, then this function performs much faster
        return parseFloat(element.style.width);
    }

    function handleCellBorderDragging(extender) {
        var draggingCol;
        var draggingCol_FH;         //Matching COL in the fixed floating header, if any
        var draggingColIndex;
        var originalTableX;
        var originalColWidth;
        var originalSumOfAllColWidths;

        var newColWidth;

        var tbl = extender.tableElement;
        var allCellsSelector = extender.allCellsSelector;
        var scrollingContainer = getScrollingContainer(tbl);
        var lastEventParams;

        //Same behavior on the floating header clone, if present
        if (extender.floatingHeaderClone)
            tbl = tbl.add(extender.floatingHeaderClone);

        tbl.off("mousedown.jpvsTableExtender2").on("mousedown.jpvsTableExtender2", allCellsSelector, function (e) {
            var cell = $(e.currentTarget);

            //Coordinates, relative to the table
            //We use tbl.eq(0) because "tbl" might contain either tableElement or tableElement+floatingHeaderClone
            var tblOffset = tbl.eq(0).offset();
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

        $(document).off("mousemove.jpvsTableExtender2" + extender.uniqueName).on("mousemove.jpvsTableExtender2" + extender.uniqueName, function (e) {
            if (draggingCol) {
                //Coordinates, relative to the table
                //We use tbl.eq(0) because "tbl" might contain either tableElement or tableElement+floatingHeaderClone
                var tblOffset = tbl.eq(0).offset();
                var tableX = e.pageX - tblOffset.left;

                //Resize the COL element. Let's set a minimum so the column can be easily restored
                var totalDeltaX = tableX - originalTableX;
                newColWidth = Math.max(originalColWidth + totalDeltaX, 2 * handleToleranceX);

                //Only apply the new col width as a visual cue, not as the real col width, so we avoid wasting
                //CPU resources on lengthy table relayouting
                applyNewColWidth(false, e);
            }
        });

        $(document).off("mouseup.jpvsTableExtender2" + extender.uniqueName).on("mouseup.jpvsTableExtender2" + extender.uniqueName, function (e) {
            //End dragging, if active
            if (draggingCol) {
                //Apply the new col width
                applyNewColWidth(true, e);

                if (lastEventParams) {
                    //Fire one last event
                    lastEventParams.resizing = false;
                    extender.afterResize.fire(extender, null, lastEventParams);
                    draggingCol = null;
                    draggingCol_FH = null;

                    //Stop propagation: this event has been fully handled now
                    return false;
                }
            }
        });

        function startResizing(cell, tableX) {
            //What COL are we resizing?
            var leftBorderIndex = getLeftBorderIndex(cell);
            var colIndex = leftBorderIndex + getColSpan(cell) - 1;
            var cols = getColElements(tbl);
            var cols_FH = extender.floatingHeaderClone && getColElements(extender.floatingHeaderClone);

            draggingCol = cols.eq(colIndex);
            draggingCol_FH = cols_FH.eq(colIndex);
            draggingColIndex = colIndex;
            originalTableX = tableX;
            originalColWidth = quickGetWidth(draggingCol[0]);
            newColWidth = originalColWidth;

            originalSumOfAllColWidths = 0;
            cols.each(function () {
                originalSumOfAllColWidths += quickGetWidth(this);
            });

            lastEventParams = null;
        }

        function applyNewColWidth(reallyVisuallyApply, e) {
            //Resize the table
            var newTblWidth = originalSumOfAllColWidths - originalColWidth + newColWidth;

            if (reallyVisuallyApply) {
                tbl.css("width", newTblWidth + "px");
                draggingCol.css("width", newColWidth + "px");
                draggingCol_FH.css("width", newColWidth + "px");

                //Delete the visual cue, if present
                if (extender.verticalResizingCue) {
                    extender.verticalResizingCue.remove();
                    extender.verticalResizingCue = null;
                }
            }
            else {
                //Use a visual cue (a vertical line)
                if (!extender.verticalResizingCue) {
                    extender.verticalResizingCue = jpvs.writeTag("body", "div").css({
                        position: "absolute",
                        height: tbl.height() + "px",
                        width: "0px",
                        top: tbl.offset().top + "px",
                        "border-right": "1px dotted #f00"
                    });
                }

                extender.verticalResizingCue.css("left", e.pageX + "px");
            }

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

    function loadSortAndFilterSettingsFromStorage(extender) {
        var tbl = extender.tableElement;
        var tableName = tbl.data("tableName") || "__GenericTable__";

        if (window.localStorage) {
            if (extender.persistSortSettings())
                extender.sortSettings = jpvs.parseJSON(localStorage["jpvs.TableExtenders.Sorts." + tableName] || "[]");
            if (extender.persistFilterSettings())
                extender.filterSettings = jpvs.parseJSON(localStorage["jpvs.TableExtenders.Filters." + tableName] || "[]");
        }
    }

    function saveSortAndFilterSettingsIntoStorage(extender) {
        var tbl = extender.tableElement;
        var tableName = tbl.data("tableName") || "__GenericTable__";

        if (window.localStorage) {
            if (extender.persistSortSettings())
                localStorage["jpvs.TableExtenders.Sorts." + tableName] = jpvs.toJSON(extender.sortSettings || []);
            if (extender.persistFilterSettings())
                localStorage["jpvs.TableExtenders.Filters." + tableName] = jpvs.toJSON(extender.filterSettings || []);
        }
    }

    //Set "Sorted" and/or "Filtered" class on TH's that have sort/filter set on them
    function updateSortedFilteredCues(extender) {
        var tbl = extender.tableElement;
        var allHeaderCellsSelector = extender.allHeaderCellsSelector;

        //Same behavior on the floating header clone, if present
        if (extender.floatingHeaderClone)
            tbl = tbl.add(extender.floatingHeaderClone);

        extender.sortSettings = extender.sortSettings || [];
        extender.filterSettings = extender.filterSettings || [];

        var isSorting = {};
        for (var i in extender.sortSettings)
            isSorting[extender.sortSettings[i].colName] = true;

        var isFiltering = {};
        for (var i in extender.filterSettings)
            isFiltering[extender.filterSettings[i].colName] = true;

        //Loop over all TH's and decide what classes to apply
        $(allHeaderCellsSelector).each(function () {
            var cell = $(this);
            var leftBorderIndex = getLeftBorderIndex(cell);
            var cols = getColElements(tbl);
            var colElement = cols.eq(leftBorderIndex);
            var colName = colElement.data("colName") || leftBorderIndex.toString();

            cell.removeClass("Sorted").removeClass("Filtered");
            if (isSorting[colName])
                cell.addClass("Sorted");
            if (isFiltering[colName])
                cell.addClass("Filtered");
        });
    }

    function activateFilterSort(extender) {
        var tbl = extender.tableElement;
        var allHeaderCellsSelector = extender.allHeaderCellsSelector;

        //Same behavior on the floating header clone, if present
        if (extender.floatingHeaderClone)
            tbl = tbl.add(extender.floatingHeaderClone);

        //If persisted, load sorting/filtering settings from local storage
        loadSortAndFilterSettingsFromStorage(extender);

        //Handle sorting/filtering visual cues
        //Set "Sorted" and/or "Filtered" class on TH's that have sort/filter set on them
        updateSortedFilteredCues(extender);

        //Set "SortOrFilter" class on mouse hover, to convey that that column can be filtered/sorted
        tbl.off("mousemove.jpvsTableExtender3").on("mousemove.jpvsTableExtender3", allHeaderCellsSelector, function (e) {
            var cell = $(e.currentTarget);

            if (isFilteringAndOrSorting(extender, cell, e))
                cell.addClass("SortOrFilter");
            else
                cell.removeClass("SortOrFilter");
        });

        tbl.off("mouseleave.jpvsTableExtender3").on("mouseleave.jpvsTableExtender3", allHeaderCellsSelector, function (e) {
            var cell = $(e.currentTarget);
            cell.removeClass("SortOrFilter");
        });

        //Handle sorting/filtering requests
        tbl.off("mousedown.jpvsTableExtender3").on("mousedown.jpvsTableExtender3", allHeaderCellsSelector, function (e) {
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
        var colType = colElement.data("colType") || "text";

        //Open the popup
        var popTitle = "???";
        if (extender.enableSorting() && extender.enableFiltering())
            popTitle = jpvs.DataGrid.strings.titleSortAndFilter;
        else if (extender.enableSorting())
            popTitle = jpvs.DataGrid.strings.titleSort;
        else if (extender.enableFiltering())
            popTitle = jpvs.DataGrid.strings.titleFilter;

        var pop = jpvs.Popup.create().title(popTitle).close(fireEventAndUpdateCues);

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
                colType: colType,
                colHeader: colHeader,
                operand: "EQ",
                value: ""
            });

            //Refresh
            writeFilterSettings();
        }

        function onAddSort() {
            extender.sortSettings.push({
                colName: colName,
                colType: colType,
                colHeader: colHeader,
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
            //(field name) COMBO (operand), TEXTBOX/DATEBOX (value), Remove button
            var row = tblFilter.writeRow();

            jpvs.write(row.writeCell(), jpvs.DataGrid.strings.condition + ": ");
            jpvs.writeTag(row.writeCell(), "strong", item.colHeader);

            var cmbOp = jpvs.DropDownList.create(row.writeCell());
            cmbOp.addItem("");

            //If the colType is "date", only some operands are allowed
            var isDate = (item.colType || "text").toLowerCase() == "date"
            var filteringOperands = jpvs.DataGrid.getFilteringOperands();
            for (var i in filteringOperands) {
                var filteringOperand = filteringOperands[i];
                var operandAllowed = true;
                if (isDate) {
                    if (filteringOperand.value.indexOf("CONTAINS") >= 0 || filteringOperand.value.indexOf("START") >= 0)
                        operandAllowed = false;
                }

                if (operandAllowed)
                    cmbOp.addItem(filteringOperand.value, filteringOperand.text);
            }

            cmbOp.selectedValue(item.operand).change(function () { item.operand = this.selectedValue(); });

            //Value (DATEBOX yyyymmdd or TEXTBOX)
            if (isDate) {
                jpvs.DateBox.create(row.writeCell()).dateString(item.value || null).change(function () {
                    item.value = this.dateString() || "";
                });
            }
            else {
                jpvs.TextBox.create(row.writeCell()).text(item.value || "").change(function () {
                    item.value = this.text() || "";
                });
            }

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
            jpvs.writeTag(row.writeCell(), "strong", item.colHeader);
            jpvs.CheckBox.create(row.writeCell()).text(jpvs.DataGrid.strings.descending).checked(item.descending).change(function () { item.descending = this.checked(); });

            jpvs.LinkButton.create(row.writeCell()).text(jpvs.DataGrid.strings.remove).click(function () {
                //Remove and refresh
                extender.sortSettings.splice(itemIndex, 1);
                writeSortSettings();
            });
        }

        function fireEventAndUpdateCues() {
            //Update visual cues
            updateSortedFilteredCues(extender);

            //Save, if required
            saveSortAndFilterSettingsIntoStorage(extender);

            //Fire the event
            extender.changeFilterSort.fire(extender);
        }
    }

    function createFloatingHeaderClone(extender) {
        //My scrolling container, if any. $(window) otherwise.
        var scrollingContainer = getScrollingContainer(extender.tableElement);

        //Set position: relative if not already absolutely positioned
        //We do this only if we have a nodeName (i.e.: if it is not the $(window) object)
        if (scrollingContainer[0].nodeName) {
            var scrollingContainerPosition = scrollingContainer.css("position");
            if (scrollingContainerPosition != "absolute" && scrollingContainerPosition != "relative" && scrollingContainerPosition != "fixed")
                scrollingContainer.css("position", "relative");
        }

        //Destroy and recreate the floating header clone
        if (extender.floatingHeaderClone)
            extender.floatingHeaderClone.remove();

        //Then clone the TABLE with its THEAD and its COL's
        extender.floatingHeaderClone = extender.tableElement.clone(true);
        extender.floatingHeaderClone.children("tbody, tfoot, caption").remove();
        extender.floatingHeaderClone.insertAfter(extender.tableElement);

        //Respond to scrolling events from the scrolling container
        scrollingContainer.off("scroll.jpvsTableExtender4");
        scrollingContainer.on("scroll.jpvsTableExtender4", refreshFloatingHeaderVisibility);

        //Border sizes
        var isWindow = scrollingContainer[0].jpvs;
        var borderLeftSize = isWindow ? 0 : parseInt(scrollingContainer.css("border-left-width"), 10);
        var borderTopSize = isWindow ? 0 : parseInt(scrollingContainer.css("border-top-width"), 10);

        refreshFloatingHeaderVisibility();

        function refreshFloatingHeaderVisibility() {
            //Top-left of the scrolling container. 
            //If it is the $(window) itself, then the top-left of the visible area
            var scXY = scrollingContainer.offset() || { left: scrollingContainer.scrollLeft(), top: scrollingContainer.scrollTop() };

            //Top-left of the internal contents of the scrolling container
            var scXY_WithScroll = {
                left: scXY.left - scrollingContainer.scrollLeft(),
                top: scXY.top - scrollingContainer.scrollTop()
            };

            //Top-left of the table
            var tblXY = extender.tableElement.offset();

            //Coordinates relative to the scrolling container contents (accounting for scroll)
            var tableX = tblXY.left - scXY_WithScroll.left;
            var tableY = tblXY.top - scXY_WithScroll.top;

            //If the header is partially/fully out of sight (vertically), then we show the floatingHeaderClone on top
            //Otherwise, we hide the floatingHeaderClone
            if (scrollingContainer.scrollTop() > tableY) {
                extender.floatingHeaderClone.show().css({
                    position: "absolute",
                    left: (tableX - borderLeftSize) + "px",
                    top: (scrollingContainer.scrollTop() - borderTopSize) + "px",
                    margin: "0px"
                });
            }
            else
                extender.floatingHeaderClone.hide();
        }
    }

})();
