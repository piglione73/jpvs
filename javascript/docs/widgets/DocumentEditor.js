window.jpvs = window.jpvs || {};



jpvs.DocumentEditor = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};


jpvs.makeWidget({
    widget: jpvs.DocumentEditor,
    type: "DocumentEditor",

    prototype: {
        document: function (value) {
            /// <summary>Property: document content to display in the editor. It is in the form: { sections: [ { margins: { all: "2cm", top: "...", left: "...", right: "...", bottom: "..." }, header: { margins: { all: "2cm", top: "...", left: "...", right: "..." }, height: "...", content: "(x)html content", highlight: true/false }, footer: { margins: { all: "2cm", bottom: "...", left: "...", right: "..." }, height: "...", content: "(x)html content", highlight: true/false }, body: { content: "(x)html content", highlight: true/false } }, ... ], fields: { fieldName1: { value: "...", highlight: true/false }, fieldName2: { ... } } }.</summary>
            return this;
        },

        fields: function (value) {
            /// <summary>Property: the getter returns the fields (it is equivalent to calling "document().fields"); the setter can change one or more fields and immediately updates the preview. The value is in the form { a: { value: ..., highlight: false }, xxx: { value: ..., highlight: true }, ... }. In this example, fields "a" and "xxx" would be updated (only "xxx" would be highlighted) and all the remaining document fields would be left untouched.</summary>
            return this;
        },

        richTextEditor: function (value) {
            /// <summary>Property: rich text editor. This property allows any rich text editor to be used. Just pass an object like this: { editText: function(content, onDone) {} }. The function is responsible for displaying the rich text editor and allows the user to change the content. The function takes two parameters: (1) "content" is the (X)HTML content to show; (2) onDone is a callback function like this: function onDone(newContent) {}. The editText function must call the onDone callback when the user is done editing the content.</summary>
            return this;
        },

        fieldEditor: function (value) {
            /// <summary>Property: field editor. This property allows any field editor to be used. Just pass an object like this: { editField: function(fields, fieldName, onDone) {} }. The function is responsible for displaying the field editor and allows the user to change the content. The function takes three parameters: (1) "fields" is the fields collection as passed to the "document" property; (2) "fieldName" is the field name that must be edited; (3) onDone is a callback function like this: function onDone(newValue) {}. The editField function must call the onDone callback when the user is done editing the field.</summary>
            return this;
        },

        fieldDisplayMapper: function (value) {
            /// <summary>Property: optional field display mapper. If present, changes the way the field is rendered in the document editor.
            /// It does not change the field value, only the way it is rendered in the document editor. It is a function(text) {} that
            /// must return the text to render. The default field display mapper is function(text) { return text; }. With the default
            /// field display mapper, field values are displayed. By changing this property, you can choose to display some other
            /// text instead of the field value.</summary>
            return this;
        },

        allowEvenOddHeadersFooters: function (value) {
            /// <summary>Property: true to allow setting different headers/footers for even pages and odd pages.</summary>
        },

        customOverlay: function (value) {
            /// <summary>Property: function that can be used to add a custom overlay on each section. If null/undefined, no custom overlay will be displayed. If specified, the function will be called when the section is loaded/refreshed.
            /// The function prototype is: function(widget, sectionElement, section). The sectionElement is the DIV element of the section. The "section" argument is the document section.
            /// </summary >
        }
    }
});

