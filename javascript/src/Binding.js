(function () {
    jpvs.resetAllBindings = function () {
        changeMonitorQueue.clearAll();
        disableChangeMonitor();
    };

    jpvs.bindContainer = function (container, dataObject, onChangeDetected, dataBindingAttrName) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = jpvs.getElementIfWidget(container);

        //We want to two-way bind every element (ordinary element or jpvs widget) to dataObject
        //Let's look for elements that specify a binding in attribute "data-bind"
        jpvs.bindElements(container.find("*"), dataObject, onChangeDetected, dataBindingAttrName);
    };

    jpvs.bindElements = function (elements, dataObject, onChangeDetected, dataBindingAttrName) {
        if (!elements)
            return;

        //We want to two-way bind every element (ordinary element or jpvs widget) to dataObject
        //Let's look for elements that specify a binding in attribute "data-bind"
        for (var i = 0; i < elements.length; i++) {
            //Loop over all elements and see if they need binding
            var obj = elements[i];
            var $this = $(obj);

            //Let's read the "data-bind" attribute (or another name if specified)
            var dataBind = $this.data(dataBindingAttrName || "bind");
            if (dataBind) {
                //If "data-bind" is specified, apply it
                jpvs.bind($this, dataObject, dataBind, onChangeDetected);
            }
        }
    };

    jpvs.bind = function (element, dataObject, dataBind, onChangeDetected) {
        enableChangeMonitor();

        if (!dataObject)
            return;

        //Let's parse the "data-bind" attribute into a list of bindings and put them in place
        var items = $.trim(dataBind).split(",");
        $.each(items, function (i, item) {
            var subitems = item.split("=");
            var elementPropertyName = $.trim(subitems[0]);
            var objectPropertyName = $.trim(subitems[1]);
            bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName, onChangeDetected);
        });
    };

    jpvs.findElementsBoundTo = function (dataObject, objectPropertyName) {
        var elementsOrWidgets = [];
        //Search for all relations having this idTo
        var idTo = getDataObjectBindingID(dataObject) + "/" + objectPropertyName;
        $.each(changeMonitorQueue.relations, function (key, item) {
            if (item.idTo == idTo) {
                elementsOrWidgets.push(item.element);
            }
        });

        return elementsOrWidgets;
    };

    function bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName, onChangeDetected) {
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
        onElementPropertyChange(relation, element, elementPropertyName, setterDataObjectProperty(dataObject, objectPropertyName), onChangeDetected);

        //From dataObject to element
        relation = {
            idTo: getElementBindingID(element) + "/" + elementPropertyName,
            idFrom: getDataObjectBindingID(dataObject) + "/" + objectPropertyName
        };
        onDataObjectPropertyChange(relation, dataObject, objectPropertyName, element, setterElementProperty(element, elementPropertyName), onChangeDetected);
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

    function onElementPropertyChange(relation, element, elementPropertyName, onChangeAction, onChangeDetected) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the element property
        var getter = getterElementProperty(element, elementPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        changeMonitorQueue.put(relation.idFrom, relation.idTo, element, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            if (onChangeAction(value)) {
                //And signal the event (towards the data object) only if the value has changed
                //(the onChangeAction returns true if the value has changed)
                if (onChangeDetected)
                    onChangeDetected(false, true);
            }
        });
    }

    function onDataObjectPropertyChange(relation, dataObject, objectPropertyName, element, onChangeAction, onChangeDetected) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the dataObject property
        var getter = getterDataObjectProperty(dataObject, objectPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        changeMonitorQueue.put(relation.idFrom, relation.idTo, element, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            if (onChangeAction(value)) {
                //And signal the event (towards the element) only if the value has changed
                //(the onChangeAction returns true if the value has changed)
                if (onChangeDetected)
                    onChangeDetected(true, false);
            }
        });
    }

    function decodeObjectPropertySpec(objectPropertySpec) {
        var objectPropertyName = objectPropertySpec;
        var mustInvert = false;

        //Special case: if the objectPropertyName starts with ! we have to invert the value
        if (objectPropertySpec.indexOf("!") == 0) {
            //Inversion required
            mustInvert = true;
            objectPropertyName = objectPropertySpec.substring(1);
        }

        return {
            name: objectPropertyName,
            mustInvert: mustInvert,

            translate: translateFunc
        };

        function translateFunc(val) {
            return this.mustInvert ? !val : val;
        }
    }

    function getterDataObjectProperty(dataObject, objectPropertySpec) {
        //Handle special object property syntax
        var objectPropertyInfo = decodeObjectPropertySpec(objectPropertySpec);

        //Read the data object property
        var prop = dataObject[objectPropertyInfo.name];
        if (typeof (prop) == "function") {
            //It's a jpvs.property; the getter must read from the property
            return function () {
                var val = prop();
                return objectPropertyInfo.translate(val);
            };
        }
        else {
            //It's a normal value; the getter must simply read the current value
            return function () {
                var val = dataObject[objectPropertyInfo.name];
                return objectPropertyInfo.translate(val);
            };
        }
    }

    //These setters must return true if they change the value
    function setterDataObjectProperty(dataObject, objectPropertySpec) {
        //Handle special object property syntax
        var objectPropertyInfo = decodeObjectPropertySpec(objectPropertySpec);

        //Set the data object property
        var prop = dataObject[objectPropertyInfo.name];
        if (typeof (prop) == "function") {
            //It's a jpvs.property; the setter must assign the value to the property
            return function (value) {
                var oldValue = prop();
                var valueTranslated = objectPropertyInfo.translate(value);

                prop(valueTranslated);
                return !valueEquals(valueTranslated, oldValue);
            };
        }
        else {
            //It's a normal value; the setter must overwrite it with the new one
            return function (value) {
                var oldValue = dataObject[objectPropertyInfo.name];
                var valueTranslated = objectPropertyInfo.translate(value);

                dataObject[objectPropertyInfo.name] = valueTranslated;
                return !valueEquals(valueTranslated, oldValue);
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

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes or jQuery
        //functions or pseudo-properties
        if (elementPropertyName.toLowerCase().substring(0, 7) == "jquery.") {
            //jQuery function
            return function () {
                return element[elementPropertyName.substring(7)]();
            };
        }
        else if (elementPropertyName == "#visible") {
            //"visible" pseudo-property
            return function () {
                return element.css("display") != "none" && element.css("visibility") != "hidden";
            };
        }
        else if (elementPropertyName.substring(0, 1) == "#") {
            //Starts with # but not among the allowed ones
            alert("Invalid jpvs data-binding directive: " + elementPropertyName);
        }
        else {
            //Generic attribute
            return function () {
                return element.attr(elementPropertyName);
            };
        }
    }

    //These setters must return true if the new value is different from the old value
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
                    if (!valueEquals(value, prop.call(widget))) {
                        prop.call(widget, value);
                        return true;
                    }
                    else
                        return false;
                };
            }
        }

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes or jQuery
        //functions or pseudo-properties
        if (elementPropertyName.toLowerCase().substring(0, 7) == "jquery.") {
            //jQuery function
            return function (value) {
                //We want to assign it only if it is different, so we don't trigger side effects
                if (!valueEquals(value, element[elementPropertyName.substring(7)]())) {
                    element[elementPropertyName.substring(7)](value);
                    return true;
                }
                else
                    return false;
            };
        }
        else if (elementPropertyName == "#visible") {
            //"visible" pseudo-property
            return function (value) {
                var oldValue = element.css("display") != "none" && element.css("visibility") != "hidden";
                if (value)
                    element.show();
                else
                    element.hide();

                return value != oldValue;
            };
        }
        else if (elementPropertyName.substring(0, 1) == "#") {
            //Starts with # but not among the allowed ones
            alert("Invalid jpvs data-binding directive: " + elementPropertyName);
        }
        else {
            //Generic attribute
            return function (value) {
                //We want to assign it only if it is different, so we don't trigger side effects
                if (!valueEquals(value, element.attr(elementPropertyName))) {
                    element.attr(elementPropertyName, value);
                    return true;
                }
                else
                    return false;
            };
        }
    }

    //Function used to determine if a value has changed or if it is equal to its old value
    function valueEquals(a, b) {
        return jpvs.equals(a, b);
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

    ChangeMonitorQueue.prototype.clearAll = function () {
        this.relations = {};
    };

    ChangeMonitorQueue.prototype.put = function (idFrom, idTo, element, getter, onChangeAction) {
        this.relations[idFrom + "§" + idTo] = {
            idFrom: idFrom,
            idTo: idTo,
            element: element,
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
