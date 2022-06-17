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
        //Change event
        W.element.change(function () {
            return W.change.fire(W);
        });

        //Lazy change event
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

        //Autocomplete off by default
        W.autoCompleteUniqueID = jpvs.randomString(10);
		if(W.element.attr("autocomplete") != "on")
			W.autocomplete(false);
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
        }),

        autocomplete: function (autoCompleteItems) {
            this.element.attr("autocomplete", "off");
            this.element.attr("list", "");
            $("#" + this.autoCompleteUniqueID).remove();

            if (autoCompleteItems && autoCompleteItems.length) {
                //Let's activate the HTML5 autocomplete feature by adding a "datalist" element associated to the textbox
                var list = jpvs.writeTag(this.element.parent(), "datalist").attr("id", this.autoCompleteUniqueID);
                for (var i = 0; i < autoCompleteItems.length; i++)
                    jpvs.writeTag(list, "option").attr("value", autoCompleteItems[i]);

                this.element.attr("list", this.autoCompleteUniqueID);
                //this.element.attr("autocomplete", "on");
            }

            //Chaining
            return this;
        }
    }
});


