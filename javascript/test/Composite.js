function Composite(selector) {
    this.attach(selector);
}

jpvs.makeWidget({
    widget: Composite,
    type: "Composite",
    cssClass: "Composite",

    create: function (container) {
        var obj = document.createElement("div");
        $(container).append(obj);

        return obj;
    },

    init: function () {
        this.txt = TextBox.create(this.element);
        this.btn = Button.create(this.element);

        this.txt.text("Composite");
        this.btn.text("Comp. button").bind("click", function() { alert("Composite!!!"); });

    }
});


Composite.prototype.text = jpvs.property({
    get: function () { return this.element.val(); },
    set: function (value) { this.element.val(value); }
});

