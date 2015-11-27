(function () {

    jpvs.FileBox = function (selector) {
        this.attach(selector);

        this.fileselected = jpvs.event(this);
    };

    jpvs.FileBox.allStrings = {
        en: {
            show: "Show",
            select: "Select...",
            remove: "Remove"
        },

        it: {
            show: "Visualizza",
            select: "Seleziona...",
            remove: "Rimuovi"
        }
    };

    jpvs.makeWidget({
        widget: jpvs.FileBox,
        type: "FileBox",
        cssClass: "FileBox",

        create: function (container) {
            var obj = document.createElement("span");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.FileBox.strings = jpvs.FileBox.allStrings[jpvs.currentLocale()];

            //Hidden file input element
            recreateOrResetInput(this);

            //Label with icon and file name
            this.lbl = jpvs.writeTag(this.element, "label").click(onShow(W));
            jpvs.writeTag(this.lbl, "img").addClass("Icon");
            jpvs.writeTag(this.lbl, "span").addClass("Text");

            //Link buttons: Select/Remove
            this.lnkSelect = jpvs.LinkButton.create(this.element).text(jpvs.FileBox.strings.select).click(onSelect(W));
            this.lnkRemove = jpvs.LinkButton.create(this.element).text(jpvs.FileBox.strings.remove).click(onRemove(W));

            //Refresh state
            refresh(W);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            file: jpvs.property({
                get: function () {
                    return this.element.data("file");
                },
                set: function (value) {
                    this.element.data("file", value);
                    refresh(this);
                }
            }),

            postFile: function (url) {
                post(this, url);
            }
        }
    });

    function recreateOrResetInput(W) {
        //Remove the <input type="file"> and recreate it, so we actually reset its selection
        if (W.inputFileElement)
            W.inputFileElement.remove();

        var input = document.createElement("input");
        $(input).attr("type", "file");
        W.element.append(input);

        W.inputFileElement = $(input).change(onSelected(W)).hide();
    }

    function refresh(W) {
        var file = W.file();
        if (file) {
            //File present
            W.lbl.show();

            //Write icon, if present
            if (file.icon)
                W.lbl.find(".Icon").show().attr("src", file.icon);
            else
                W.lbl.find(".Icon").hide();

            //Write file name, if present
            if (file.name)
                W.lbl.find(".Text").show().text(file.name);
            else
                W.lbl.find(".Text").hide();

            //Show/hide link buttons as appropriate
            W.lnkRemove.element.show();
        }
        else {
            //No file
            W.lbl.hide();

            //Show/hide link buttons as appropriate
            W.lnkRemove.element.hide();
        }
    }

    function onShow(W) {
        return function () {
            var file = W.file();
            if (file && file.url)
                window.open(file.url);
        };
    }

    function onSelect(W) {
        return function () {
            $(W.inputFileElement).click();
        };
    }

    function onSelected(W) {
        return function () {
            //Let's fire the "fileselected" event with the File API File object
            var file = $(W.inputFileElement)[0].files[0];
            W.fileselected.fire(W, null, file);
        };
    }

    function onRemove(W) {
        return function () {
            W.file(null);
            recreateOrResetInput(W);
        };
    }
    var xhr;
    function post(W, url, callback) {
        xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE)
                alert(xhr.responseText);
        };

        var file = $(W.inputFileElement)[0].files[0];
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file.slice(0));
        return;

        var reader = new FileReader();
        reader.onload = function () {
            xhr.send(reader.result);
        };

        reader.readAsArrayBuffer(file);
    }


})();
