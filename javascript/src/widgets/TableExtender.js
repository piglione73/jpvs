(function () {

    var allCellsSelector = "thead > tr > td, thead > tr > th, tbody > tr > th, tbody > tr > td";
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
    }

    Extender.prototype.resizableColumns = jpvs.property({
        get: function () { return !!this._resizableColumns; },
        set: function (value) { this._resizableColumns = !!value; }
    });

    Extender.prototype.persistColumnSizes = jpvs.property({
        get: function () { return !!this._persistColumnSizes; },
        set: function (value) { this._persistColumnSizes = !!value; }
    });

    Extender.prototype.apply = function () {
        //We need table layout fixed, so we can precisely do the layout manually
        setTableLayoutFixed(this.tableElement);

        //Column sizes are persisted?
        if (this.persistColumnSizes())
            loadColSizesFromStorage(this.tableElement);

        if (this.resizableColumns()) {
            //Activate resizable visual cues on vertical grid lines
            activateResizeCursorOnVerticalLines(this.tableElement);

            //Handle cell border dragging
            handleCellBorderDragging(this.tableElement, this.persistColumnSizes());
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

    function activateResizeCursorOnVerticalLines(tbl) {
        tbl.on("mousemove", allCellsSelector, function (e) {
            var cell = $(e.target);
            var cellOffset = cell.offset();
            var relX = e.pageX - cellOffset.left;

            if (isResizingLeftBorder(cell, relX) || isResizingRightBorder(cell, relX))
                cell.css("cursor", "col-resize");
            else
                cell.css("cursor", "auto");
        });

        tbl.on("mouseleave", allCellsSelector, function (e) {
            var cell = $(e.target);
            cell.css("cursor", "auto");
        });
    }

    function setTableLayoutFixed(tbl) {
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

    function handleCellBorderDragging(tbl, persistColumnSizes) {
        var draggingCol;
        var draggingColIndex;
        var originalTableX;
        var originalColWidth;
        var originalSumOfAllColWidths;

        tbl.on("mousedown", allCellsSelector, function (e) {
            var cell = $(e.target);

            //Coordinates, relative to the table
            var tblOffset = tbl.offset();
            var tableX = e.pageX - tblOffset.left;

            //Coordinates, relative to the cell
            var cellOffset = cell.offset();
            var relX = e.pageX - cellOffset.left;

            if (isResizingLeftBorder(cell, relX)) {
                //The cell we are resizing is the previous one
                startResizing(cell.prev(), tableX);
            }
            else if (isResizingRightBorder(cell, relX)) {
                //This is the cell we are resizing
                startResizing(cell, tableX);
            }
        });

        $(window).on("mousemove", function (e) {
            if (draggingCol) {
                //Coordinates, relative to the table
                var tblOffset = tbl.offset();
                var tableX = e.pageX - tblOffset.left;

                //Resize the COL element. Let's set a minimum so the column can be easily restored
                var totalDeltaX = tableX - originalTableX;
                var newColWidth = originalColWidth + totalDeltaX;

                newColWidth = Math.max(newColWidth, 2 * handleToleranceX);

                draggingCol.css("width", newColWidth + "px");

                //Resize the table
                var newTblWidth = originalSumOfAllColWidths - originalColWidth + newColWidth;
                tbl.css("width", newTblWidth + "px");

                //If required, persist column sizes
                if (persistColumnSizes)
                    saveColSizesIntoStorage(tbl, draggingCol, draggingColIndex, newColWidth);
            }
        });

        $(window).on("mouseup", function (e) {
            //End dragging, if active
            draggingCol = null;
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

    function loadColSizesFromStorage(tbl) {
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

    function saveColSizesIntoStorage(tbl, col, colIndex, width) {
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

})();
