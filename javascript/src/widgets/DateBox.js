/* JPVS
Module: widgets
Classes: DateBox
Depends: core
*/

/* Italian initialisation for the jQuery UI date picker plugin. */
/* Written by Antonello Pasella (antonello.pasella@gmail.com). */
jQuery(function ($) {
    $.datepicker.regional['it'] = {
        closeText: 'Chiudi',
        prevText: '&#x3c;Prec',
        nextText: 'Succ&#x3e;',
        currentText: 'Oggi',
        monthNames: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
			'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
        monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
			'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
        dayNames: ['Domenica', 'Luned&#236', 'Marted&#236', 'Mercoled&#236', 'Gioved&#236', 'Venerd&#236', 'Sabato'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'],
        weekHeader: 'Sm',
        dateFormat: 'dd/mm/yy',
        firstDay: 1,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: ''
    };
});

jpvs.DateBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DateBox,
    type: "DateBox",
    cssClass: "DateBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "text");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.datepicker({
            onSelect: function (dateText, inst) {
                return W.change.fire(W);
            }
        });

        this.element.change(function () {
            return W.change.fire(W);
        });

        this.element.datepicker("option", $.datepicker.regional[jpvs.currentLocale()]);

        this.element.datepicker("hide");
    },

    canAttachTo: function (obj) {
        return false;
    },

    prototype: {
        date: jpvs.property({
            get: function () { return this.element.datepicker("getDate"); },
            set: function (value) { this.element.datepicker("setDate", value); }
        })
    }
});


