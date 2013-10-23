﻿/* JPVS
Module: binding
Classes: 
Depends: core
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
        var relation = {
            idFrom: getElementBindingID(element) + "/" + elementPropertyName,
            idTo: getDataObjectBindingID(dataObject) + "/" + objectPropertyName
        };
        onElementPropertyChange(relation, element, elementPropertyName, setterDataObjectProperty(dataObject, objectPropertyName));

        //From dataObject to element
        relation = {
            idTo: getElementBindingID(element) + "/" + elementPropertyName,
            idFrom: getDataObjectBindingID(dataObject) + "/" + objectPropertyName
        };
        onDataObjectPropertyChange(relation, dataObject, objectPropertyName, setterElementProperty(element, elementPropertyName));
    }

    function getElementBindingID(element) {
        var bid = element.data("jpvs.binding.id");
        if (!bid) {
            bid = jpvs.randomString(20);
            element.data("jpvs.binding.id", bid);
        }

        return bid;
    }

    function getDataObjectBindingID(dataObject) {
        var bid = dataObject["jpvs.binding.id"];
        if (!bid) {
            bid = jpvs.randomString(20);
            dataObject["jpvs.binding.id"] = bid;
        }

        return bid;
    }

    function onElementPropertyChange(relation, element, elementPropertyName, onChangeAction) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the element property
        var getter = getterElementProperty(element, elementPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        changeMonitorQueue.put(relation.idFrom, relation.idTo, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            onChangeAction(value);
        });
    }

    function onDataObjectPropertyChange(relation, dataObject, objectPropertyName, onChangeAction) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the dataObject property
        var getter = getterDataObjectProperty(dataObject, objectPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        changeMonitorQueue.put(relation.idFrom, relation.idTo, getter, function (value) {
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
                    return prop.call(widget);
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
                    //We want to assign it only if it is different, so we don't trigger side effects
                    if (!valueEquals(value, prop.call(widget)))
                        prop.call(widget, value);
                };
            }
        }

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes
        return function (value) {
            //We want to assign it only if it is different, so we don't trigger side effects
            if (!valueEquals(value, element.attr(elementPropertyName)))
                element.attr(elementPropertyName, value);
        };
    }

    //Function used to determine if a value has changed or if it is equal to its old value
    function valueEquals(a, b) {
        if (typeof (a) == "number" && isNaN(a) && typeof (b) == "number" && isNaN(b))
            return true;

        return a == b;
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
        this.relations = {};
    }

    ChangeMonitorQueue.prototype.put = function (idFrom, idTo, getter, onChangeAction) {
        this.relations[idFrom + "§" + idTo] = {
            idFrom: idFrom,
            idTo: idTo,
            getter: getter,
            onChangeAction: onChangeAction,
            curValue: getter()
        };
    };

    var changeMonitorQueue = new ChangeMonitorQueue();

    function changeMonitor() {
        //Let's process the queue looking for changes
        var changes;
        var changedSomething = true;
        while (changedSomething) {
            changes = {};
            changedSomething = false;
            $.each(changeMonitorQueue.relations, function (key, item) {
                var newValue = item.getter();
                if (!valueEquals(newValue, item.curValue)) {
                    //Change detected: let's set the changed flag
                    changes[item.idFrom] = item.getter;
                    changedSomething = true;
                }
            });

            //Now, we know what changed. Let's propagate the new values one at a time
            $.each(changes, function (idFrom, getter) {
                var newValue = getter();

                //Let's apply the newValue to all the relations starting from idFrom
                $.each(changeMonitorQueue.relations, function (key, item) {
                    if (item.idFrom == idFrom) {
                        //Let's apply the value to this relation's destination
                        item.onChangeAction(newValue);

                        //And set the curValue of the source
                        item.curValue = newValue;
                    }
                });
            });
        }
    }

})();