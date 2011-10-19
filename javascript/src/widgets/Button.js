jpvs.Button = function (selector) {
    this.attach(selector);
}

jpvs.makeWidget({
    widget: jpvs.Button,
    type: "Button",
    cssClass: "Button",

    create: function (container) {
        var obj = document.createElement("button");
        $(obj).attr("type", "button");
        $(container).append(obj);
        return obj;
    },

    init: function () {
    }
});

jpvs.Button.prototype.text = jpvs.property({
    get: function () { return this.element.text(); },
    set: function (value) { this.element.text(value); }
});

