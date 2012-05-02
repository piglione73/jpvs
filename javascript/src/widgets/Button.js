/* JPVS
Module: widgets
Classes: Button
Depends: core
*/

jpvs.Button = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

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

    init: function (W) {
        this.element.click(function () {
            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("button,input[type=\"button\"]");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        })
    }
});


jpvs.writeButtonBar = function (container, buttons) {
    if (!container)
        return;
    if (!buttons)
        return;

    //Handle the case when container is a jpvs widget
    container = jpvs.getElementIfWidget(container);

    //Create buttonbar
    var bar = $(document.createElement("div"));
    $(bar).addClass("ButtonBar").appendTo(container);

    //Add individual buttons
    $.each(buttons, function (i, btnDef) {
        var btn = jpvs.Button.create(bar);
        btn.text(btnDef.text || "OK").click.bind(btnDef.click);
    });

    return bar;
};
