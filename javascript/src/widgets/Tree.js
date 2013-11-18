/* JPVS
Module: widgets
Classes: Tree
Depends: core
*/

(function () {

    jpvs.Tree = function (selector) {
        this.attach(selector);

        this.nodeClick = jpvs.event(this);
        this.nodeRightClick = jpvs.event(this);
    };


    jpvs.Tree.Templates = {
        StandardNode: function (node) {
            //Main node element
            var element = jpvs.writeTag(this, "div");
            element.addClass("Node");

            //NodeElement object, carrying all the information
            var nodeElement = new jpvs.Tree.NodeElement(node, element, refreshNodeState, selectNode);

            //Image button with the state (open/closed/not-openable)
            jpvs.ImageButton.create(element).click(function () {
                //Toggle on click
                nodeElement.toggle();
            });

            //Optional node icon
            if (node.icon) {
                var img = jpvs.writeTag(element, "img")
                img.addClass("Icon");
                img.attr("src", node.icon);
            }

            //Node text
            var txt = jpvs.writeTag(element, "span").addClass("Text");
            jpvs.write(txt, node.toString());

            //Events
            var tree = nodeElement.getTree();
            txt.dblclick(function () {
                //Toggle on double click
                nodeElement.toggle();
            }).mousedown(function (e) {
                if (e.button == 2) {
                    //Select and fire event on right-click
                    nodeElement.select();
                    tree.nodeRightClick.fire(tree, null, nodeElement);

                    //Prevent standard browser context-menu
                    return false;
                }
                else {
                    //Select and fire event on click
                    nodeElement.select();
                    tree.nodeClick.fire(tree, null, nodeElement);
                }
            });

            return nodeElement;

            //Function for refreshing the node's state (open/close image button)
            //This function will run with this set to the current NodeElement
            function refreshNodeState() {
                var imageButton = jpvs.find(this.element.find(".ImageButton"));

                if (this.childrenNodeElements && this.childrenNodeElements.length != 0) {
                    //Has children
                    if (this.isExpanded()) {
                        imageButton.imageUrls({
                            normal: jpvs.Resources.images.nodeOpen
                        });
                    }
                    else {
                        imageButton.imageUrls({
                            normal: jpvs.Resources.images.nodeClosed
                        });
                    }
                }
                else {
                    //Has no children
                    imageButton.imageUrls({
                        normal: jpvs.Resources.images.nodeNoChildren
                    });

                    //Force invisibility anyway
                    this.childrenContainerElement.element.hide();
                }
            }

            //Function for selecting a node
            //This function will run with this set to the current NodeElement
            function selectNode() {
                var tree = this.getTree();

                //Unselect all
                tree.element.find(".Node > .Text").removeClass("Selected");

                //Select this
                this.element.find(".Text").addClass("Selected");
            }
        },

        StandardChildrenContainer: function (node) {
            var element = jpvs.writeTag(this, "div");
            element.addClass("ChildrenContainer");
            element.hide();

            var childrenContainerElement = new jpvs.Tree.ChildrenContainerElement(node, element);
            return childrenContainerElement;
        }
    };


    jpvs.Tree.NodeElement = function (node, element, refreshStateFunc, selectNodeFunc) {
        this.node = node;
        this.element = element;
        this.refreshState = refreshStateFunc;
        this.select = selectNodeFunc;

        this.parentNodeElement = null;              //Attached during rendering
        this.childrenContainerElement = null;       //Attached during rendering
        this.childrenNodeElements = null;           //Attached during rendering
    };

    jpvs.Tree.NodeElement.prototype.getTree = function () {
        //Find the tree
        return jpvs.find(this.element.parents(".Tree").first());
    };

    jpvs.Tree.NodeElement.prototype.isExpanded = function () {
        return this.childrenContainerElement.element.is(":visible");
    };

    jpvs.Tree.NodeElement.prototype.toggle = function () {
        if (this.isExpanded())
            this.collapse();
        else
            this.expand();
    };

    jpvs.Tree.NodeElement.prototype.collapse = function () {
        var nodeElem = this;
        this.childrenContainerElement.element.hide(100, function () { nodeElem.refreshState(); });
    };

    jpvs.Tree.NodeElement.prototype.expand = function () {
        var nodeElem = this;
        var tree = this.getTree();

        //Let's load/reload/refresh children
        tree.refreshChildren(nodeElem, function () {
            if (nodeElem.childrenNodeElements && nodeElem.childrenNodeElements.length != 0) {
                //Expand only if we have children
                nodeElem.childrenContainerElement.element.show(100, function () { nodeElem.refreshState(); });
            }
            else {
                //Otherwise let's just refresh the state
                nodeElem.refreshState();
            }
        });
    };


    jpvs.Tree.ChildrenContainerElement = function (node, element) {
        this.node = node;
        this.element = element;
        this.nodeElement = null;                    //Attached during rendering
    };


    jpvs.makeWidget({
        widget: jpvs.Tree,
        type: "Tree",
        cssClass: "Tree",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            nodeTemplate: jpvs.property({
                get: function () {
                    return this.element.data("nodeTemplate");
                },
                set: function (value) {
                    this.element.data("nodeTemplate", value);
                }
            }),

            childrenContainerTemplate: jpvs.property({
                get: function () {
                    return this.element.data("childrenContainerTemplate");
                },
                set: function (value) {
                    this.element.data("childrenContainerTemplate", value);
                }
            }),

            childrenSelector: jpvs.property({
                get: function () {
                    return this.element.data("childrenSelector");
                },
                set: function (value) {
                    this.element.data("childrenSelector", value);
                }
            }),

            dataBind: function (data) {
                dataBind(this, data);
                return this;
            },

            refreshChildren: function (nodeElement, callback) {
                refreshChildren(this, nodeElement, callback);
                return this;
            },

            nodeElements: function () {
                return this.element.data("nodeElements");
            }
        }
    });


    function dataBind(W, data) {
        //Empty the object
        W.element.empty();

        //Then iterate over the data and populate the tree according to the templates that have been set
        var nodeElements = [];
        $.each(data, function (i, node) {
            var nodeElement = renderNode(W, W.element, node, null);
            nodeElements.push(nodeElement);
        });

        //Store nodeElements for later
        W.element.data("nodeElements", nodeElements);
    }

    function readChildren(W, node, callback) {
        //Let's use the default children selector, if none specified
        var childrenSelector = W.childrenSelector() || function (node) { return node.children || []; };

        //Let's call the selector, which might be either synchronous or asynchronous
        var ret = childrenSelector(node, internalCallback);

        //Let's see what happened within the selector
        if (ret === undefined) {
            //No return value. The selector is asynchronous and the internalCallback will receive the data
        }
        else if (ret === null) {
            //The selector is synchronous and returned no data
            callback([]);
        }
        else {
            //The selector is synchronous and returned some data
            callback(ret);
        }

        function internalCallback(data) {
            //null means no data, so let's return an empty array in that case
            callback(data || []);
        }
    }

    function renderNode(W, elem, node, parentNodeElement) {
        //Render the node itself
        var nodeTemplate = W.nodeTemplate() || jpvs.Tree.Templates.StandardNode;
        var nodeElement = jpvs.applyTemplate(elem, nodeTemplate, node);

        //Render the children container
        //And leave it intentionally empty, so we can load it dynamically later
        var childrenContainerTemplate = W.childrenContainerTemplate() || jpvs.Tree.Templates.StandardChildrenContainer;
        var childrenContainerElement = jpvs.applyTemplate(elem, childrenContainerTemplate, node);

        //Attach elements to each other
        nodeElement.parentNodeElement = parentNodeElement;
        nodeElement.childrenContainerElement = childrenContainerElement;
        nodeElement.childrenNodeElements = [{}];      //We will load this dynamically later; let's leave a dummy node

        childrenContainerElement.nodeElement = nodeElement;

        //Refresh the node state so the icons are initially correct based on children/visibility/etc.
        nodeElement.refreshState();

        //Return the nodeElement
        return nodeElement;
    }

    function refreshChildren(W, nodeElement, callback) {
        //Reload children
        readChildren(W, nodeElement.node, function (children) {
            //When we have the children, we must re-populate the children container
            var childrenContainerElement = nodeElement.childrenContainerElement;

            //Let's empty it, without changing its visibility (expanded/collapsed state)
            childrenContainerElement.element.empty();

            //Then let's fill it again with the new data
            fillChildrenContainer(W, childrenContainerElement, children, nodeElement);

            //At the end, call the callback
            if (callback)
                callback();
        });
    }

    function fillChildrenContainer(W, childrenContainerElement, children, parentNodeElement) {
        var childrenNodeElements = [];
        $.each(children, function (i, childNode) {
            var childrenNodeElement = renderNode(W, childrenContainerElement.element, childNode, parentNodeElement);
            childrenNodeElements.push(childrenNodeElement);
        });

        //Attach the new list of children node elements
        parentNodeElement.childrenNodeElements = childrenNodeElements;
    }

})();
