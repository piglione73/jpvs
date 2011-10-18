function TextBox(selector) {
    this.attach(selector);
}

jpvs.makeWidget({
    widget: TextBox,
    type: "TextBox",
    cssClass: "TextBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "text");
        $(container).append(obj);
        return obj;
    },

    init: function () {
    }
});


TextBox.prototype.text = jpvs.property({
    get: function () { return this.element.val(); },
    set: function (value) { this.element.val(value); }
});

