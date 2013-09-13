window.jpvs = window.jpvs || {};

jpvs.bindContainer = function (container, dataObject, dataBindingAttrName) {
    /// <summary>Sets up a two-way binding between all children of a given html container and a data object. Databinding directives are expressed in html "data-bind" attributes and are in the form "value=val1,className=val2,...". This means that attribute "value" is bound to dataObject.val1 and attribute "className" is bound to dataObject.val2. You can specify attributes or widget properties on the left-hand side. You can specify data object member names on the right-hand side.</summary>
    /// <param name="container" type="Object">Container whose children have to be two-way bound: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="dataBindingAttrName" type="String">Optional: name of the attribute that will contain databinding directives. The default is "bind", meaning that the "data-bind" attribute will be used. If you pass "xxx", then the "data-xxx" attribute will be used.</param>
};

jpvs.bind = function (element, dataObject, dataBind) {
    /// <summary>Sets up a two-way binding between an element and a data object.</summary>
    /// <param name="element" type="Object">Element that has to be two-way bound: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="dataBind" type="String">Value of the "data-bind" attribute to be used. See jpvs.bindContainer for additional information.</param>
};



