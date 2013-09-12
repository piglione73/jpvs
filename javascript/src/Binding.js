/* JPVS
Module: core
Classes: jpvs
Depends: bootstrap
*/

(function () {

    jpvs.bindContainer = function (container, dataObject, dataBindingAttrName) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        //We want to two-way bind every element (ordinary element or jpvs widget) to dataObject
        //Let's look for elements that specify a binding in attribute "data-bind"
        container.find("*").each(function () {
            //Loop over all elements in container and see if they need binding
            var obj = this;
            var $this = $(obj);

            //Let's read the "data-bind" attribute (or another name if specified)
            var dataBind = $this.data(dataBindingAttrName || "bind");
            if (dataBind) {
                //If "data-bind" is specified, apply it
                jpvs.bind($this, dataObject, dataBind);
            }
        });
    };

    jpvs.bind = function (element, dataObject, dataBind) {
        if (!dataObject)
            return;

        //Let's parse the "data-bind" attribute into a list of bindings and put them in place
        var items = $.trim(dataBind).split(",");
        $.each(items, function (i, item) {
            var subitems = item.split("=");
            var elementProperty = $.trim(subitems[0]);
            var objectProperty = $.trim(subitems[1]);
            bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName);
        });
    };

    function bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName) {
        throw "Not implemented";
    }

})();
