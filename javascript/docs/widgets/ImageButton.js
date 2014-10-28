window.jpvs = window.jpvs || {};

jpvs.ImageButton = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.ImageButton,
    type: "ImageButton",

    prototype: {
        imageUrls: function (value) {
            /// <summary>Property: image urls. It is in the form { normal: String, hover: String }. The two urls contain the two states of the image button: the normal state and the hovering state.</summary>
            return this;
        },

        getNormalImage: function (value) {
            /// <summary>Gets the normal state image url</summary>
            return "";
        },

        getHoverImage: function (value) {
            /// <summary>Gets the hovering state image url</summary>
            return "";
        }
    }
});

