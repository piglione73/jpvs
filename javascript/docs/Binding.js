window.jpvs = window.jpvs || {};

jpvs.resetAllBindings = function () {
    /// <summary>Resets all bindings. After calling this function, all bindings set in place by bindContainer or bind are dropped.
    /// In order to reactivate them you have to call bindContainer or bind again.</summary>
};

jpvs.bindContainer = function (container, dataObject, onChangeDetected, dataBindingAttrName) {
    /// <summary>Sets up a two-way binding between all children of a given html container and a data object. 
    /// Databinding directives are expressed in html "data-bind" attributes and are in the form 
    /// "value=val1,className=val2,#text=val3,checked=!val4, ...". This means that attribute "value" is bound to dataObject.val1, 
    /// attribute "className" is bound to dataObject.val2, jQuery function "text" is bound to dataObject.val3, 
    /// "checked" is bound to the negated value of val4. 
    /// More in general, a databinding directive is a comma-separated list of elements in the form: LHS=RHS.
    /// The left-hand side (LHS) can be: 1) the name of a jpvs widget property (e.g.: selectedValue or text); 
    /// 2) the name of an HTML attribute (e.g.: value or className);
    /// 3) a jQuery function expressed as jQuery.xxxx (e.g.: jQuery.text); 
    /// 4) a pseudo-property expressed as #xxxxx (e.g.: #visible) (currently the only available pseudo-property is "visible").
    /// The right-hand side (RHS) can be: 1) the name of a data object member; 2) the name of a data object member prefixed by an
    /// exclamation mark (like !foo): this means the negated value is two-way bound rather than the value itself.</summary>
    /// <param name="container" type="Object">Container whose children have to be two-way bound: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="onChangeDetected" type="Function">Callback that is called whenever one or more values are propagated between the container and the dataObject, in either direction. The signature is: function onChangeDetected(towardsElement, towardsDataObject) {}. The two arguments are boolean flags.</param>
    /// <param name="dataBindingAttrName" type="String">Optional: name of the attribute that will contain databinding directives. The default is "bind", meaning that the "data-bind" attribute will be used. If you pass "xxx", then the "data-xxx" attribute will be used.</param>
};

jpvs.bind = function (element, dataObject, dataBind, onChangeDetected) {
    /// <summary>Sets up a two-way binding between an element and a data object.</summary>
    /// <param name="element" type="Object">Element that has to be two-way bound: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="dataBind" type="String">Value of the "data-bind" attribute to be used. See jpvs.bindContainer for additional information.</param>
    /// <param name="onChangeDetected" type="Function">Callback that is called whenever one or more values are propagated between the container and the dataObject, in either direction. The signature is: function onChangeDetected(towardsElement, towardsDataObject) {}. The two arguments are boolean flags.</param>
};

jpvs.findElementsBoundTo = function (dataObject, objectPropertyName) {
    /// <summary>Finds all elements/widgets bound to the specified property of the specified data object.
    ///  All elements/widgets bound to that property will be returned as an array.</summary>
    /// <param name="dataObject" type="Object">Data object.</param>
    /// <param name="objectPropertyName" type="Object">Name of a data object property.</param>
};


