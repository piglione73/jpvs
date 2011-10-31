/* JPVS
Module: widgets
Classes: LinkButton
Depends: core
*/

jpvs.LinkButton = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.LinkButton,
    type: "LinkButton",
    cssClass: "LinkButton",

    create: function (container) {
        var obj = document.createElement("a");
        $(obj).attr("href", "#");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.click(function () {
            W.click.fire(W);
        });
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        })
    }
});

