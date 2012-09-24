/* JPVS
Module: widgets
Classes: DocumentEditor
Depends: core, parsers
*/

(function () {

    jpvs.DocumentEditor = function (selector) {
        this.attach(selector);
    };

    jpvs.DocumentEditor.allStrings = {
        en: {
            clickToEdit: "Click here to edit",
            clickToEditField: "Click here to edit this field",
            textEditor: "Text editor",

            ok: "OK",
            cancel: "Cancel"
        },

        it: {
            clickToEdit: "Clicca qui per modificare",
            clickToEditField: "Clicca qui per modificare il campo",
            textEditor: "Modifica testo",

            ok: "OK",
            cancel: "Annulla"
        }
    };


    jpvs.makeWidget({
        widget: jpvs.DocumentEditor,
        type: "DocumentEditor",
        cssClass: "DocumentEditor",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.DocumentEditor.strings = jpvs.DocumentEditor.allStrings[jpvs.currentLocale()];
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            document: jpvs.property({
                get: function () {
                    return this.element.data("document");
                },
                set: function (value) {
                    this.element.data("document", value);

                    /*
                    Refresh the preview.
                    The preview has clickable parts; the user clicks on a part to edit it
                    */
                    refreshPreview(this);
                }
            }),

            richTextEditor: jpvs.property({
                get: function () {
                    return this.element.data("richTextEditor");
                },
                set: function (value) {
                    this.element.data("richTextEditor", value);
                }
            })
        }
    });


    function refreshPreview(W) {
        setTimeout(function () { refreshPreviewDelayed(W); }, 50);
    }

    function refreshPreviewDelayed(W) {
        var elem = W.element;

        //Delete all...
        elem.empty()

        //...and recreate the clickable preview
        var doc = W.document();
        var sections = doc && doc.sections;
        var fields = doc && doc.fields;

        $.each(sections, function (sectionNum, section) {
            //Every section is rendered as a pseudo-page (DIV with class="Section" and position relative (so we can absolutely position header/footer))
            var sectionElement = jpvs.writeTag(elem, "div");
            sectionElement.addClass("Section").css("position", "relative");

            //Apply page margins to the section (as internal padding, of course)
            var margins = section && section.margins;
            var leftMargin = getMarginProp(margins, "left", "2cm");
            var topMargin = getMarginProp(margins, "top", "2cm");
            var rightMargin = getMarginProp(margins, "right", "2cm");
            var bottomMargin = getMarginProp(margins, "bottom", "2cm");

            sectionElement.css("padding-left", leftMargin);
            sectionElement.css("padding-top", topMargin);
            sectionElement.css("padding-right", rightMargin);
            sectionElement.css("padding-bottom", bottomMargin);

            //Header (absolutely positioned inside the section with margins/height)
            var headerMargins = section && section.header && section.header.margins;
            var headerTopMargin = getMarginProp(headerMargins, "top", "1cm");
            var headerLeftMargin = getMarginProp(headerMargins, "left", leftMargin);
            var headerRightMargin = getMarginProp(headerMargins, "right", rightMargin);
            var headerHeight = (section && section.header && section.header.height) || "1cm";

            var headerElement = jpvs.writeTag(sectionElement, "div");
            headerElement.addClass("Header");
            headerElement.css("position", "absolute");
            headerElement.css("overflow", "hidden");
            headerElement.css("top", headerTopMargin);
            headerElement.css("left", headerLeftMargin);
            headerElement.css("right", headerRightMargin);
            headerElement.css("height", headerHeight);

            //Footer (absolutely positioned inside the section with margins/height)
            var footerMargins = section && section.footer && section.footer.margins;
            var footerBottomMargin = getMarginProp(footerMargins, "bottom", "1cm");
            var footerLeftMargin = getMarginProp(footerMargins, "left", leftMargin);
            var footerRightMargin = getMarginProp(footerMargins, "right", rightMargin);
            var footerHeight = (section && section.footer && section.footer.height) || "1cm";

            var footerElement = jpvs.writeTag(sectionElement, "div");
            footerElement.addClass("Footer");
            footerElement.css("position", "absolute");
            footerElement.css("overflow", "hidden");
            footerElement.css("bottom", footerBottomMargin);
            footerElement.css("left", footerLeftMargin);
            footerElement.css("right", footerRightMargin);
            footerElement.css("height", footerHeight);

            //Body
            var bodyElement = jpvs.writeTag(sectionElement, "div");
            bodyElement.addClass("Body");

            //Write content, if any
            writeContent(W, headerElement, section && section.header && section.header.content, fields, "Header-Hover", section.header.highlight ? "Header-Highlight" : "", function (x) { section.header.content = x; section.header.highlight = true; });
            writeContent(W, bodyElement, section && section.body && section.body.content, fields, "Body-Hover", section.body.highlight ? "Body-Highlight" : "", function (x) { section.body.content = x; section.body.highlight = true; });
            writeContent(W, footerElement, section && section.footer && section.footer.content, fields, "Footer-Hover", section.footer.highlight ? "Footer-Highlight" : "", function (x) { section.footer.content = x; section.footer.highlight = true; });

            //Switch off the highlight flags after rendering
            section.header.highlight = false;
            section.body.highlight = false;
            section.footer.highlight = false;
        });
    }

    function getMarginProp(margins, which, defaultValue) {
        if (margins) {
            //Let's try the "which" margin or, if missing, the "all" margin
            var value = margins[which] || margins.all;
            if (value)
                return value;
        }

        //Value not yet determined, let's apply the default
        return defaultValue;
    }

    function writeContent(W, element, content, fields, hoverCssClass, highlightCssClass, newContentSetterFunc) {
        if (!content)
            return;

        //Clean HTML "content" (becomes xhtml)...
        content = jpvs.cleanHtml(content);

        //...make the element clickable (click-to-edit)...
        element.css("cursor", "pointer").attr("title", jpvs.DocumentEditor.strings.clickToEdit).click(function () {
            onEditFormattedText(W, content, newContentSetterFunc);
            return false;
        }).hover(function () {
            element.parent().addClass("Section-Hover");
            element.addClass(hoverCssClass);
        }, function () {
            element.parent().removeClass("Section-Hover");
            element.removeClass(hoverCssClass);
        });

        //...and render the sanitized XHTML result, making sure fields are clickable too
        var contentAsXml = XmlParser.parseString("<root>" + content + "</root>", null, true);
        renderXHtmlWithFields(W, element, contentAsXml, fields);

        //At the end, do a flashing animation if required to do so
        if (highlightCssClass != "")
            jpvs.flashClass(element, highlightCssClass);
    }

    function renderXHtmlWithFields(W, curElem, xmlNode, fields) {
        //Write the xmlNode into curElem. If the xmlNode is TEXT, then make sure ${FIELD} patterns are made clickable
        if (xmlNode.name == "#TEXT") {
            //This is plain text and it can contain ${FIELD} patterns that must be made clickable
            renderTextWithFields(W, curElem, xmlNode.value, fields);
        }
        else if (xmlNode.name == "root") {
            //This is the dummy root node. Let's just write the content, recursively
            if (xmlNode.children) {
                $.each(xmlNode.children, function (i, childNode) {
                    renderXHtmlWithFields(W, curElem, childNode, fields);
                });
            }
        }
        else {
            //This is a normal element. Let's write it, along with attributes and content
            var tagName = xmlNode.name;
            var newElem = jpvs.writeTag(curElem, tagName);

            //Apply attributes
            if (xmlNode.attributes) {
                $.each(xmlNode.attributes, function (attrName, attrValue) {
                    newElem.attr(attrName, attrValue);
                });
            }

            //Apply content recursively
            if (xmlNode.children) {
                $.each(xmlNode.children, function (i, childNode) {
                    renderXHtmlWithFields(W, newElem, childNode, fields);
                });
            }
        }
    }

    function renderTextWithFields(W, curElem, text, fields) {
        //Look for ${FIELD} patterns and replace them with a clickable object
        var pattern = /\$\{(.*?)\}/g;
        var lastWrittenIndex = 0;
        for (var match = pattern.exec(text); match != null; match = pattern.exec(text)) {
            //Match found: analyze it
            var matchedString = match[0];
            var fieldName = match[1];
            var endIndex = pattern.lastIndex;
            var startIndex = endIndex - matchedString.length;

            //Now write the plain text between lastWrittenIndex and startIndex...
            var textBefore = text.substring(lastWrittenIndex, startIndex)
            jpvs.write(curElem, textBefore);

            //Then render the clickable field...
            renderField(W, curElem, fields, fieldName);

            //Then update the lastWrittenIndex
            lastWrittenIndex = endIndex;
        }

        //At the end, there is still the ending text missing
        var endingText = text.substring(lastWrittenIndex);
        jpvs.write(curElem, endingText);
    }

    function renderField(W, curElem, fields, fieldName) {
        //Get info about the field
        var fieldValue = fields && fields[fieldName];

        //Render the clickable thing
        var span = jpvs.writeTag(curElem, "span", fieldValue || jpvs.DocumentEditor.strings.clickToEditField);
        span.addClass("Field").attr("title", jpvs.DocumentEditor.strings.clickToEditField).click(function () {
            onEditField(W, fields, fieldName);
            return false;
        }).hover(function () {
            span.addClass("Field-Hover");
        },
        function () {
            span.removeClass("Field-Hover");
        });

    }

    function onEditFormattedText(W, content, newContentSetterFunc) {
        //Let's use the formatted text editor supplied by the user in the richTextEditor property
        //Use a default one if none is set
        var rte = W.richTextEditor() || getDefaultEditor();

        //The richTextEditor gives us an object that defines how to edit rich text
        rte.editText(content, onDone);

        function onDone(newContent) {
            //We have the new content. All we need to do is update the W.document property and refresh
            //We use the new content setter provided
            if (newContent != null) {
                newContentSetterFunc(newContent);
                refreshPreview(W);
            }
        }
    }

    function onEditField(W, fields, fieldName) {
        jpvs.alert("TODO: Edit field", "Field: " + fieldName);
    }

    /*
    Here's a trivial default editor, merely intended for testing purposes or for very simple scenarios
    */
    function getDefaultEditor() {

        function editText(content, onDone) {
            //Create a popup with a simple textarea
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.textEditor).close(function () { this.destroy(); });
            var tb = jpvs.MultiLineTextBox.create(pop).text(content);
            tb.element.attr({ rows: 10, cols: 50 });

            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show();

            function onOK() {
                pop.hide(function () {
                    //At the end of the hiding animations, call the onDone function and destroy the popup
                    onDone(tb.text());
                    pop.destroy();
                });
            }

            function onCancel() {
                pop.destroy();
                onDone();
            }
        }

        //Let's return the object interface
        return {
            editText: editText
        };
    }
})();
