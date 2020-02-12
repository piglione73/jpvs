window.jpvs = window.jpvs || {};

jpvs.Button = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    
    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Button,
    type: "Button",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the button.</summary>
            return this;
        }
    }
});


jpvs.writeButtonBar = function (container, buttons) {
    /// <summary>Writes a button bar (a DIV with class "ButtonBar" with buttons inside).</summary>
    /// <param name="container" type="Object">Where to write the button bar: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="buttons" type="Array">Array of button definitions. A button definition is like this: { text: "OK", click: eventHandler, cssClass: CSS class }</param>
    /// <returns type="jQuery">A jQuery object that wraps the element just written.</returns>

    return $("*");
};
