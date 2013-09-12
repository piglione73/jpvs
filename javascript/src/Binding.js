/* JPVS
Module: core
Classes: jpvs
Depends: bootstrap
*/

(function () {

    jpvs.bindContainer = function (container, dataObject, dataBindingAttrName) {
        enableChangeMonitor();

        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = jpvs.getElementIfWidget(container);

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
        enableChangeMonitor();

        if (!dataObject)
            return;

        //Let's parse the "data-bind" attribute into a list of bindings and put them in place
        var items = $.trim(dataBind).split(",");
        $.each(items, function (i, item) {
            var subitems = item.split("=");
            var elementPropertyName = $.trim(subitems[0]);
            var objectPropertyName = $.trim(subitems[1]);
            bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName);
        });
    };

    function bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName) {
        //First copy from dataObject to element
        var getter = getterDataObjectProperty(dataObject, objectPropertyName);
        var setter = setterElementProperty(element, elementPropertyName);
        setter(getter());

        //Let's setup a two-way binding
        //From element to dataObject
        onElementPropertyChange(element, elementPropertyName, setterDataObjectProperty(dataObject, objectPropertyName));

        //From dataObject to element
        onDataObjectPropertyChange(dataObject, objectPropertyName, setterElementProperty(element, elementPropertyName));
    }

    function onElementPropertyChange(element, elementPropertyName, onChangeAction) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the element property
        var getter = getterElementProperty(element, elementPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        var bindingId = element.data("jpvs.binding.id");
        if (!bindingId) {
            bindingId = jpvs.randomString(20);
            element.data("jpvs.binding.id", bindingId);
        }
        var bindingId2 = element.data("jpvs.binding.id");

        var key = bindingId + "/" + elementPropertyName;
        changeMonitorQueue.put(key, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            onChangeAction(value);
        });
    }

    function onDataObjectPropertyChange(dataObject, objectPropertyName, onChangeAction) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the dataObject property
        var getter = getterDataObjectProperty(dataObject, objectPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        var key = "$DATAOBJECT$/" + objectPropertyName;
        changeMonitorQueue.put(key, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            onChangeAction(value);
        });
    }

    function getterDataObjectProperty(dataObject, objectPropertyName) {
        var prop = dataObject[objectPropertyName];
        if (typeof (prop) == "function") {
            //It's a jpvs.property; the getter must read from the property
            return function () {
                return prop();
            };
        }
        else {
            //It's a normal value; the getter must simply read the current value
            return function () {
                return dataObject[objectPropertyName];
            };
        }
    }

    function setterDataObjectProperty(dataObject, objectPropertyName) {
        var prop = dataObject[objectPropertyName];
        if (typeof (prop) == "function") {
            //It's a jpvs.property; the setter must assign the value to the property
            return function (value) {
                prop(value);
            };
        }
        else {
            //It's a normal value; the setter must overwrite it with the new one
            return function (value) {
                dataObject[objectPropertyName] = value;
            };
        }
    }

    function getterElementProperty(element, elementPropertyName) {
        //If element is a widget, let's first try to use it as a widget by accessing its properties
        var widget = jpvs.find(element);
        if (widget) {
            //Let's see if widget has a property with that name
            var prop = widget[elementPropertyName];
            if (typeof (prop) == "function") {
                //It's a jpvs.property; the getter must read the value from the property
                return function () {
                    return prop();
                };
            }
        }

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes
        return function () {
            return element.attr(elementPropertyName);
        };
    }

    function setterElementProperty(element, elementPropertyName) {
        //If element is a widget, let's first try to use it as a widget by accessing its properties
        var widget = jpvs.find(element);
        if (widget) {
            //Let's see if widget has a property with that name
            var prop = widget[elementPropertyName];
            if (typeof (prop) == "function") {
                //It's a jpvs.property; the setter must assign the value to the property
                return function (value) {
                    prop(value);
                };
            }
        }

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes
        return function (value) {
            element.attr(elementPropertyName, value);
        };
    }

    var chgMonitorThread;

    function enableChangeMonitor() {
        if (!chgMonitorThread) {
            chgMonitorThread = setInterval(changeMonitor, 200);
        }
    }

    function disableChangeMonitor() {
        if (chgMonitorThread) {
            clearInterval(chgMonitorThread);
            chgMonitorThread = null;
        }
    }

    function ChangeMonitorQueue() {
        this.queue = {};
    }

    ChangeMonitorQueue.prototype.put = function (key, getter, onChangeAction) {
        this.queue[key] = {
            key: key,
            getter: getter,
            onChangeAction: onChangeAction,
            curValue: getter()
        };
    };

    var changeMonitorQueue = new ChangeMonitorQueue();

    function changeMonitor() {
        //Let's process the queue looking for changes
        $.each(changeMonitorQueue.queue, function (key, item) {
            var newValue = item.getter();
            if (newValue != item.curValue) {
                //Change detected: let's inform the listener function
                item.onChangeAction(newValue);

                //Then let's update the current value after returning from onChangeAction (in case something changed further)
                item.curValue = item.getter();
            }
        });
    }

})();
