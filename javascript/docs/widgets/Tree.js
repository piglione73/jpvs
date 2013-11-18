window.jpvs = window.jpvs || {};

jpvs.Tree = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.nodeClick = jpvs.event(this);
    this.nodeRightClick = jpvs.event(this);
};

jpvs.Tree.Templates = {
    StandardNode: function (node) {
        /// <summary>Standard template for a tree node.</summary>
        return new jpvs.Tree.NodeElement();
    },

    StandardChildrenContainer: function (node) {
        /// <summary>Standard template for a tree children container.</summary>
        return new jpvs.Tree.ChildrenContainerElement();
    }
};


jpvs.Tree.NodeElement = function (node, element, refreshStateFunc, selectNodeFunc) {
    /// <summary>The node template returns an object of this type.</summary>
    /// <param name="node" type="Object">The node data item.</param>
    /// <param name="element" type="Object">The DOM element created by the node template.</param>
    /// <param name="refreshStateFunc" type="Function">Function that refreshes the state of the element (icons, etc.) based on whether the node has children and/or is open/close. The function will receive "this" set to the current node element.</param>
    /// <param name="selectNodeFunc" type="Function">Function that selects the current node. The function will receive "this" set to the current node element.</param>
    this.node = {};
    this.element = $();
    this.refreshState = fucntion() {};
    this.select = fucntion() {};

    this.parentNodeElement = new jpvs.Tree.NodeElement();
    this.childrenContainerElement = new jpvs.Tree.ChildrenContainerElement();
    this.childrenNodeElements = [];
};

jpvs.Tree.NodeElement.prototype.getTree = function () {
    /// <summary>Returns the current Tree widget.</summary>
    return new jpvs.Tree();
};

jpvs.Tree.NodeElement.prototype.isExpanded = function () {
    /// <summary>Returns true if this node element is expanded.</summary>
    return false;
};

jpvs.Tree.NodeElement.prototype.toggle = function () {
    /// <summary>Toggles the expanded/collapsed state of the node.</summary>
};

jpvs.Tree.NodeElement.prototype.collapse = function () {
    /// <summary>Collapses the node.</summary>
};

jpvs.Tree.NodeElement.prototype.expand = function () {
    /// <summary>Expands the node.</summary>
};


jpvs.Tree.ChildrenContainerElement = function (node, element) {
    /// <summary>The children container template returns an object of this type.</summary>
    /// <param name="node" type="Object">The node data item.</param>
    /// <param name="element" type="Object">The DOM element created by the node template.</param>
    this.node = {};
    this.element = $();
    this.nodeElement = new jpvs.Tree.NodeElement();
};


jpvs.makeWidget({
    widget: jpvs.Tree,
    type: "Tree",

    prototype: {
        nodeTemplate: function(value){
            ///<summary>Property: node template. The node template is...</summary>
        },

        childrenContainerTemplate: function(value){
            ///<summary>Property: children container template. The children container template is...</summary>
        },

        childrenSelector: function(value){
            ///<summary>Property: children selector. The children selector template is...</summary>
        },

        dataBind: function(data){
        },

        nodeElements: function(value){
        }
    }
});

