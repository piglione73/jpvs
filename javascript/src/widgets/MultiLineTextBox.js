jpvs.MultiLineTextBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiLineTextBox,
    type: "MultiLineTextBox",
    cssClass: "MultiLineTextBox",

    create: function (container) {
        var obj = document.createElement("textarea");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("textarea");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        })
    }
});


