(function () {

    jpvs.Scheduler = function (selector) {
        this.attach(selector);
    };

    jpvs.Scheduler.allStrings = {
        en: {
            today: "Today",
            day: "Day",
            week: "Week",
            month: "Month",
            agenda: "Agenda"
        },

        it: {
            today: "Oggi",
            day: "Giorno",
            week: "Settimana",
            month: "Mese",
            agenda: "Agenda"
        }
    };

    jpvs.makeWidget({
        widget: jpvs.Scheduler,
        type: "Scheduler",
        cssClass: "Scheduler",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.Scheduler.strings = jpvs.Scheduler.allStrings[jpvs.currentLocale()];

            W.pager = jpvs.writeTag(W, "div").addClass("Pager");

            W.header = jpvs.writeTag(W, "div").addClass("Header").css({
                position: "relative",
                height: "1em"
            });

            W.body = jpvs.writeTag(W, "div").addClass("Body").css({
                position: "relative",
                height: "400px"
            });

            createPagerLayout(W);
            refresh(W);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            mode: jpvs.property({
                get: function () { return this.element.data("mode") || "day"; },
                set: function (value) { this.element.data("mode", value); refresh(this); }
            }),

            date: jpvs.property({
                get: function () { return this.element.data("date") || moment().format("YYYYMMDD"); },
                set: function (value) { this.element.data("date", value); refresh(this); }
            }),

            refresh: function () {
                refresh(this);
            },

            dayItemTemplate: jpvs.property({
                get: function () { return this.element.data("dayItemTemplate") || defaultDayItemTemplate },
                set: function (value) { this.element.data("dayItemTemplate", value); refresh(this); }
            }),

            weekItemTemplate: jpvs.property({
                get: function () { return this.element.data("weekItemTemplate") || defaultWeekItemTemplate },
                set: function (value) { this.element.data("weekItemTemplate", value); refresh(this); }
            }),

            monthItemTemplate: jpvs.property({
                get: function () { return this.element.data("monthItemTemplate") || defaultMonthItemTemplate },
                set: function (value) { this.element.data("monthItemTemplate", value); refresh(this); }
            }),

            agendaItemTemplate: jpvs.property({
                get: function () { return this.element.data("agendaItemTemplate") || defaultAgendaItemTemplate },
                set: function (value) { this.element.data("agendaItemTemplate", value); refresh(this); }
            })
        }
    });

    function str(name) {
        return jpvs.Scheduler.strings[name] || ("Error: " + name);
    }

    function createPagerLayout(W) {
        jpvs.Button.create(W.pager).text(str("today")).click(onToday(W));
        jpvs.Button.create(W.pager).text("<").click(onPrevious(W));
        jpvs.Button.create(W.pager).text(">").click(onNext(W));

        jpvs.writeTag(W.pager, "span", " ").addClass("Spacer");

        W.btnDay = jpvs.Button.create(W.pager).text(str("day")).click(onSetMode(W, "day"));
        W.btnWeek = jpvs.Button.create(W.pager).text(str("week")).click(onSetMode(W, "week"));
        W.btnMonth = jpvs.Button.create(W.pager).text(str("month")).click(onSetMode(W, "month"));
        W.btnAgenda = jpvs.Button.create(W.pager).text(str("agenda")).click(onSetMode(W, "agenda"));
    }

    function onToday(W) {
        return function () {
            W.date(moment().format("YYYYMMDD"));
        };
    }

    function onPrevious(W) {
        return function () {
            //Move the current date based on the current display mode
            var mode = W.mode();
            var date = moment(W.date(), "YYYYMMDD");

            if (mode == "day")
                date.add(-1, "days");
            else if (mode == "week")
                date.add(-7, "days");
            else if (mode == "month")
                date.add(-1, "month");

            W.date(date.format("YYYYMMDD"));
        };
    }

    function onNext(W) {
        return function () {
            //Move the current date based on the current display mode
            var mode = W.mode();
            var date = moment(W.date(), "YYYYMMDD");

            if (mode == "day")
                date.add(+1, "days");
            else if (mode == "week")
                date.add(+7, "days");
            else if (mode == "month")
                date.add(+1, "month");

            W.date(date.format("YYYYMMDD"));
        };
    }

    function onSetMode(W, mode) {
        return function () {
            W.mode(mode);
        };
    }

    function refresh(W) {
        refreshPager(W);
        refreshBody(W);
    }

    function refreshPager(W) {
        //Button states
        jpvs.find(W.pager.find("button")).each(function () {
            this.removeState("Active");
        });

        var mode = W.mode();
        var btn;
        if (mode == "day")
            btn = W.btnDay;
        else if (mode == "week")
            btn = W.btnWeek;
        else if (mode == "month")
            btn = W.btnMonth;
        else if (mode == "agenda")
            btn = W.btnAgenda;

        if (btn)
            btn.addState("Active");
    }

    function refreshBody(W) {
        var func = refreshBodyModes[W.mode()] || function () {
            jpvs.write(W.body, "Invalid mode: " + W.mode());
        };
        func(W);
    }

    var refreshBodyModes = {
        day: function (W) {
            //Load data for the current date only
            var date = W.date();

            readData(date, date, function (list) {
                //Header
                W.header.empty();
                drawCenteredText(W.header, 0, 1, 0, moment(date, "YYYYMMDD").format("dddd - LL"));

                //Body
                W.body.empty();
                W.body.css("overflow-y", "scroll");
                W.body.css("overflow-x", "hidden");
                drawHoursOfTheDay(W.body);

                //Write a rectangle for each scheduled item
                //Use the item template for writing inside
                var template = W.dayItemTemplate();
                for (var i in list) {
                    var item = list[i];
                    var y1 = calcDayY(item.timeFrom);
                    var y2 = calcDayY(item.timeTo);
                    var divItem = drawRect(W.body, 1 / 7, 6 / 7, y1, y2, "", "Item");
                    jpvs.applyTemplate(divItem, template, item);
                }
            });
        },

        week: function (W) {
            //Load data for the current week only
            var date = moment(W.date(), "YYYYMMDD");
            var startOfWeek = moment(date).startOf("week");
            var startDate = startOfWeek.format("YYYYMMDD");
            var endDate = moment(date).endOf("week").format("YYYYMMDD");

            readData(startDate, endDate, function (list) {
                //Header
                W.header.empty();
                W.header.css("overflow-y", "scroll");
                W.header.css("overflow-x", "hidden");
                drawWeekDays_Header(W.header, startOfWeek);

                //Body
                W.body.empty();
                W.body.css("overflow-y", "scroll");
                W.body.css("overflow-x", "hidden");

                //Draw hours and weekdays
                drawWeekDays(W.body, startOfWeek);
                drawHoursOfTheDay(W.body);

                //Write a rectangle for each scheduled item
                //Use the item template for writing inside
                var template = W.weekItemTemplate();
                for (var i in list) {
                    var item = list[i];
                    var y1 = calcDayY(item.timeFrom);
                    var y2 = calcDayY(item.timeTo);
                    var x1 = calcWeekX(item.dateFrom, startOfWeek);
                    var x2 = calcWeekX(item.dateTo, startOfWeek);
                    var divItem = drawRect(W.body, x1 + 0.1 / 7, x2 + 0.9 / 7, y1, y2, "", "Item");
                    jpvs.applyTemplate(divItem, template, item);
                }
            });
        },

        month: function (W) {
            //Load data for the current month only
            var date = moment(W.date(), "YYYYMMDD");
            var startOfMonth = moment(date).startOf("month");
            var startDate = startOfMonth.format("YYYYMMDD");
            var endOfMonth = moment(date).endOf("month");
            var endDate = endOfMonth.format("YYYYMMDD");

            readData(startDate, endDate, function (list) {
                //Header
                W.header.empty();
                W.header.css("overflow-y", "scroll");
                W.header.css("overflow-x", "hidden");
                drawNamesOfWeekDays_Header(W.header);

                //Body
                W.body.empty();
                W.body.css("overflow-y", "scroll");
                W.body.css("overflow-x", "hidden");

                //Draw month days
                var allCoords = drawMonthDays(W.body, startOfMonth, endOfMonth);

                //Write a rectangle for each scheduled item
                //Use the item template for writing inside
                var template = W.monthItemTemplate();
                for (var i in list) {
                    var item = list[i];
                    var coords = allCoords[item.dateFrom];
                    if (coords) {
                        var divItem = allCoords[item.dateFrom].div;
                        jpvs.applyTemplate(divItem, template, item);
                    }
                }
            });
        },

        agenda: function (W) {
            //Load data for the next 90 days only
            var date = moment(W.date(), "YYYYMMDD");
            var startDate = date.format("YYYYMMDD");
            var endDate = moment(date).add(+90, "days").format("YYYYMMDD");

            readData(startDate, endDate, function (list) {
                //No header
                W.header.empty();

                //Body
                W.body.empty();
                W.body.css("overflow-y", "auto");
                W.body.css("overflow-x", "auto");

                //Just list items
                var template = W.agendaItemTemplate();
                for (var i in list) {
                    var item = list[i];
                    jpvs.applyTemplate(W.body, template, item);
                }
            });
        }
    };

    function readData(from, to, callback) {
        callback([
            { dateFrom: moment().format("YYYYMMDD"), dateTo: moment().format("YYYYMMDD"), timeFrom: "0937", timeTo: "1530" },
            { dateFrom: moment().format("YYYYMMDD"), dateTo: moment().format("YYYYMMDD"), timeFrom: "1600", timeTo: "1700" },
            { dateFrom: moment().add(2, "days").format("YYYYMMDD"), dateTo: moment().add(2, "days").format("YYYYMMDD"), timeFrom: "1600", timeTo: "1700" }
        ]);
    }

    var NUM_OF_VISIBLE_HOURS = 10;

    function drawHoursOfTheDay(container) {
        //Write a rectangle for every hour of the day
        for (var hour = 0; hour < 24; hour++) {
            drawRect(container, 0, 1, hour / NUM_OF_VISIBLE_HOURS, (hour + 1) / NUM_OF_VISIBLE_HOURS, hour != 0 ? "T" : "");
            drawRect(container, 0, 1, (hour + 0.5) / NUM_OF_VISIBLE_HOURS, (hour + 1) / NUM_OF_VISIBLE_HOURS, "t");

            var h00 = moment().hours(hour).minutes(0).format("HH:mm");
            var h30 = moment().hours(hour).minutes(30).format("HH:mm");
            drawText(container, 0, hour / NUM_OF_VISIBLE_HOURS, h00);
            drawText(container, 0, (hour + 0.5) / NUM_OF_VISIBLE_HOURS, h30);
        }

        //Scroll to 8:00 am
        container.scrollTop(8 / NUM_OF_VISIBLE_HOURS * container.height());
    }

    function calcDayY(time) {
        var timeAsObj = moment(time, "HHmm");
        var hours = timeAsObj.hours();
        var minutes = timeAsObj.minutes();

        return (hours + minutes / 60) / NUM_OF_VISIBLE_HOURS;
    }

    function drawWeekDays_Header(container, startOfWeek) {
        //Divide in 7 parts
        var date = moment(startOfWeek);
        for (var i = 0; i < 7; i++) {
            drawRect(container, i / 7, (i + 1) / 7, 0, 1, i < 6 ? "R" : "", date.day() == 0 || date.day() == 6 ? "Holiday" : "");
            drawCenteredText(container, i / 7, (i + 1) / 7, 0, date.format("ddd - L"));
            date = date.add(1, "days");
        }
    }

    function drawWeekDays(container, startOfWeek) {
        //Divide in 7 parts
        var date = moment(startOfWeek);
        for (var i = 0; i < 7; i++) {
            drawRect(container, i / 7, (i + 1) / 7, 0, 24 / NUM_OF_VISIBLE_HOURS, i < 6 ? "R" : "", date.day() == 0 || date.day() == 6 ? "Holiday" : "");
            date = date.add(1, "days");
        }
    }

    function calcWeekX(date, startOfWeek) {
        var diffDays = 0;
        var dateAsStr = moment(date).format("YYYYMMDD");
        var startOfWeekAsStr = moment(startOfWeek).format("YYYYMMDD");
        while (moment(dateAsStr, "YYYYMMDD").isAfter(moment(startOfWeekAsStr, "YYYYMMDD"))) {
            diffDays++;
            dateAsStr = moment(dateAsStr, "YYYYMMDD").add(-1, "days").format("YYYYMMDD");
        }
        while (moment(dateAsStr, "YYYYMMDD").isBefore(moment(startOfWeekAsStr, "YYYYMMDD"))) {
            diffDays--;
            dateAsStr = moment(dateAsStr, "YYYYMMDD").add(+1, "days").format("YYYYMMDD");
        }

        return diffDays / 7;
    }

    function drawNamesOfWeekDays_Header(container) {
        //Divide in 7 parts (Mon-Sun)
        var weekdays = moment.weekdays();       //Sunday-Monday-...-Saturday

        //Draw Monday-Saturday
        for (var i = 1; i < 7; i++) {
            drawRect(container, (i - 1) / 7, i / 7, 0, 1, "R", i == 6 ? "Holiday" : "");
            drawCenteredText(container, (i - 1) / 7, i / 7, 0, weekdays[i]);
        }

        //Sunday
        drawRect(container, 6 / 7, 7 / 7, 0, 1, "R", "Holiday");
        drawCenteredText(container, 6 / 7, 7 / 7, 0, weekdays[0]);
    }

    function drawMonthDays(container, startOfMonth, endOfMonth) {
        var date = moment(startOfMonth);
        var dateAsStr = date.format("YYYYMMDD");
        var lineIndex = 0;
        var NROWS = 6;      //Starting week + 4 full weeks + ending week
        var paddingX = 0.05 / 7;
        var paddingY = 0.05 / NROWS;

        var allCoords = {};

        while (!date.isAfter(endOfMonth)) {
            //Draw the appropriate rectangle on lineIndex
            var dayOfWeek = date.day();
            var x = dayOfWeek == 0 ? 6 / 7 : (dayOfWeek - 1) / 7;
            var y = lineIndex / NROWS;

            var coords = {
                x1: x + paddingX,
                x2: x + 1 / 7 - paddingX,
                y1: y + paddingY,
                y2: y + 1 / NROWS - paddingY
            };

            var div = drawRect(container, coords.x1, coords.x2, coords.y1, coords.y2, "RLTB", dayOfWeek == 0 || dayOfWeek == 6 ? "Holiday" : "");

            //Write the day of month
            var dayOfMonth = date.date();
            jpvs.writeTag(div, "h1", dayOfMonth.toString());

            //Let's keep track of all the rectangles' coordinates
            coords.div = div;
            allCoords[date.format("YYYYMMDD")] = coords;

            //Go to next line if it's Sunday
            if (dayOfWeek == 0)
                lineIndex++;

            //Go to next day
            date.add(+1, "days");
        }

        return allCoords;
    }


    //Coordinates are proportional: they go from 0 (left/top) to 1 (right/bottom).
    //(0,0) is the top-left corner; (1,1) is the bottom-right corner
    function drawRect(container, x1, x2, y1, y2, borders, cssClass) {
        var div = jpvs.writeTag(container, "div").css({
            position: "absolute",
            left: (100 * x1) + "%",
            top: (100 * y1) + "%",
            width: (100 * (x2 - x1)) + "%",
            height: (100 * (y2 - y1)) + "%",
            overflow: "hidden"
        });

        div.addClass("Rectangle");

        if (cssClass)
            div.addClass(cssClass);
        if (borders.indexOf("L") >= 0)
            div.css("border-left", "1px solid #000");
        if (borders.indexOf("R") >= 0)
            div.css("border-right", "1px solid #000");
        if (borders.indexOf("T") >= 0)
            div.css("border-top", "1px solid #000");
        if (borders.indexOf("B") >= 0)
            div.css("border-bottom", "1px solid #000");
        if (borders.indexOf("l") >= 0)
            div.css("border-left", "1px dashed #000");
        if (borders.indexOf("r") >= 0)
            div.css("border-right", "1px dashed #000");
        if (borders.indexOf("t") >= 0)
            div.css("border-top", "1px dashed #000");
        if (borders.indexOf("b") >= 0)
            div.css("border-bottom", "1px dashed #000");

        return div;
    }

    function drawText(container, x, y, text) {
        var div = jpvs.writeTag(container, "div").css({
            position: "absolute",
            left: (100 * x) + "%",
            top: (100 * y) + "%",
            "font-size": "8pt"
        });

        jpvs.write(div, text);
    }

    function drawCenteredText(container, x1, x2, y, text) {
        var div = jpvs.writeTag(container, "div").css({
            position: "absolute",
            left: (100 * x1) + "%",
            top: (100 * y) + "%",
            width: (100 * (x2 - x1)) + "%",
            "font-size": "8pt",
            "text-align": "center"
        });

        jpvs.write(div, text);
    }

    function defaultDayItemTemplate(dataItem) {
        var timeFrom = moment(dataItem.timeFrom, "HHmm").format("HH:mm");
        var timeTo = moment(dataItem.timeTo, "HHmm").format("HH:mm");
        jpvs.write(this, timeFrom + " - " + timeTo);
    }

    function defaultWeekItemTemplate(dataItem) {
        var timeFrom = moment(dataItem.timeFrom, "HHmm").format("HH:mm");
        var timeTo = moment(dataItem.timeTo, "HHmm").format("HH:mm");
        jpvs.write(this, timeFrom + " - " + timeTo);
    }

    function defaultMonthItemTemplate(dataItem) {
        var timeFrom = moment(dataItem.timeFrom, "HHmm").format("HH:mm");
        var timeTo = moment(dataItem.timeTo, "HHmm").format("HH:mm");
        jpvs.writeln(this, timeFrom + " - " + timeTo);
    }

    function defaultAgendaItemTemplate(dataItem) {
        var dateFrom = moment(dataItem.dateFrom, "YYYYMMDD").format("L");
        var dateTo = moment(dataItem.dateTo, "YYYYMMDD").format("L");
        var timeFrom = moment(dataItem.timeFrom, "HHmm").format("HH:mm");
        var timeTo = moment(dataItem.timeTo, "HHmm").format("HH:mm");

        if (dateFrom != dateTo)
            jpvs.writeln(this, dateFrom + " " + timeFrom + " - " + dateTo + " " + timeTo);
        else
            jpvs.writeln(this, dateFrom + "\u00a0\u00a0\u00a0\u00a0" + timeFrom + " - " + timeTo);
    }
})();
