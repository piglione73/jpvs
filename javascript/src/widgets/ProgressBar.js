(function () {

    jpvs.ProgressBar = function (selector) {
        this.attach(selector);
    };

    jpvs.makeWidget({
        widget: jpvs.ProgressBar,
        type: "ProgressBar",
        cssClass: "ProgressBar",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            this.element.empty();

            this.element.css({
                position: "relative"
            });

            //One layer for the background
            this.divBack = jpvs.writeTag(this, "div").addClass("Background").css({
                position: "absolute",
                top: "0px",
                left: "0px",
                height: "100%"
            });

            //One layer for the text
            this.divText = jpvs.writeTag(this, "div").addClass("Text").css({
                position: "absolute",
                top: "0px",
                left: "0px",
                height: "100%",
                width: "100%"
            });

            refresh(this);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            width: jpvs.property({
                get: function () { return this.element.data("width"); },
                set: function (value) { this.element.data("width", value); refresh(this); }
            }),

            progress: jpvs.property({
                get: function () { return this.element.data("progress"); },
                set: function (value) { this.element.data("progress", value); refresh(this); }
            }),

            text: jpvs.property({
                get: function () { return this.element.data("text"); },
                set: function (value) { this.element.data("text", value); refresh(this); }
            }),

            color: jpvs.property({
                get: function () { return this.element.data("color"); },
                set: function (value) { this.element.data("color", value); refresh(this); }
            })
        }
    });

    function refresh(W) {
        var progress = parseFloat(W.progress() != null ? W.progress() : 50);
        if (!isFinite(progress))
            progress = 50;

        progress = Math.max(0, progress);
        progress = Math.min(100, progress);

        var text = W.text() || "";
        var color = W.color();
        var width = W.width();

        if (width)
            W.element.css("width", width);
        else
            W.element.css("width", null);

        W.divBack.css("width", progress + "%");

        if (color)
            W.divBack.css("background-color", color);
        else
            W.divBack.css("background-color", null);

        W.divText.text(text);
    }

})();
