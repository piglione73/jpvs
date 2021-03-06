(function () {

    //Keep track of all popups
    var allPopups = {};

    //Attach global events for handling auto-hide/destroy popups and the ESC keystroke
    $(document).ready(function () {
        try {
            $(document).on("click.jpvsPopup", onGlobalClick).on("keydown.jpvsPopup", onGlobalKeyDown);
        }
        catch (e) {
        }
    });


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
            allPopups[this.element.attr("id")] = { open: false, autoDestroy: false, autoHide: false, widget: this };

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

            //By default, the popup is modal
            this.modal(true);

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
                //Keep track
                delete allPopups[pop.element.attr("id")];

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
                get: function () { return this.element.data("modal"); },
                set: function (value) { this.element.data("modal", !!value); }
            }),

            autoHide: jpvs.property({
                get: function () {
                    return !!allPopups[this.element.attr("id")].autoHide;
                },
                set: function (value) {
                    allPopups[this.element.attr("id")].autoHide = !!value;
                }
            }),

            autoDestroy: jpvs.property({
                get: function () {
                    return !!allPopups[this.element.attr("id")].autoDestroy;
                },
                set: function (value) {
                    allPopups[this.element.attr("id")].autoDestroy = !!value;
                }
            }),

            position: jpvs.property({
                get: function () {
                    return this.element.data("position");
                },
                set: function (value) {
                    this.element.data("position", value);
                }
            }),

            applyPosition: function (flagAnimate) {
                //First, if bigger than viewport, reduce the popup
                var W = this.contentsElement.outerWidth();
                var H = this.contentsElement.outerHeight();

                var wnd = $(window);
                var wndW = wnd.width();
                var wndH = wnd.height();

                //If bigger than screen, adjust to fit and put scrollbars on popup body
                var deltaH = H - wndH;
                var deltaW = W - wndW;

                var bodyW = this.bodyElement.width();
                var bodyH = this.bodyElement.height();

				//A little tolerance for rounding errors... (Meaning: if deltaW is WITH NO DOUBT > 0 ...)
                if (deltaW > 5 || deltaH > 5) {
                    this.bodyElement.css("overflow", "auto");

                    if (deltaW > 0) {
                        bodyW -= deltaW;
                        this.bodyElement.css("width", bodyW + "px");
                    }

                    if (deltaH > 0) {
                        bodyH -= deltaH;
                        this.bodyElement.css("height", bodyH + "px");
                    }
                }

                //Finally, apply the desired position or, if no desired position was specified, center in viewport
                var pos = this.position() || {
                    my: "center",
                    at: "center",
                    of: $(window),
                    collision: "fit",
                    position: "fixed"
                };

                if (flagAnimate)
                    pos.using = function (css) { $(this).animate(css); };
                else
                    delete pos.using;

                this.contentsElement.css("position", pos.position || "fixed").position(pos);
                return this;
            },

            center: function () {
                //Default position (center in viewport)
                this.position(null);
                this.applyPosition();
                return this;
            },

            show: function (callback) {
                var pop = this;

                //Show popup
                this.element.show();
                this.contentsElement.show();

                //If never positioned before, then do it now with no animation
                var posType = this.contentsElement.css("position");
                if (posType != "absolute" && posType != "fixed")
                    this.applyPosition(false);

                this.contentsElement.hide();
                this.contentsElement.fadeIn(function () {
                    //Animate to desired position, if not already there
                    pop.applyPosition(true);

                    //Callback after the animation
                    if (callback)
                        callback();
                });

                //Dim screen if modal
                if (this.modal())
                    this.blanketElement.show();
                else
                    this.blanketElement.hide();

                //Keep track
                allPopups[this.element.attr("id")].open = true;
                allPopups[this.element.attr("id")].openTimestamp = new Date().getTime();

                //Put it on top of popup stack
                this.bringForward();

                return this;
            },

            hide: function (callback) {
                //Keep track
                allPopups[this.element.attr("id")].open = false;

                this.blanketElement.hide();
                this.contentsElement.fadeOut(callback);

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

                //Ensure the popup is in the main zIndex stacking context
                if (this.element.parent()[0].nodeName != "BODY")
                    this.element.appendTo("body");

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

        //Read arguments and dispatch them to the appropriate fields
        if (arguments.length >= 4) {
            //Signature: jpvs.alert(title, text, onclose, buttons)
            params.title = arguments[0];
            params.text = arguments[1];
            params.onclose = arguments[2];
            params.buttons = arguments[3];
        }
        else if (arguments.length == 3) {
            //Signature: jpvs.alert(title, text, buttons)
            //Signature: jpvs.alert(title, text, onclose)
            params.title = arguments[0];
            params.text = arguments[1];
            if (arguments[2] && arguments[2].length && typeof (arguments[2]) != "string")
                params.buttons = arguments[2];
            else
                params.onclose = arguments[2];
        }
        else if (arguments.length == 2) {
            //Signature: jpvs.alert(title, text)
            //Signature: jpvs.alert(text, buttons)
            if (arguments[1] && arguments[1].length && typeof (arguments[1]) != "string") {
                params.text = arguments[0];
                params.buttons = arguments[1];
            }
            else {
                params.title = arguments[0];
                params.text = arguments[1];
            }
        }
        else if (arguments.length == 1) {
            //Signature: jpvs.alert(text)
            params.text = arguments[0];
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
                else {
                    //If string or anything else, treat as jQuery object / selector
                    try { $(params.onclose).focus(); }
                    catch (x) { }
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



    function onGlobalKeyDown(e) {
        //ESC button must close the topmost popup currently open
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
    }

    function onGlobalClick(e) {
        //What did the user click?
        var clickedElem = $(e.target);
        var clickedPopup = clickedElem.closest(".Popup");

        //Close all "auto-close" (autohide or autodestroy) popups that are currently open, but leave clickedPopupId open
        //That is, if the user clicked on a popup, leave that one open and close all the others
        var clickedPopupId = clickedPopup.length ? clickedPopup.attr("id") : "";

        //Preserve newly-opened popups, so the button click that triggered the popup does not immediately trigger its destruction
        var threshold = new Date().getTime() - 500;

        $.each(allPopups, function (popId, pop) {
            if (pop.open && pop.openTimestamp < threshold && popId != clickedPopupId) {
                //If autohide, then hide
                if (pop.autoHide)
                    pop.widget.hide();

                //If autodestroy, then destroy
                if (pop.autoDestroy)
                    pop.widget.destroy();
            }
        });
    }

})();
