/* JPVS
Module: widgets
Classes: ImageButton
Depends: core
*/

jpvs.ImageButton = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.ImageButton,
    type: "ImageButton",
    cssClass: "ImageButton",

    create: function (container) {
        var obj = document.createElement("img");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        //Image urls
        var normal = this.element.attr("src");
        var hover = this.element.data("jpvsHover");
        this.imageUrls({
            normal: normal,
            hover: hover
        });

        //Hovering effect
        this.element.hover(
            function () {
                W.element.attr("src", W.getHoverImage());
            },
            function () {
                W.element.attr("src", W.getNormalImage());
            }
        );

        //Click
        this.element.click(function () {
            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        //No autoattach
        return false;
    },

    prototype: {
        imageUrls: jpvs.property({
            get: function () {
                return this.element.data("images");
            },
            set: function (value) {
                this.element.data("images", value);
                this.element.attr("src", this.getNormalImage());
            }
        }),

        getNormalImage: function () {
            var urls = this.imageUrls();
            if (urls) {
                if (typeof (urls) == "string")
                    return urls;
                else
                    return urls.normal || "";
            }

            return "";
        },

        getHoverImage: function () {
            var urls = this.imageUrls();
            if (urls) {
                if (typeof (urls) == "string")
                    return urls;
                else
                    return urls.hover || urls.normal || "";
            }

            return "";
        }
    }
});

