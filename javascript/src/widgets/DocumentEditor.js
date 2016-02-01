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
            apply: "Apply",

            oddEven: "Odd/Even pages",
            whichContent: "Which content do you wish to edit?",
            oddPages: "Odd pages",
            evenPages: "Even pages"
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
            apply: "Applica",

            oddEven: "Pagine dispari/pari",
            whichContent: "Quale testo si desidera modificare?",
            oddPages: "Pagine dispari",
            evenPages: "Pagine pari"
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
                setTask: function (value) {
                    //Async setter.
                    //The document is saved immediately in zero time
                    this.element.data("document", value);

                    //Let's synchronously/immediately empty the content, so that the user can't interact until the task
                    //has created some of the content. We don't want the user to update things that might be related to the previous
                    //version of the displayed document. As soon as this property setter is invoked, the old version of the document
                    //disappears and can't be interacted with any longer. Then, in background, the new content is displayed and the user
                    //can start interacting with it even if the task is not finished yet. As soon as the first section is displayed, it
                    //is live and this does not interfere with the still-running refreshPreviewTask.
                    this.element.empty()

                    /*
                    Refresh the preview.
                    The preview has clickable parts; the user clicks on a part to edit it
                    */
                    //Let's return the task for updating the preview, so we work in background in case
                    //the document is complex and the UI remains responsive during the operation
                    return refreshPreviewTask(this);
                }
            }),

            fields: jpvs.property({
                get: function () {
                    var doc = this.document();
                    return doc && doc.fields;
                },
                set: function (value) {
                    //Value contains only the fields that we want to change
                    refreshFieldSet(this, value);
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
            }),

            fieldDisplayMapper: jpvs.property({
                get: function () {
                    return this.element.data("fieldDisplayMapper");
                },
                set: function (value) {
                    this.element.data("fieldDisplayMapper", value);
                }
            }),

            allowEvenOddHeadersFooters: jpvs.property({
                get: function () {
                    return this.element.data("allowEvenOddHeadersFooters");
                },
                set: function (value) {
                    this.element.data("allowEvenOddHeadersFooters", value);
                }
            })
        }
    });

    function refreshFieldSet(W, fieldChangeSet) {
        var doc = W.document();
        var fields = doc && doc.fields;

        //Refresh all occurrences of the fields; flash those highlighted
        var flashingQueue = $();
        W.element.find("span.Field").each(function () {
            var fld = $(this);

            //Check that this is a field
            var fieldInfo = fld.data("jpvs.DocumentEditor.fieldInfo");
            var thisFieldName = fieldInfo && fieldInfo.fieldName;
            if (thisFieldName) {
                //OK, this is a field
                //Let's see if we have to update it
                var newField = fieldChangeSet[thisFieldName];
                if (newField) {
                    //Yes, we have to update it
                    //Let's update the doc, without highlight
                    fields[thisFieldName] = { value: newField.value };

                    //Let's update the DOM element, optionally mapping the text that we render into the field area
                    //Optionally map the text that will be rendered into the field area
                    var defaultFieldDisplayMapper = function (text) { return text; };
                    var fieldDisplayMapper = W.fieldDisplayMapper() || defaultFieldDisplayMapper;
                    var fieldDisplayedValue = fieldDisplayMapper(newField.value);
                    jpvs.write(fld.empty(), fieldDisplayedValue);

                    //Let's enqueue for flashing, if requested
                    if (newField.highlight)
                        flashingQueue = flashingQueue.add(fld);
                }
            }
        });

        //Finally, flash the marked fields
        if (flashingQueue.length)
            jpvs.flashClass(flashingQueue, "Field-Highlight");
    }

    function refreshPreview(W) {
        //Launch the task synchronously
        var task = refreshPreviewTask(W);
        jpvs.runForegroundTask(task);
    }

    function refreshPreviewSingleSection(W, sectionNum) {
        var fieldHighlightList = getEmptyFieldHighlightList();
        refreshSingleSectionContent(W, sectionNum, fieldHighlightList);
        applyFieldHighlighting(W, fieldHighlightList);
    }

    function refreshPreviewAsync(W) {
        //Launch the task asynchronously
        var task = refreshPreviewTask(W);
        jpvs.runBackgroundTask(task);
    }

    function refreshPreviewTask(W) {
        //Let's return the task function
        //We use "ctx" for storing the local variables.
        return function (ctx) {
            //Init the state machine, starting from 1 (only when null)
            ctx.executionState = ctx.executionState || 1;

            //First part, init some local variables
            if (ctx.executionState == 1) {
                ctx.elem = W.element;
                ctx.doc = W.document();
                ctx.sections = ctx.doc && ctx.doc.sections;
                ctx.fields = ctx.doc && ctx.doc.fields;

                //List of fields that require highlighting (we start with an empty jQuery object that is filled during the rendering phase (writeContent))
                ctx.fieldHighlightList = getEmptyFieldHighlightList();

                //Yield control
                ctx.executionState = 2;
                return { progress: "0%" };
            }

            //Second part, create all blank pages with "loading" animated image
            if (ctx.executionState == 2) {
                //We save all elements by section here:
                ctx.domElems = [];

                //Delete all contents...
                //We already deleted it in the "document" property setter. We do this again, just to be sure that we start this
                //execution state with an empty object
                ctx.elem.empty()

                //Since it's fast, let's create all the blank pages all at a time and only yield at the end
                $.each(ctx.sections, function (sectionNum, section) {
                    //Every section is rendered as a pseudo-page (DIV with class="Section" and position relative (so we can absolutely position header/footer))
                    var sectionElement = jpvs.writeTag(ctx.elem, "div");
                    sectionElement.addClass("Section").css("position", "relative");

                    //Store the sectionNum within the custom data
                    sectionElement.data("jpvs.DocumentEditor.sectionNum", sectionNum);

                    //Apply page margins
                    applySectionPageMargins(sectionElement, section);

                    //Header (absolutely positioned inside the section with margins/height)
                    var headerElement = jpvs.writeTag(sectionElement, "div");
                    headerElement.addClass("Header");
                    applySectionHeaderMargins(headerElement, section);

                    //Footer (absolutely positioned inside the section with margins/height)
                    var footerElement = jpvs.writeTag(sectionElement, "div");
                    footerElement.addClass("Footer");
                    applySectionFooterMargins(footerElement, section);

                    var footerElementInside = jpvs.writeTag(footerElement, "div");
                    footerElementInside.css("position", "absolute");
                    footerElementInside.css("bottom", "0px");
                    footerElementInside.css("left", "0px");
                    footerElementInside.css("right", "0px");

                    //Body
                    var bodyElement = jpvs.writeTag(sectionElement, "div");
                    bodyElement.addClass("Body");
                    jpvs.writeTag(bodyElement, "img").attr("src", jpvs.Resources.images.loading);

                    //Now let's save all DOM elements for the remaining execution states
                    ctx.domElems.push({
                        sectionElement: sectionElement,
                        headerElement: headerElement,
                        bodyElement: bodyElement,
                        footerElementInside: footerElementInside,
                        footerElement: footerElement
                    });

                    //Save also something for later (refreshSingleSectionContent)
                    sectionElement.data("jpvs.DocumentEditor.domElem", {
                        headerElement: headerElement,
                        bodyElement: bodyElement,
                        footerElementInside: footerElementInside,
                        footerElement: footerElement
                    });
                });

                //Yield control
                ctx.executionState = 3;
                return { progress: "1%" };
            }

            //Third part: fill all sections with header/footer/body, one at a time
            if (ctx.executionState == 3) {
                //Loop over all sections one at a time
                if (ctx.sectionNum == null)
                    ctx.sectionNum = 0;
                else
                    ctx.sectionNum++;

                if (ctx.sectionNum >= ctx.sections.length) {
                    //Reset loop conter
                    ctx.sectionNum = null;

                    //Yield control and go to next execution state
                    ctx.executionState = 4;
                    return { progress: "90%" };
                }

                var section = ctx.sections[ctx.sectionNum];
                var domElem = ctx.domElems[ctx.sectionNum];

                //Write content, if any
                refreshSingleSectionContent(W, ctx.sectionNum, ctx.fieldHighlightList);

                //Switch off the highlight flags after rendering
                if (section.header)
                    section.header.highlight = false;
                if (section.body)
                    section.body.highlight = false;
                if (section.footer)
                    section.footer.highlight = false;

                //Yield control without changing execution state
                //Progress from 1 up to 90%
                var progr = 1 + Math.floor(ctx.sectionNum / (ctx.sections.length - 1) * 89);
                return { progress: progr + "%" };
            }

            //Fourth part: create section menus, one at a time
            if (ctx.executionState == 4) {
                //Loop over all sections one at a time
                if (ctx.sectionNum == null)
                    ctx.sectionNum = 0;
                else
                    ctx.sectionNum++;

                if (ctx.sectionNum >= ctx.sections.length) {
                    //Reset loop conter
                    ctx.sectionNum = null;

                    //Yield control and go to next execution state
                    ctx.executionState = 5;
                    return { progress: "99%" };
                }

                var section = ctx.sections[ctx.sectionNum];
                var domElem = ctx.domElems[ctx.sectionNum];

                //Every section has a small, unobtrusive menu
                var menuContainer = jpvs.writeTag(domElem.sectionElement, "div");
                menuContainer.addClass("MenuContainer").css({ position: "absolute", top: "0px", right: "0px", zIndex: (10000 - ctx.sectionNum).toString() });
                writeSectionMenu(W, menuContainer, ctx.sections, ctx.sectionNum, section);

                //Yield control without changing execution state
                //Progress from 90% to 99%
                var progr = 90 + Math.floor(ctx.sectionNum / (ctx.sections.length - 1) * 9);
                return { progress: progr + "%" };
            }

            //Fifth part: apply field highlighting and terminate the task
            if (ctx.executionState == 5) {
                applyFieldHighlighting(W, ctx.fieldHighlightList);

                //End of task
                return false;
            }
        };
    }

    function getEmptyFieldHighlightList() {
        return { list: $() };
    }

    function applySectionPageMargins(sectionElement, section) {
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
    }

    function applySectionHeaderMargins(headerElement, section) {
        var margins = section && section.margins;
        var leftMargin = getMarginProp(margins, "left", "2cm");
        var rightMargin = getMarginProp(margins, "right", "2cm");

        var headerMargins = section && section.header && section.header.margins;
        var headerTopMargin = getMarginProp(headerMargins, "top", "0.5cm");
        var headerLeftMargin = getMarginProp(headerMargins, "left", leftMargin);
        var headerRightMargin = getMarginProp(headerMargins, "right", rightMargin);
        var headerHeight = (section && section.header && section.header.height) || "1cm";

        headerElement.css("position", "absolute");
        headerElement.css("overflow", "hidden");
        headerElement.css("top", headerTopMargin);
        headerElement.css("left", headerLeftMargin);
        headerElement.css("right", headerRightMargin);
        headerElement.css("height", headerHeight);
    }

    function applySectionFooterMargins(footerElement, section) {
        var margins = section && section.margins;
        var leftMargin = getMarginProp(margins, "left", "2cm");
        var rightMargin = getMarginProp(margins, "right", "2cm");

        var footerMargins = section && section.footer && section.footer.margins;
        var footerBottomMargin = getMarginProp(footerMargins, "bottom", "0.5cm");
        var footerLeftMargin = getMarginProp(footerMargins, "left", leftMargin);
        var footerRightMargin = getMarginProp(footerMargins, "right", rightMargin);
        var footerHeight = (section && section.footer && section.footer.height) || "1cm";

        footerElement.css("position", "absolute");
        footerElement.css("overflow", "hidden");
        footerElement.css("bottom", footerBottomMargin);
        footerElement.css("left", footerLeftMargin);
        footerElement.css("right", footerRightMargin);
        footerElement.css("height", footerHeight);
    }

    function refreshSingleSectionContent(W, sectionNum, fieldHighlightList) {
        var sectionElement = W.element.find("div.Section").eq(sectionNum);
        var domElem = sectionElement.data("jpvs.DocumentEditor.domElem");

        var doc = W.document();
        var sections = doc && doc.sections;
        var fields = doc && doc.fields;
        var section = sections && sections[sectionNum];

        //Refresh margins
        applySectionPageMargins(sectionElement, section);
        applySectionHeaderMargins(domElem.headerElement, section);
        applySectionFooterMargins(domElem.footerElement, section);

        //Refresh content
        writeContent(
            W,
            domElem.headerElement,
            domElem.headerElement,
            section && section.header && section.header.content,
            fields,
            "Header-Hover",
            section && section.header && section.header.highlight ? "Header-Highlight" : "",
            function (x) { section.header = section.header || {}; section.header.content = x; section.header.highlight = true; },
            fieldHighlightList,
            jpvs.DocumentEditor.strings.clickToEditHeader,
            section && section.header && section.header.content_even,
            function (x) { section.header = section.header || {}; section.header.content_even = x; section.header.highlight = true; }
        );

        writeContent(
            W,
            domElem.bodyElement,
            domElem.bodyElement,
            section && section.body && section.body.content,
            fields,
            "Body-Hover",
            section && section.body && section.body.highlight ? "Body-Highlight" : "",
            function (x) { section.body = section.body || {}; section.body.content = x; section.body.highlight = true; },
            fieldHighlightList,
            jpvs.DocumentEditor.strings.clickToEdit,
            null,
            null
        );

        writeContent(
            W,
            domElem.footerElementInside,
            domElem.footerElement,
            section && section.footer && section.footer.content,
            fields,
            "Footer-Hover",
            section && section.footer && section.footer.highlight ? "Footer-Highlight" : "",
            function (x) { section.footer = section.footer || {}; section.footer.content = x; section.footer.highlight = true; },
            fieldHighlightList,
            jpvs.DocumentEditor.strings.clickToEditFooter,
            section && section.footer && section.footer.content_even,
            function (x) { section.footer = section.footer || {}; section.footer.content_even = x; section.footer.highlight = true; }
        );

        //After rendering, turn the highlight flag off
        if (section && section.header && section.header.highlight)
            section.header.highlight = false;

        if (section && section.body && section.body.highlight)
            section.body.highlight = false;

        if (section && section.footer && section.footer.highlight)
            section.footer.highlight = false;
    }

    function applyFieldHighlighting(W, fieldHighlightList) {
        if (fieldHighlightList.list.length) {
            jpvs.flashClass(fieldHighlightList.list, "Field-Highlight");

            //Switch off the field highlight flags after rendering
            var doc = W.document();
            var fields = doc && doc.fields;
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
                    { text: jpvs.DocumentEditor.strings.sectionMargins, click: onSectionMargins(W, section, sectionNum) },
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

    function writeContent(W, element, clickableElement, content, fields, hoverCssClass, highlightCssClass, newContentSetterFunc, fieldHighlightList, placeHolderText, evenPagesContent, newEvenPagesContentSetterFunc) {
        var contentToWrite = content;
        if (!content)
            contentToWrite = "";

        //Remove the "loading" image
        element.empty();

        //Get the sectionNum
        var sectionElement = clickableElement.parent();
        var sectionNum = sectionElement.data("jpvs.DocumentEditor.sectionNum");

        //Clean HTML "content" (becomes xhtml)...
        contentToWrite = jpvs.cleanHtml(contentToWrite);

        //Put a placeholder if missing content
        if ($.trim(contentToWrite) == "")
            contentToWrite = placeHolderText;

        //...make the element clickable (click-to-edit)...
        clickableElement.css("cursor", "pointer").attr("title", jpvs.DocumentEditor.strings.clickToEdit).unbind(".writeContent").bind("click.writeContent", function () {
            editContent();
            return false;
        }).bind("mouseenter.writeContent", function () {
            clickableElement.parent().addClass("Section-Hover");
            clickableElement.addClass(hoverCssClass);
        }).bind("mouseleave.writeContent", function () {
            clickableElement.parent().removeClass("Section-Hover");
            clickableElement.removeClass(hoverCssClass);
        });

        //...and render the sanitized XHTML result, making sure fields are clickable too
        var contentAsXml = XmlParser.parseString("<root>" + contentToWrite + "</root>", null, true);
        renderXHtmlWithFields(W, element, contentAsXml, fields, fieldHighlightList);

        //At the end, do a flashing animation if required to do so
        if (highlightCssClass != "")
            jpvs.flashClass(element, highlightCssClass);

        function editContent() {
            if (!newEvenPagesContentSetterFunc || !W.allowEvenOddHeadersFooters()) {
                //Simple case: no evenPagesContent or odd/even header/footer non allowed. We edit the main content.
                editOddContent();
            }
            else {
                //Complex case: odd/even headers/footers are allowed and we have a newEvenPagesContentSetterFunc (i.e.: we are
                //on a header or a footer)
                //We must ask the user what to edit: standard content or even pages content?
                jpvs.confirm(jpvs.DocumentEditor.strings.oddEven, jpvs.DocumentEditor.strings.whichContent, editOddContent, editEvenContent, jpvs.DocumentEditor.strings.oddPages, jpvs.DocumentEditor.strings.evenPages);
            }
        }

        function editOddContent() {
            onEditFormattedText(W, content, newContentSetterFunc, sectionNum);
        }

        function editEvenContent() {
            onEditFormattedText(W, evenPagesContent, newEvenPagesContentSetterFunc, sectionNum);
        }
    }

    function renderXHtmlWithFields(W, curElem, xmlNode, fields, fieldHighlightList) {
        //Write the xmlNode into curElem. If the xmlNode is TEXT, then make sure ${FIELD} patterns are made clickable
        if (xmlNode.name == "#TEXT") {
            //This is plain text and it can contain ${FIELD} patterns that must be made clickable
            renderTextWithFields(W, curElem, xmlNode.value || "", fields, fieldHighlightList);
        }
        else if (xmlNode.name == "#COMMENT") {
            //This is a comment. Render it unaltered. If the comment contains "pagebreak", then render as <hr/>
            //(The TinyMCE editor treats pagebreaks as special "<!-- pagebreak -->" comments
            var commentText = xmlNode.value || "";
            if (commentText.indexOf("pagebreak") < 0) {
                var comment = document.createComment(xmlNode.value || "");
                curElem.append(comment);
            }
            else {
                //Special "pagebreak" comment. Make it visible.
                jpvs.writeTag(curElem, "hr");
            }
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
                At the end of a "p" paragraph, we write a <br/> so we are sure that an empty paragraph is rendered
                as a blank line, while a non-empty paragraph is rendered as usual (because a <br/> at the end of a paragraph
                has non effects).
                */
                if (tagName == "p")
                    jpvs.writeTag(newElem, "br");
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

        //Optionally map the text that will be rendered into the field area
        var defaultFieldDisplayMapper = function (text) { return text; };
        var fieldDisplayMapper = W.fieldDisplayMapper() || defaultFieldDisplayMapper;
        fieldValue = fieldDisplayMapper(fieldValue);

        //If empty, render a placeholder text instead
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

        //Mark as field also internally for security purposes
        //So if some span exists with class="Field" we don't get tricked into thinking it's a field
        span.data("jpvs.DocumentEditor.fieldInfo", {
            fieldName: fieldName
        });

        //Update the jQuery object with the list of all fields to be highlighted
        if (fieldHighlighted)
            fieldHighlightList.list = fieldHighlightList.list.add(span);
    }

    function onEditFormattedText(W, content, newContentSetterFunc, sectionNum) {
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
                refreshPreviewSingleSection(W, sectionNum);

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
            if (newFieldValue !== undefined && newFieldValue != oldFieldValue) {
                //Field changed. Let's update with highlight
                //We use a change set with a single field
                var fieldChangeSet = {};
                fieldChangeSet[fieldName] = { value: newFieldValue, highlight: true };
                refreshFieldSet(W, fieldChangeSet);

                //Fire the change event
                W.change.fire(W);
            }
        }
    }

    function onSectionMargins(W, section, sectionNum) {
        return function () {
            //Open popup for editing margins
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.sectionMargins).close(function () { this.destroy(); });

            //Ensure missing properties are present, so we can read/write margins
            section.margins = section.margins || {};

            section.header = section.header || {};
            section.header.margins = section.header.margins || {};

            section.footer = section.footer || {};
            section.footer.margins = section.footer.margins || {};

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
                refreshPreviewSingleSection(W, sectionNum);

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

            refreshPreviewAsync(W);

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
            refreshPreviewAsync(W);

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
                refreshPreviewAsync(W);

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
