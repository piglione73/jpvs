/* JPVS
Module: widgets
Classes: Popup
Depends: core, ImageButton
*/

(function () {

    //Keep track of all popups
    var allPopups = {};

    jpvs.Popup = function (selector) {
        this.attach(selector);

        this.close = jpvs.event(this);
    };

    jpvs.Popup.getTopMost = function () {
        var topMost, zIndex;
        $.each(allPopups, function (popId, popInfo) {
            if (!popInfo.open)
                return;

            var popZIndex = popInfo.widget.zIndex();

            if (!zIndex || popZIndex > zIndex) {
                topMost = popInfo;
                zIndex = popZIndex;
            }
        });

        return topMost ? topMost.widget : null;
    };

    jpvs.makeWidget({
        widget: jpvs.Popup,
        type: "Popup",
        cssClass: "Popup",

        create: function (container) {
            //Every popup created here must have a unique ID because it is put in allPopups[id]
            var obj = document.createElement("div");
            $(obj).attr("id", jpvs.randomString(20));
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Keep track
            allPopups[this.element.attr("id")] = { open: false, widget: this };

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
                normal: jpvs.Resources.images.closeButton,
                hover: jpvs.Resources.images.closeButtonHover
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

            //When clicking on the popup, put it on top of the popup stack
            this.contentsElement.mousedown(onPopupClick(this));

            function onPopupClick(W) {
                return function () {
                    W.bringForward();
                };
            }
        },

        canAttachTo: function (obj) {
            //No auto attaching
            return false;
        },

        destroy: function () {
            var pop = this;

            //Hide the popup and, only at the end of the animation, destroy the widget
            this.hide(function () {
                //Let's effect the default behavior here, AFTER the end of the "hide animation"
                pop.element.remove();
            });

            //Suppress the default behavior
            return false;
        },

        getMainContentElement: function () {
            return this.bodyElement;
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
                var pop = this;

                //Show popup
                this.element.show();

                //First attempt to center (BEFORE the animation)
                this.center();

                //Second attempt to center (DURING the fadeIn animation)
                setTimeout(function () { pop.center(); }, 0);

                this.contentsElement.hide();
                this.contentsElement.fadeIn(function () {
                    //Third attempt to center (at the END of the animation), in case the first and second attempts failed because the layout was not
                    //available yet
                    pop.center();
                });

                //Dim screen if modal
                if (this.modal())
                    this.blanketElement.show();
                else
                    this.blanketElement.hide();

                //Keep track
                allPopups[this.element.attr("id")].open = true;

                //Put it on top of popup stack
                this.bringForward();

                return this;
            },

            hide: function (callback) {
                this.blanketElement.hide();
                this.contentsElement.fadeOut(callback);

                //Keep track
                allPopups[this.element.attr("id")].open = false;

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

            bringForward: function () {
                var topMost = jpvs.Popup.getTopMost();
                if (topMost) {
                    //Change zIndex only if not already on top
                    if (topMost !== this)
                        this.zIndex(topMost.zIndex() + 1);
                }
                else
                    this.zIndex(10000);
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
            }),

            maxWidth: jpvs.property({
                get: function () { return this.contentsElement.css("max-width"); },
                set: function (value) { this.contentsElement.css("max-width", value); }
            }),

            zIndex: jpvs.property({
                get: function () {
                    var z = parseInt(this.contentsElement.css("zIndex"));
                    return isFinite(z) ? z : 10000;
                },
                set: function (value) {
                    this.blanketElement.css("zIndex", value);
                    this.contentsElement.css("zIndex", value);
                }
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
                //First try (text) then (title, text)
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
        pop.maxWidth("75%").title(params.title || null);
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
        pop.center();

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
                //First, call the button handler...
                if (handler)
                    handler();

                //Then, simulate a click on the close button to hide the popup and trigger the onclose event
                pop.close.fire();
            };
        }
    };


    jpvs.confirm = function (title, text, onYes, onNo, textYes, textNo) {
        var clickedYes = false;

        function onClose() {
            if (clickedYes) {
                if (onYes)
                    onYes();
            }
            else {
                if (onNo)
                    onNo();
            }
        }

        jpvs.alert(title, text, onClose, [
            { text: textYes || "OK", click: function () { clickedYes = true; } },
            { text: textNo || "Cancel", click: function () { clickedYes = false; } }
        ]);
    };

    //ESC button must close the topmost popup currently open
    $(document).ready(function () {
        $(document.body).keydown(function (e) {
            if (e.which == 27) {
                //ESC key pressed: search for the topmost popup
                var topMost = jpvs.Popup.getTopMost();

                //Now close it and do not propagate the ESC event
                //Simulate a click on the close button instead of simply hiding
                if (topMost) {
                    topMost.closeButton.click.fire(topMost);
                    return false;
                }
            }
        });
    });
})();
