/* JPVS
Module: widgets
Classes: Popup
Depends: core
*/

jpvs.Popup = function (selector) {
    this.attach(selector);
};

jpvs.makeWidget({
    widget: jpvs.Popup,
    type: "Popup",
    cssClass: "Popup",

    create: function (container) {
        var obj = document.createElement("div");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        //Wrap any current contents "xxxxxx" in structure: <div class="DimScreen"></div><div class="Contents">xxxxxx</div>
        var contents = this.element.contents();

        this.blanketElement = $(document.createElement("div"));
        this.blanketElement.addClass("DimScreen").css({ position: "fixed", top: "0px", left: "0px", width: "100%", height: "100%" });
        this.element.append(this.blanketElement);

        this.contentsElement = $(document.createElement("div"));
        this.contentsElement.addClass("Contents").append(contents);
        this.element.append(this.contentsElement);

        //Apply jpvsWidth
        var W = this.element.data("jpvsWidth");
        if (W)
            this.contentsElement.css({ width: W });

        //Treat H1 as popup title, in which case add <div class="Title"/><div class="Body"/> in Contents
        var h1 = this.contentsElement.children("h1");
        if (h1.length != 0) {
            h1.detach();

            this.titleElement = $(document.createElement("div"));
            this.titleElement.addClass("Title");
            this.contentsElement.append(this.titleElement);

            this.bodyElement = $(document.createElement("div"));
            this.bodyElement.addClass("Body");
            this.contentsElement.append(this.bodyElement);

            this.bodyElement.append(contents);
            this.titleElement.append(h1.contents());
        }
    },

    canAttachTo: function (obj) {
        //No auto attaching
        return false;
    },

    prototype: {
        modal: jpvs.property({
            get: function () {
                return this.blanketElement.is(":visible");
            },
            set: function (value) {
                if (value)
                    this.blanketElement.show();
                else
                    this.blanketElement.hide();
            }
        }),

        show: function () {
            //Dim screen if modal
            if (this.modal())
                this.blanketElement.show();
            else
                this.blanketElement.hide();

            //Show popup
            this.center();
            this.element.fadeIn();
            return this;
        },

        hide: function () {
            this.element.fadeOut();
            return this;
        },

        center: function () {
            var W = this.contentsElement.outerWidth();
            var H = this.contentsElement.outerHeight();

            var wnd = $(window);
            var wndW = wnd.width();
            var wndH = wnd.height();

            var x = (wndW - W) / 2;
            var y = (wndH - H) / 2;

            this.contentsElement.css({
                position: "fixed",
                top: y + "px",
                left: x + "px"
            });

            return this;
        }

    }
});

