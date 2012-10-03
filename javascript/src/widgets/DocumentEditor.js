/* JPVS
Module: widgets
Classes: DocumentEditor
Depends: core, parsers
*/

(function () {

    jpvs.DocumentEditor = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.DocumentEditor.allStrings = {
        en: {
            clickToEdit: "Click here to edit",
            clickToEditField: "Click here to edit this field",
            clickToEditHeader: "Click here to edit the header",
            clickToEditFooter: "Click here to edit the footer",
            textEditor: "Text editor",
            fieldEditor: "Field editor",

            sectionOptions: "Options",
            sectionMargins: "Set margins",
            removeSection: "Remove section",
            removeSection_Warning: "The section will be removed. Do you wish to continue?",
            removeSection_Forbidden: "The section may not be removed. There must be at least one section in the document.",

            addSectionBefore: "Insert new section before",
            addSectionAfter: "Insert new section after",

            sortSections: "Reorder sections",
            sortSections_Prompt: "Please reorder the sections of the document by dragging them up and down.",

            invalidValuesFound: "Invalid values found. Please correct and try again.",

            bodyMargins: "Page margins",
            defaultMargin: "Default margin",
            defaultMargin_Notes: "Example: 2.5cm. Used only when any of left/right/bottom/top is missing.",
            topMargin: "Top margin",
            topMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            bottomMargin: "Bottom margin",
            bottomMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            leftMargin: "Left margin",
            leftMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            rightMargin: "Right margin",
            rightMargin_Notes: "Example: 2cm. If missing, the default margin is used.",

            headerMargins: "Header margins and height",
            footerMargins: "Footer margins and height",

            height: "Height",

            error: "Error",
            ok: "OK",
            cancel: "Cancel",
            apply: "Apply"
        },

        it: {
            clickToEdit: "Clicca qui per modificare",
            clickToEditField: "Clicca qui per modificare il campo",
            clickToEditHeader: "Clicca qui per modificare l'intestazione",
            clickToEditFooter: "Clicca qui per modificare il piè di pagina",
            textEditor: "Modifica testo",
            fieldEditor: "Modifica campo",

            sectionOptions: "Opzioni",
            sectionMargins: "Imposta margini",
            removeSection: "Elimina sezione",
            removeSection_Warning: "Confermi l'eliminazione della sezione?",
            removeSection_Forbidden: "La sezione non può essere rimossa. Il documento deve contenere almeno una sezione.",

            addSectionBefore: "Inserisci sezione prima",
            addSectionAfter: "Inserisci sezione dopo",

            sortSections: "Cambia ordine sezioni",
            sortSections_Prompt: "Riordinare le sezioni trascinandole su e giù.",

            invalidValuesFound: "Trovati valori non validi. Correggere e riprovare.",

            bodyMargins: "Margini pagina",
            defaultMargin: "Margine predefinito",
            defaultMargin_Notes: "Esempio: 2.5cm. Usato solo quando manca almeno uno dei margini sinistro/destro/inferiore/superiore.",
            topMargin: "Margine superiore",
            topMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            bottomMargin: "Margine inferiore",
            bottomMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            leftMargin: "Margine sinistro",
            leftMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            rightMargin: "Margine destro",
            rightMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",

            headerMargins: "Margini ed altezza dell'intestazione",
            footerMargins: "Margini ed altezza del piè di pagina",

            height: "Altezza",

            error: "Errore",
            ok: "OK",
            cancel: "Annulla",
            apply: "Applica"
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
            }),

            fieldEditor: jpvs.property({
                get: function () {
                    return this.element.data("fieldEditor");
                },
                set: function (value) {
                    this.element.data("fieldEditor", value);
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

        //List of field that require highlighting (we start with an empty jQuery object that is filled during the rendering phase (writeContent))
        var fieldHighlightList = { list: $() };

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
            var headerTopMargin = getMarginProp(headerMargins, "top", "0.5cm");
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
            var footerBottomMargin = getMarginProp(footerMargins, "bottom", "0.5cm");
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

            var footerElementInside = jpvs.writeTag(footerElement, "div");
            footerElementInside.css("position", "absolute");
            footerElementInside.css("bottom", "0px");
            footerElementInside.css("left", "0px");

            //Body
            var bodyElement = jpvs.writeTag(sectionElement, "div");
            bodyElement.addClass("Body");

            //Every section as a small, unobtrusive menu
            var menuContainer = jpvs.writeTag(sectionElement, "div");
            menuContainer.addClass("MenuContainer").css({ position: "absolute", top: "0px", right: "0px", zIndex: (10000 - sectionNum).toString() });
            writeSectionMenu(W, menuContainer, sections, sectionNum, section);

            //Write content, if any
            writeContent(W, headerElement, headerElement, section && section.header && section.header.content, fields, "Header-Hover", section.header.highlight ? "Header-Highlight" : "", function (x) { section.header.content = x; section.header.highlight = true; }, fieldHighlightList, jpvs.DocumentEditor.strings.clickToEditHeader);
            writeContent(W, bodyElement, bodyElement, section && section.body && section.body.content, fields, "Body-Hover", section.body.highlight ? "Body-Highlight" : "", function (x) { section.body.content = x; section.body.highlight = true; }, fieldHighlightList, jpvs.DocumentEditor.strings.clickToEdit);
            writeContent(W, footerElementInside, footerElement, section && section.footer && section.footer.content, fields, "Footer-Hover", section.footer.highlight ? "Footer-Highlight" : "", function (x) { section.footer.content = x; section.footer.highlight = true; }, fieldHighlightList, jpvs.DocumentEditor.strings.clickToEditFooter);

            //Switch off the highlight flags after rendering
            section.header.highlight = false;
            section.body.highlight = false;
            section.footer.highlight = false;
        });

        //Apply field highlighting
        if (fieldHighlightList.list.length) {
            jpvs.flashClass(fieldHighlightList.list, "Field-Highlight");

            //Switch off the field highlight flags after rendering
            if (fields) {
                $.each(fields, function (i, field) {
                    field.highlight = false;
                });
            }
        }
    }

    function writeSectionMenu(W, container, sections, sectionNum, section) {
        var menu = jpvs.Menu.create(container);
        menu.template(["HorizontalMenuBar", "VerticalMenuBar"]);
        menu.itemTemplate(["HorizontalMenuBarItem", "VerticalMenuBarItem"]);
        menu.menuItems([
            {
                text: "...",
                tooltip: jpvs.DocumentEditor.strings.sectionOptions,
                items: [
                    { text: jpvs.DocumentEditor.strings.sectionMargins, click: onSectionMargins(W, section) },
                    jpvs.Menu.Separator,
                    { text: jpvs.DocumentEditor.strings.addSectionBefore, click: onAddSection(W, sections, sectionNum) },
                    { text: jpvs.DocumentEditor.strings.addSectionAfter, click: onAddSection(W, sections, sectionNum + 1) },
                    { text: jpvs.DocumentEditor.strings.removeSection, click: onRemoveSection(W, sections, sectionNum) },
                    jpvs.Menu.Separator,
                    { text: jpvs.DocumentEditor.strings.sortSections, click: onSortSections(W, sections) }
                ]
            }
        ]);
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

    function writeContent(W, element, clickableElement, content, fields, hoverCssClass, highlightCssClass, newContentSetterFunc, fieldHighlightList, placeHolderText) {
        var contentToWrite = content;
        if (!content)
            contentToWrite = "";

        //Clean HTML "content" (becomes xhtml)...
        contentToWrite = jpvs.cleanHtml(contentToWrite);

        //Put a placeholder if missing content
        if ($.trim(contentToWrite) == "")
            contentToWrite = placeHolderText;

        //...make the element clickable (click-to-edit)...
        clickableElement.css("cursor", "pointer").attr("title", jpvs.DocumentEditor.strings.clickToEdit).click(function () {
            onEditFormattedText(W, content, newContentSetterFunc);
            return false;
        }).hover(function () {
            clickableElement.parent().addClass("Section-Hover");
            clickableElement.addClass(hoverCssClass);
        }, function () {
            clickableElement.parent().removeClass("Section-Hover");
            clickableElement.removeClass(hoverCssClass);
        });

        //...and render the sanitized XHTML result, making sure fields are clickable too
        var contentAsXml = XmlParser.parseString("<root>" + contentToWrite + "</root>", null, true);
        renderXHtmlWithFields(W, element, contentAsXml, fields, fieldHighlightList);

        //At the end, do a flashing animation if required to do so
        if (highlightCssClass != "")
            jpvs.flashClass(element, highlightCssClass);
    }

    function renderXHtmlWithFields(W, curElem, xmlNode, fields, fieldHighlightList) {
        //Write the xmlNode into curElem. If the xmlNode is TEXT, then make sure ${FIELD} patterns are made clickable
        if (xmlNode.name == "#TEXT") {
            //This is plain text and it can contain ${FIELD} patterns that must be made clickable
            renderTextWithFields(W, curElem, xmlNode.value || "", fields, fieldHighlightList);
        }
        else if (xmlNode.name == "root") {
            //This is the dummy root node. Let's just write the content, recursively
            if (xmlNode.children) {
                $.each(xmlNode.children, function (i, childNode) {
                    renderXHtmlWithFields(W, curElem, childNode, fields, fieldHighlightList);
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
                    renderXHtmlWithFields(W, newElem, childNode, fields, fieldHighlightList);
                });

                /*
                Exception: if "newElem" is an empty "p", we want to emit "<p>&nbsp;</p>" so we render as an empty paragraph.
                Rationale: HTML editor emit "<p>&nbsp;</p>" when an empty line is desired.
                The htmlClean function above strips it as "<p/>". We want "<p>&nbsp;</p>" instead.

                Sometimes, the user may enter a blank paragraph with spaces. We may end up with "<p><span>    </span></p>".
                The cleaner transforms it into "<p><span/></p>", which the browser renders as nothing. We want "<p><span>&nbsp;</span></p>".

                The basic idea is to filling empty tags like p and span with a non breaking space
                */
                if ((tagName == "p" || tagName == "span") && xmlNode.children.length == 0)
                    jpvs.write(newElem, "\u00a0");
            }
        }
    }

    function renderTextWithFields(W, curElem, text, fields, fieldHighlightList) {
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
            renderText(curElem, textBefore);

            //Then render the clickable field...
            renderField(W, curElem, fields, fieldName, fieldHighlightList);

            //Then update the lastWrittenIndex
            lastWrittenIndex = endIndex;
        }

        //At the end, there is still the ending text missing
        var endingText = text.substring(lastWrittenIndex);
        renderText(curElem, endingText);
    }

    var entitiesToReplace = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": "\"",
        "&apos;": "'"
    };

    function renderText(curElem, text) {
        //Renders the text and replaces a few entities
        var text2 = text;
        $.each(entitiesToReplace, function (entity, replacedText) {
            text2 = text2.replace(entity, replacedText);
        });

        jpvs.write(curElem, text2);
    }

    function renderField(W, curElem, fields, fieldName, fieldHighlightList) {
        //Get info about the field
        var field = fields && fields[fieldName];
        var fieldValue = field && field.value;
        var fieldHighlighted = field && field.highlight;

        if ($.trim(fieldValue) == "")
            fieldValue = jpvs.DocumentEditor.strings.clickToEditField;

        //Render the clickable thing
        var span = jpvs.writeTag(curElem, "span", fieldValue);
        span.addClass("Field").attr("title", jpvs.DocumentEditor.strings.clickToEditField).click(function () {
            onEditField(W, fields, fieldName);
            return false;
        }).hover(function () {
            span.addClass("Field-Hover");
        },
        function () {
            span.removeClass("Field-Hover");
        });

        //Update the jQuery object with the list of all fields to be highlighted
        if (fieldHighlighted)
            fieldHighlightList.list = fieldHighlightList.list.add(span);
    }

    function onEditFormattedText(W, content, newContentSetterFunc) {
        //Let's use the formatted text editor supplied by the user in the richTextEditor property
        //Use a default one if none is set
        var rte = W.richTextEditor() || getDefaultEditor();

        //The richTextEditor gives us an object that defines how to edit rich text
        rte.editText.call(rte, content, onDone);

        function onDone(newContent) {
            //We have the new content. All we need to do is update the W.document property and refresh
            //We use the new content setter provided
            if (newContent !== undefined && newContent != content) {
                newContentSetterFunc(newContent);
                refreshPreview(W);

                //Fire the change event
                W.change.fire(W);
            }
        }
    }

    function onEditField(W, fields, fieldName) {
        //Let's use the field editor supplied by the user in the fieldEditor property
        //Use a default one if none is set
        var fe = W.fieldEditor() || getDefaultFieldEditor();

        //The fieldEditor gives us an object that defines how to edit fields
        var field = fields && fields[fieldName];
        var oldFieldValue = field && field.value;

        fe.editField.call(fe, fields, fieldName, onDone);

        function onDone(newFieldValue) {
            //We have the new field value. All we need to do is update the field and refresh and highlight
            //We use the new content setter provided
            if (newFieldValue !== undefined && newFieldValue != oldFieldValue) {
                fields[fieldName] = { value: newFieldValue, highlight: true };
                refreshPreview(W);

                //Fire the change event
                W.change.fire(W);
            }
        }
    }

    function onSectionMargins(W, section) {
        return function () {
            //Open popup for editing margins
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.sectionMargins).close(function () { this.destroy(); });

            //Create fields
            var tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.bodyMargins);
            var txtAll = writeTextBox(tbl, "defaultMargin", section.margins.all);
            var txtTop = writeTextBox(tbl, "topMargin", section.margins.top);
            var txtBot = writeTextBox(tbl, "bottomMargin", section.margins.bottom);
            var txtLft = writeTextBox(tbl, "leftMargin", section.margins.left);
            var txtRgt = writeTextBox(tbl, "rightMargin", section.margins.right);

            tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.headerMargins);
            var txtHdrAll = writeTextBox(tbl, "defaultMargin", section.header.margins.all);
            var txtHdrTop = writeTextBox(tbl, "topMargin", section.header.margins.top);
            var txtHdrLft = writeTextBox(tbl, "leftMargin", section.header.margins.left);
            var txtHdrRgt = writeTextBox(tbl, "rightMargin", section.header.margins.right);
            var txtHdrHgt = writeTextBox(tbl, "height", section.header.height);

            tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.footerMargins);
            var txtFtrAll = writeTextBox(tbl, "defaultMargin", section.footer.margins.all);
            var txtFtrBot = writeTextBox(tbl, "bottomMargin", section.footer.margins.bottom);
            var txtFtrLft = writeTextBox(tbl, "leftMargin", section.footer.margins.left);
            var txtFtrRgt = writeTextBox(tbl, "rightMargin", section.footer.margins.right);
            var txtFtrHgt = writeTextBox(tbl, "height", section.footer.height);

            //Button bar
            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.apply, click: onApply },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show();

            function checkValues(list) {
                if (!list)
                    return checkValues([
                        txtAll, txtTop, txtBot, txtLft, txtRgt,
                        txtHdrAll, txtHdrTop, txtHdrLft, txtHdrRgt, txtHdrHgt,
                        txtFtrAll, txtFtrBot, txtFtrLft, txtFtrRgt, txtFtrHgt
                    ]);

                var error = false;
                var invalids = [];

                for (var i = 0; i < list.length; i++) {
                    var txt = list[i];
                    txt.removeState(jpvs.states.ERROR);
                    var val = readMarginTextBox(list[i]);
                    if (val === undefined) {
                        //Invalid value
                        txt.addState(jpvs.states.ERROR);
                        invalids.push(txt);
                        error = true;
                    }
                }
                if (error) {
                    //Notify the user and set focus on first invalid value
                    jpvs.alert(jpvs.DocumentEditor.strings.error, jpvs.DocumentEditor.strings.invalidValuesFound, invalids[0]);
                }

                return !error;
            }

            function onOK() {
                if (!checkValues())
                    return;

                pop.hide(function () {
                    //At the end of the animation, apply and destroy
                    onApply();
                    pop.destroy();
                });
            }

            function onApply() {
                if (!checkValues())
                    return;

                //Read all
                section.margins.all = readMarginTextBox(txtAll);
                section.margins.top = readMarginTextBox(txtTop);
                section.margins.bottom = readMarginTextBox(txtBot);
                section.margins.left = readMarginTextBox(txtLft);
                section.margins.right = readMarginTextBox(txtRgt);

                section.header.margins.all = readMarginTextBox(txtHdrAll);
                section.header.margins.top = readMarginTextBox(txtHdrTop);
                section.header.margins.left = readMarginTextBox(txtHdrLft);
                section.header.margins.right = readMarginTextBox(txtHdrRgt);
                section.header.height = readMarginTextBox(txtHdrHgt);

                section.footer.margins.all = readMarginTextBox(txtFtrAll);
                section.footer.margins.bottom = readMarginTextBox(txtFtrBot);
                section.footer.margins.left = readMarginTextBox(txtFtrLft);
                section.footer.margins.right = readMarginTextBox(txtFtrRgt);
                section.footer.height = readMarginTextBox(txtFtrHgt);

                //Update the preview
                refreshPreview(W);

                //Fire the change event
                W.change.fire(W);
            }

            function onCancel() {
                pop.destroy();
            }

        };

        function readMarginTextBox(txt) {
            //Strip all spaces
            var val = $.trim(txt.text().replace(" ", ""));

            //If missing, return null
            if (val == "")
                return null;

            //If invalid, return undefined
            var pattern = /^\+?[0-9]{1,2}(\.[0-9]{1,3})?(cm)?$/gi;
            if (!pattern.test(val))
                return undefined;

            //Append "cm" if missing unit
            if (val.indexOf("cm") < 0)
                val = val + "cm";

            txt.text(val);

            return val;
        }

        function writeTextBox(tbl, label, value) {
            var row = tbl.writeRow();
            row.writeCell(jpvs.DocumentEditor.strings[label]);
            var txt = jpvs.TextBox.create(row.writeCell());
            txt.text(value);

            var notes = jpvs.DocumentEditor.strings[label + "_Notes"];
            if (notes)
                row.writeCell(notes);

            return txt;
        }
    }

    function onAddSection(W, sections, newSectionNum) {
        return function () {
            //New empty section
            var newSection = {
                margins: {
                },
                header: {
                    margins: {}
                },
                footer: {
                    margins: {}
                },
                body: {
                    highlight: true
                }
            };

            //Add at specified index and refresh
            if (newSectionNum >= sections.length)
                sections.push(newSection);
            else
                sections.splice(newSectionNum, 0, newSection);

            refreshPreview(W);

            //Fire the change event
            W.change.fire(W);
        };
    }

    function onRemoveSection(W, sections, sectionNum) {
        return function () {
            if (sections.length < 2) {
                jpvs.alert(jpvs.DocumentEditor.strings.error, jpvs.DocumentEditor.strings.removeSection_Forbidden);
                return;
            }

            jpvs.confirm(jpvs.DocumentEditor.strings.removeSection, jpvs.DocumentEditor.strings.removeSection_Warning, onYes);
        };

        function onYes() {
            //Remove the section and refresh
            sections.splice(sectionNum, 1);
            refreshPreview(W);

            //Fire the change event
            W.change.fire(W);
        }
    }

    function onSortSections(W, sections) {
        return function () {
            //Open popup for sorting sections
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.sortSections).close(function () { this.destroy(); });

            jpvs.writeln(pop, jpvs.DocumentEditor.strings.sortSections_Prompt);
            jpvs.writeTag(pop, "hr");

            //Grid with list of sections
            var grid = jpvs.DataGrid.create(pop);
            grid.template([
                colSectionSorter,
                colSectionText
            ]);

            grid.dataBind(sections);

            //Make it sortable
            grid.element.sortable({ items: "tbody > tr" });

            jpvs.writeTag(pop, "hr");

            //Button bar
            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.apply, click: onApply },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show();

            function colSectionSorter(section) {
                jpvs.writeTag(this, "img").attr("src", jpvs.Resources.images.moveButton);
                this.parent().css("cursor", "move").data("section", section);
            }

            function colSectionText(section) {
                jpvs.write(this, trunc(jpvs.stripHtml(section && section.body && section.body.content)));

                function trunc(x) {
                    if (x.length > 150)
                        return x.substring(0, 147) + "...";
                    else
                        return x;
                }
            }

            function onOK() {
                pop.hide(function () {
                    //At the end of the animation, apply and destroy
                    onApply();
                    pop.destroy();
                });
            }

            function onApply() {
                //Apply the new order
                var trs = grid.element.find("tbody > tr");

                //Empty the array...
                sections.splice(0, sections.length);

                //...and put the items back (in the correct order (they are saved in the TR's data)
                trs.each(function () {
                    var section = $(this).data("section");
                    sections.push(section);
                });

                //Update the preview
                refreshPreview(W);

                //Fire the change event
                W.change.fire(W);
            }

            function onCancel() {
                pop.destroy();
            }

        };
    }

    /*
    Here's a trivial default editor, merely intended for testing purposes or for very simple scenarios
    */
    function getDefaultEditor() {

        function editText(content, onDone) {
            //Create a popup with a simple textarea
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.textEditor).close(function () { this.destroy(); });
            var tb = jpvs.MultiLineTextBox.create(pop);
            tb.text(content);
            tb.element.attr({ rows: 10, cols: 50 });

            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show(function () { tb.focus(); });

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

    /*
    Here's a trivial default field editor, merely intended for testing purposes or for very simple scenarios
    */
    function getDefaultFieldEditor() {

        function editField(fields, fieldName, onDone) {
            //Create a popup with a simple textbox
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.fieldEditor).close(function () { this.destroy(); });
            var tb = jpvs.TextBox.create(pop);

            var field = fields && fields[fieldName];
            var fieldValue = field && field.value;

            tb.text(fieldValue || "");

            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show(function () { tb.focus(); });

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
            editField: editField
        };
    }

})();
