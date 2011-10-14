function TextBox(selector) {
    this.attach(selector);
}

jpvs.makeWidget({
    widget: TextBox,
    type: "TextBox",
    cssClass: "TextBox",

    creator: function (elem) {
        var obj = document.createElement("input");
        $(obj).attr("type", "text");
        $(elem).append(obj);
        return obj;
    }
});


TextBox.prototype.text = jpvs.property({
    get: function () { return this.elem.val(); },
    set: function (value) { this.elem.val(value); }
});

