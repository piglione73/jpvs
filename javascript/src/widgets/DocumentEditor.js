/* JPVS
Module: widgets
Classes: DocumentEditor
Depends: core
*/

(function () {

    jpvs.DocumentEditor = function (selector) {
        this.attach(selector);
    };

    jpvs.DocumentEditor.allStrings = {
        en: {
            clickToEdit: "Click here to edit"
        },

        it: {
            clickToEdit: "Clicca qui per modificare"
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
            })
        }
    });


    function refreshPreview(W) {
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
            writeContent(W, headerElement, section && section.header && section.header.content, fields, "Header-Hover");
            writeContent(W, bodyElement, section && section.body && section.body.content, fields, "Body-Hover");
            writeContent(W, footerElement, section && section.footer && section.footer.content, fields, "Footer-Hover");
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

    function writeContent(W, element, content, fields, hoverCssClass) {
        if (!content)
            return;

        //Make the element clickable (click-to-edit)
        element.css("cursor", "pointer").attr("title", jpvs.DocumentEditor.strings.clickToEdit).click(function () {
            onEditFormattedText(W, content);
        }).hover(function () {
            element.parent().addClass("Section-Hover");
            element.addClass(hoverCssClass);
        }, function () {
            element.parent().removeClass("Section-Hover");
            element.removeClass(hoverCssClass);
        });

        //TODO: Clean "content" using http://code.google.com/p/jquery-clean/
        //TODO: then write the HTML, considering only valid tags and attributes
        //TODO: crea metodo jpvs.sanitizeHtml che usa jquery-clean
        element.html(content);
    }

    function onEditFormattedText(W, content) {
        jpvs.alert("TODO: Edit rich text", content);
    }

})();
