jpvs.Composite = function (selector) {
    this.attach(selector);

    this.customEvent = jpvs.event(this);
}

jpvs.makeWidget({
    widget: jpvs.Composite,
    type: "Composite",
    cssClass: "Composite",

    create: function (container) {
        var obj = document.createElement("div");
        $(container).append(obj);

        return obj;
    },

    init: function () {
        var W = this;

        this.txt = jpvs.TextBox.create(this.element);
        this.btn = jpvs.Button.create(this.element);

        this.txt.text("Composite");
        this.btn.text("Comp. button").element.bind("click", function () { W.customEvent.fire(W); });

    }
});


jpvs.Composite.prototype.text = jpvs.property({
    get: function () { return this.element.val(); },
    set: function (value) { this.element.val(value); }
});

