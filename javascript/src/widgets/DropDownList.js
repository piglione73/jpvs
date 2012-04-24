/* JPVS
Module: widgets
Classes: DropDownList
Depends: core
*/

jpvs.DropDownList = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DropDownList,
    type: "DropDownList",
    cssClass: "DropDownList",

    create: function (container) {
        var obj = document.createElement("select");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("select");
    },

    prototype: {
        clearItems: function () {
            this.element.empty();
            return this;
        },

        addItem: function (value, text) {
            var V = value;
            var T = text != null ? text : value;

            var opt = document.createElement("option");
            $(opt).attr("value", V).text(T).appendTo(this.element);
            return this;
        },

        addItems: function (items) {
            var W = this;
            $.each(items, function (i, item) {
                if (item.value != null)
                    W.addItem(item.value, item.text);
                else
                    W.addItem(item);
            });

            return this;
        },

        count: function () {
            return this.element.find("option").length;
        },

        selectedValue: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        })
    }
});

