jpvs.PasswordBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.PasswordBox,
    type: "PasswordBox",
    cssClass: "PasswordBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "password");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"password\"]");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        }),

        width: jpvs.property({
            get: function () { return this.element.css("width"); },
            set: function (value) { this.element.css("width", value); }
        })
    }
});


