jpvs.TextBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
    this.lazychange = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.TextBox,
    type: "TextBox",
    cssClass: "TextBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "text");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        W.element.change(function () {
            return W.change.fire(W);
        });

        W.lazyChangeID = jpvs.randomString(10);
        W.curText = W.text();
        W.element.on("click change keyup keypress input", function () {
            if (W.text() != W.curText) {
                W.curText = W.text();
                jpvs.runLazyTask(W.lazyChangeID, 750, function () {
                    W.lazychange.fire(W);
                });
            }
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"text\"]");
    },

    prototype: {
        text: jpvs.property({
            get: function () {
                return this.element.val();
            },
            set: function (value) {
                this.element.val(value);
                this.curText = this.text();
            }
        }),

        width: jpvs.property({
            get: function () { return this.element.css("width"); },
            set: function (value) { this.element.css("width", value); }
        })
    }
});


