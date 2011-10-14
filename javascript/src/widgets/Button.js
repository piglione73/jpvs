function Button(selector) {
    this.attach(selector);
}

jpvs.makeWidget({
    widget: Button,
    type: "Button",
    cssClass: "Button",

    creator: function (elem) {
        var obj = document.createElement("button");
        $(obj).attr("type", "button");
        $(elem).append(obj);
        return obj;
    }
});

Button.prototype.text = jpvs.property({
    get: function () { return this.elem.text(); },
    set: function (value) { this.elem.text(value); }
});

