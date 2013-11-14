/* JPVS
Module: widgets
Classes: Tree
Depends: core
*/

(function () {

    jpvs.Tree = function (selector) {
        this.attach(selector);
    };


    jpvs.Tree.Templates = {
        StandardNode: function (node) {
            var element = jpvs.writeTag(this, "div");
            element.addClass("Node");

            jpvs.Button.create(element).text("X").click(function () {
                nodeElement.childrenContainerElement.element.toggle(200);
            });

            jpvs.write(element, node.toString());

            var nodeElement = new jpvs.Tree.NodeElement(node, element);
            return nodeElement;
        },

        StandardChildrenContainer: function (node) {
            var element = jpvs.writeTag(this, "div");
            element.addClass("ChildrenContainer");
            element.hide();

            var childrenContainerElement = new jpvs.Tree.ChildrenContainerElement(node, element);
            return childrenContainerElement;
        }
    };


    jpvs.Tree.NodeElement = function (node, element) {
        this.node = node;
        this.element = element;
        this.parentNodeElement = null;              //Attached during rendering
        this.childrenContainerElement = null;       //Attached during rendering
        this.childrenNodeElements = null;           //Attached during rendering
    };

    jpvs.Tree.NodeElement.collapse = function () {
        this.childrenContainerElement.hide();
    };

    jpvs.Tree.NodeElement.expand = function () {
        this.childrenContainerElement.show();
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

            nodeElements: jpvs.property({
                get: function () {
                    return this.element.data("nodeElements");
                },
                set: function (value) {
                    this.element.data("nodeElements", value);
                }
            })
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
        W.nodeElements(nodeElements);
    }


    function renderNode(W, elem, node, parentNodeElement) {
        //Render the node itself
        var nodeTemplate = W.nodeTemplate() || jpvs.Tree.Templates.StandardNode;
        var nodeElement = jpvs.applyTemplate(elem, nodeTemplate, node);

        //Render the children container
        var childrenContainerTemplate = W.childrenContainerTemplate() || jpvs.Tree.Templates.StandardChildrenContainer;
        var childrenContainerElement = jpvs.applyTemplate(elem, childrenContainerTemplate, node);

        //And fill it recursively with its children
        var childrenSelector = W.childrenSelector() || function (node) { return node.children; };
        var children = childrenSelector(node) || [];
        var childrenNodeElements = [];
        $.each(children, function (i, childNode) {
            var childrenNodeElement = renderNode(W, childrenContainerElement.element, childNode, nodeElement);
            childrenNodeElements.push(childrenNodeElement);
        });

        //Attach elements to each other
        nodeElement.parentNodeElement = parentNodeElement;
        nodeElement.childrenContainerElement = childrenContainerElement;
        nodeElement.childrenNodeElements = childrenNodeElements;

        childrenContainerElement.nodeElement = nodeElement;

        //Return the nodeElement
        return nodeElement;
    }

})();
