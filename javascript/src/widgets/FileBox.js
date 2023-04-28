(function () {

    jpvs.FileBox = function (selector) {
        this.attach(selector);

        this.fileselected = jpvs.event(this);
        this.filedeleted = jpvs.event(this);
        this.filerename = jpvs.event(this);
    };

    jpvs.FileBox.allStrings = {
        en: {
            show: "Show",
            select: "Insert...",
            remove: "Remove",
            rename: "Rename..."
        },

        it: {
            show: "Visualizza",
            select: "Inserisci...",
            remove: "Rimuovi",
            rename: "Rinomina..."
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

            //ID of the input type file element
            this.inputFileElementID = jpvs.randomString(20);

            //Label with icon and text
            this.lbl = jpvs.writeTag(this.element, "label").click(onShow(W));
            jpvs.writeTag(this.lbl, "img").addClass("Icon");
            jpvs.writeTag(this.lbl, "span").addClass("Text");

            /*
            Link buttons: Select/Remove

            Wrap a fake linkbutton as a label, so clicking on it will trigger the "input type file" without generating "access denied"
            errors that occur in IE8 when the "Browse" button is "clicked" by javascript.

            We make the buttons the same way for styling purposes.

            The "select" button triggers the inputFileElementID (and, as a consequence,  the choose file dialog box), 
            the "remove" button triggers the onRemove(W) function. The "rename" button triggers the onRename(W) function.
            */
            W.lnkSelect = jpvs.writeTag(this, "label", jpvs.FileBox.strings.select).attr("for", this.inputFileElementID).addClass("LinkButton");
            W.lnkRename = jpvs.writeTag(this, "label", jpvs.FileBox.strings.rename).addClass("LinkButton").click(onRename(W));
            W.lnkRemove = jpvs.writeTag(this, "label", jpvs.FileBox.strings.remove).addClass("LinkButton").click(onRemove(W));

            //Only to enable old-style uploads: we use the IFRAME method (POST to IFRAME), so we need an IFRAME and a FORM
            var iframeName = jpvs.randomString(10);
            var iframe = document.createElement("iframe");
            iframe.name = iframeName;
            W.element[0].appendChild(iframe);
            this.oldStyleIframe = iframe;
            $(iframe).css("display", "none");

            var form = document.createElement("form");
            form.target = iframeName;                   //So, it posts to the IFRAME
            form.method = "POST";
            form.enctype = "multipart/form-data";
            form.encoding = "multipart/form-data";
            W.element[0].appendChild(form);
            this.oldStyleForm = form;

            //Hidden file input element
            recreateOrResetInput(this);

            //Refresh state
            refresh(W);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            enabled: jpvs.property({
                get: function () {
                    return this.element.data("enabled") !== false;    //Default is true
                },
                set: function (value) {
                    this.element.data("enabled", value);
                    refresh(this);
                }
            }),

            allowRename: jpvs.property({
                get: function () {
                    return !!this.element.data("allowRename");    //Default is false
                },
                set: function (value) {
                    this.element.data("allowRename", value);
                    refresh(this);
                }
            }),

            file: jpvs.property({
                get: function () {
                    return this.element.data("file");
                },
                set: function (value) {
                    this.element.data("file", value);
                    refresh(this);
                }
            }),

            postFile: function (url, callback) {
                post(this, url, callback);
            }
        }
    });

    function recreateOrResetInput(W) {
        //Remove the <input type="file"> and recreate it, so we actually reset its selection
        if (W.inputFileElement)
            W.inputFileElement.remove();

        var input = document.createElement("input");
        $(input).attr({
            "id": W.inputFileElementID,
            "type": "file",
            "name": "PostedFile"
        });
        W.oldStyleForm.appendChild(input);

        //Hidden but not with display: none, otherwise the fake label for clicking it will not work
        W.inputFileElement = $(input).change(onSelected(W)).css({
            position: "absolute",
            top: "-100em",
            left: "-100em"
        });
    }

    function refresh(W) {
        var file = W.file();
        if (W.posting) {
            //Post in progress
            W.lbl.show();
            W.lbl.find(".Icon").show().attr("src", jpvs.Resources.images.loading);
            W.lbl.find(".Text").show().text(W.progress);

            //Show/hide link buttons as appropriate
            W.lnkSelect.hide();
            W.lnkRename.hide();
            W.lnkRemove.hide();
        }
        else if (file) {
            //File present
            W.lbl.show();

            //Write icon, if present
            if (file.icon)
                W.lbl.find(".Icon").show().attr("src", file.icon);
            else
                W.lbl.find(".Icon").hide();

            //Write file label, if present
            if (file.label)
                W.lbl.find(".Text").show().text(file.label);
            else
                W.lbl.find(".Text").hide();

            //Show/hide link buttons as appropriate
            W.lnkSelect.show();

            if (W.allowRename())
                W.lnkRename.show();
            else
                W.lnkRename.hide();

            W.lnkRemove.show();
        }
        else {
            //No file
            W.lbl.hide();

            //Show/hide link buttons as appropriate
            W.lnkSelect.show();
            W.lnkRename.hide();
            W.lnkRemove.hide();
        }

        //If disabled, hide the buttons anyway
        if (!W.enabled()) {
            W.lnkSelect.hide();
            W.lnkRename.hide();
            W.lnkRemove.hide();
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
            //Let's fire the "fileselected" event with the File API File object, if available
            var txtFile = $(W.inputFileElement)[0];
            if (txtFile.files) {
                //File API is available (modern browser), let's use it
                var file = txtFile.files[0];
                W.fileselected.fire(W, null, file);
            }
            else {
                //File API not available, let's send a dummy object to the event
                W.fileselected.fire(W, null, { name: txtFile.value });
            }
        };
    }

    function onRemove(W) {
        return function () {
            W.file(null);
            recreateOrResetInput(W);

            //Let's fire the "filedeleted" event
            W.filedeleted.fire(W);
        };
    }

    function onRename(W) {
        return function () {
            //Let's fire the "filerename" event
            W.filerename.fire(W);
        };
    }

    function post(W, url, callback) {
        var txtFile = $(W.inputFileElement)[0];
        if (txtFile.files)
            post_ModernVersion(W, url, callback);
        else
            post_OldStyleVersion(W, url, callback);
    }

    function post_ModernVersion(W, url, callback) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                W.posting = false;
                recreateOrResetInput(W);
                refresh(W);

                if (callback)
                    callback(xhr.responseText, xhr.status);
            }
        };

        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                var percentage = Math.round((e.loaded * 100) / e.total);
                W.progress = percentage + "%";
                refresh(W);
            }
        };

        //Send
        W.posting = true;
        W.progress = "0%";
        refresh(W);

        var file = $(W.inputFileElement)[0].files && $(W.inputFileElement)[0].files[0];

        if (file) {
            //If a file is selected, then post it
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", file.type);

			//This one, in case of chars not representable in ISO-8859-1 fails because HTTP headers travel as ISO-8859-1
			try {
				xhr.setRequestHeader("FileName", file.name);
			}
			catch(e) {}

			//So we set a second header with the file name encoded as UTF-8 (simple list of UTF-8 code points)
			//This second header can always be set successfully
			var fileNameAsUtf8 = new TextEncoder().encode(file.name).join(" ");
			xhr.setRequestHeader("FileNameUtf8", fileNameAsUtf8);

            xhr.send(file);
        }
        else {
            //If no file is selected (for example after using the "remove" button), then post a NULL file (with a special header)
            xhr.open("POST", url);
            xhr.setRequestHeader("FileNull", "true");
            xhr.send();
        }
    }


    //Probably not used anymore
    function post_OldStyleVersion(W, url, callback) {
        W.oldStyleIframe.onreadystatechange = function () {
            if (W.oldStyleIframe.readyState == "complete") {
                W.posting = false;
                recreateOrResetInput(W);
                refresh(W);

                var responseText = W.oldStyleIframe.contentDocument.body.innerText;
                if (callback)
                    callback(responseText, 200);
            }
        };

        //Post to URL using old style form
        W.posting = true;
        W.progress = "0%";
        refresh(W);

        W.oldStyleForm.action = url;
        W.oldStyleForm.submit();
    }

})();
