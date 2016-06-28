window.jpvs = window.jpvs || {};

jpvs.FileBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    /// <summary>This event is raised whenever the user selects a file; the event handler receives an object in the form
    /// { name: ..., size: ..., type: ... }.</summary>
    this.fileselected = jpvs.event(this);

    /// <summary>This event is raised whenever the user deletes a file.</summary>
    this.filedeleted = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.FileBox,
    type: "FileBox",

    prototype: {
        enabled: function (value) {
            /// <summary>Property: if true, the user can upload/remove and open. If disabled, the user can only open.</summary>
            return this;
        },

        file: function (value) {
            /// <summary>Property: object containing information about the file contained in this FileBox. It is in the form 
            /// { icon: "url of the icon",  label: "text to be displayed", url: "url for opening the file" }. 
            /// This property never changes automatically. The expected usage is: 
            /// (1) the user selects a file; (2) the "fileselected" event is raised; (3) in the "fileselected" handler, the user code 
            /// calls the "postFile" method, passing a callback that sets the "file" property based on the selected file info.</summary>
            return this;
        },

        postFile: function (url, callback) {
            /// <summary>Posts the file to the given url. At the end, the callback is called with a single argument, which is the
            /// responseText received from the http post call.
            /// If a file is selected, it is POST'ed and a FileName header is sent along with it.
            /// Otherwise, if no file is selected, an empty content body is POST'ed and a FileNull header is sent along with it.</summary>
        }
    }
});
