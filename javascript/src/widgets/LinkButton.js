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
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        W.element.attr("href", "#");
        this.element.click(function (e) {
            //Prevent the link from being navigated to
            e.preventDefault();

            if (!W.enabled())
                return false;

            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        //By default, we don't want to automatically attach a LinkButton widget to an "A" element, because
        //we cannot determine if it is used as a button or as a hyperlink
        return false;
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        }),

        enabled: jpvs.property({
            get: function () { return this.element.data("enabled") !== false; },
            set: function (value) {
                this.element.data("enabled", !!value);

                if (!!value)
                    this.removeState(jpvs.states.DISABLED);
                else
                    this.addState(jpvs.states.DISABLED);
            }
        })
    }
});

