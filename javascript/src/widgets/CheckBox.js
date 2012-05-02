/* JPVS
Module: widgets
Classes: CheckBox
Depends: core
*/

jpvs.CheckBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.CheckBox,
    type: "CheckBox",
    cssClass: "CheckBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "checkbox");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        //Route both CLICK and CHANGE to out CHANGE event
        this.element.click(function () {
            return W.change.fire(W);
        });
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"checkbox\"]");
    },

    prototype: {
        checked: jpvs.property({
            get: function () { return this.element.prop("checked"); },
            set: function (value) { this.element.prop("checked", value); }
        }),

        text: jpvs.property({
            get: function () {
                this.ensureId();
                var lbl = $("label[for=\"" + this.id() + "\"]");
                return lbl.text();
            },
            set: function (value) {
                this.ensureId();
                var lbl = $("label[for=\"" + this.id() + "\"]");
                if (lbl.length == 0) {
                    lbl = $(document.createElement("label"));
                    lbl.attr("for", this.id());
                    lbl.insertAfter(this.element);
                }

                lbl.text(value);
            }
        })
    }
});


