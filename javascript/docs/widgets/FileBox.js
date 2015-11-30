window.jpvs = window.jpvs || {};

jpvs.FileBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    /// <summary>This event is raised whenever the user selects a file; the event handler receives an object in the form
    /// { name: ..., size: ..., type: ... }.</summary>
    this.fileselected = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.FileBox,
    type: "FileBox",

    prototype: {
        file: function (value) {
            /// <summary>Property: object containing information about the file contained in this FileBox. It is in the form 
            /// { icon: "url of the icon",  label: "text to be displayed", url: "url for opening the file" }. 
            /// This property never changes automatically. The expected usage is: 
            /// (1) the user selects a file; (2) the "fileselected" event is raised; (3) in the "fileselected" handler, the user code 
            /// calls the "postFile" method, passing a callback that sets the "file" property based on the selected file info.</summary>
            return this;
        },

        postFile: function (url, callback) {
            /// <summary>Posts the file to the given url. At the end, the callback is called.</summary>
        }
    }
});


