/* JPVS
Module: widgets
Classes: Popup
Depends: core, ImageButton
*/

jpvs.Popup = function (selector) {
    this.attach(selector);

    this.close = jpvs.event(this);
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

        //All hidden initially
        this.element.hide();

        //Apply jpvsWidth
        var width = this.element.data("jpvsWidth");
        if (width)
            this.contentsElement.css({ width: width });

        //Treat H1 as popup title. Add <div class="Title"><h1>title</h1><img/></div><div class="Body"/> in Contents
        var h1 = this.contentsElement.children("h1").detach();
        var rest = this.contentsElement.contents();

        this.titleElement = $(document.createElement("div"));
        this.titleElement.addClass("Title");
        this.contentsElement.append(this.titleElement);

        this.bodyElement = $(document.createElement("div"));
        this.bodyElement.addClass("Body");
        this.contentsElement.append(this.bodyElement);

        this.bodyElement.append(rest);

        //Add closebutton and H1 in title
        this.closeButton = jpvs.ImageButton.create(this.titleElement);
        this.closeButton.imageUrls({
            normal: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADzSURBVDhPY2BmZv7EwMDwn1zMyMrK+uXnz5/7gQaQDJiYmHyYSNaFpgHDAD09PSuQyRcvXuRCVtvW1iYHEgfRKGaAvPDv37/NyBgUHjo6Om9hYufPn98LEmtpabmIrg6rF1avXn38ypUrQjDbYmNjDYAGvquqqnqE4WVsLgDZEhUVdQ9kK4wGuQKbS/HGAig8QC4BuSg4OPgtuu0EYwGkGaRp/fr1ErhiC2c0gmwH+Rtk+7JlyxTXrl0rjNUQbGEACm2Q/2H+hoUDtjBgQDcAX5QhRy3IMHDyRzYAphldIUgx0CvHYLECcwmIP/B5gYHS7AwAM9IzlWy9T8kAAAAASUVORK5CYII=",
            hover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAENSURBVDhPY9TW1v6rqqrKxEAGuHHjBgOjo6Pjn717994lQz+Dk5OTGlk2I1uGYcDs2bNlm5qa1N6+fcuKrPDUqVP8IHEQjdeA1NTUxyAF69atk4ApBBm2Y8cOcQ8Pj5dmZmYf8RoAkoyMjHzy/PlzTphtIMMkJSW/o2sGqcUaBsBY+WZkZPQBZOuWLVvEQIYFBQW9wBbQOAPRx8fnFcjWc+fOCYBcJCws/JskA0CKQTaD6Js3b/LgimacLgDFBsgFINtBrrh9+zYX0S4ABR7M37DwWL58uQxRBiBHGczfoPAAaQa5Ct0QFC+ANE+dOlURW5TBohYUK8iGDHxeYFRRUfkrIyNDVqZ68OABAwDuhIRQ92DTiAAAAABJRU5ErkJggg=="
        });

        this.closeButton.click.bind(function () {
            W.hide();
            W.close.fire(W);
        });

        //Move H1 in title
        var newH1 = jpvs.writeTag(this.titleElement, "h1");
        newH1.append(h1.contents());

        //Make popup draggable by the H1
        if (this.contentsElement.draggable) {
            this.contentsElement.draggable({
                addClasses: false,
                containment: "window",
                cursor: "move",
                handle: newH1,
                scroll: false
            });
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
            //Show popup
            this.element.show();
            this.contentsElement.hide();
            this.contentsElement.fadeIn();

            //Dim screen if modal
            if (this.modal())
                this.blanketElement.show();
            else
                this.blanketElement.hide();

            //Center in screen
            this.center();
            return this;
        },

        hide: function () {
            this.blanketElement.hide();
            this.contentsElement.fadeOut();
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
        },

        title: jpvs.property({
            get: function () { return this.titleElement.children("h1").text(); },
            set: function (value) {
                this.titleElement.children("h1").text(value);
                if (value)
                    this.titleElement.show();
                else
                    this.titleElement.hide();
            }
        }),

        width: jpvs.property({
            get: function () { return this.contentsElement.width(); },
            set: function (value) { this.contentsElement.css("width", value); }
        })
    }
});



jpvs.alert = function () {
    //Variable argument list
    var params = {
        title: jpvs.alert.defaultTitle,
        text: "",
        onclose: null,
        buttons: [{ text: "OK"}]
    };

    //Read arguments and dispatch them to the appropriate field
    var okTitle = false, okText = false;
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (!arg)
            continue;

        if (typeof (arg) == "string") {
            //First text then title
            if (!okText) {
                params.text = arg;
                okText = true;
            }
            else if (!okTitle) {
                params.title = params.text;
                params.text = arg;
                okTitle = true;
            }
        }
        else if (typeof (arg) == "function" || arg.__WIDGET__) {
            //It's an "onclose" ("function" or "widget to focus")
            params.onclose = arg;
        }
        else if (arg.length) {
            //Buttons array
            params.buttons = arg;
        }
    }

    //Create popup
    var pop = jpvs.Popup.create();

    //Set title and text and width
    pop.width("50%").title(params.title || null);
    jpvs.write(pop.bodyElement, params.text);

    //Buttons (with pop.close.fire() prepended in the event handlers)
    if (params.buttons) {
        $.each(params.buttons, function (i, btn) {
            if (btn)
                btn.click = wrap(pop, btn.click);
        });
    }

    jpvs.writeButtonBar(pop.bodyElement, params.buttons);

    //Show
    pop.show();

    //Close event --> give focus as requested and destroy
    pop.close.bind(function () {
        pop.hide();

        if (params.onclose) {
            if (typeof (params.onclose) == "function")
                params.onclose();
            else if (params.onclose.__WIDGET__) {
                //If widget, then set focus to it
                params.onclose.focus();
            }
        }

        //Destroy after hide animation finished
        setTimeout(function () { pop.destroy(); }, 5000);
    });

    function wrap(pop, handler) {
        return function () {
            pop.close.fire();
            if (handler)
                handler();
        };
    }
};
