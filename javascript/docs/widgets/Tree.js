window.jpvs = window.jpvs || {};

jpvs.Tree = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.nodeClick = jpvs.event(this);
    this.nodeRightClick = jpvs.event(this);
    this.nodeRendered = jpvs.event(this);
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
    this.refreshState = function () { };
    this.select = function () { };

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
        nodeTemplate: function (value) {
            ///<summary>Property: node template. The node template is the template used for every tree node. See
            ///jpvs.applyTemplate for information about templates. The jpvs.Tree.Templates.StandardNode is the default
            ///template used when a template is not explicitly set. The StandardNode template has an imagebutton for displaying
            ///the node state (open/closed), an optional icon (field "icon" of the node item) and a text (extracted by the toString method); nodes are
            ///clickable and expand/collapse accordingly.</summary>
        },

        childrenContainerTemplate: function (value) {
            ///<summary>Property: children container template. The children container template is used for every children
            ///container and is written just after the node template. The default children container template is
            ///jpvs.Tree.Templates.StandardChildrenContainer.</summary>
        },

        childrenSelector: function (value) {
            ///<summary>Property: children selector. The children selector is a function that extracts the children items from
            ///the node data item. The default behavior is to return the "children" data field. The children selector
            ///may be either synchronous or asynchronous.
            ///Synchronous version: function selector(node) { return node.xxx; }, where "xxx" is the field that contains
            ///the list of children. If it return null, it means no data and it is equivalent to "return [];".
            ///Asynchronous version: function asyncSelector(node, callback) { }; the function must return nothing (undefined).
            ///When data is ready, it must call the callback with the list of children as the first argument. If no data
            ///has to be returned, similarly to the synchronous version, "callback(null)" and "callback([])" are equivalent.</summary>
        },

        dataBind: function (data) {
            ///<summary>Fills the tree from an array of nodes. Only the root level is populated immediately.
            ///Lower levels in the hierarchy are populated on-demand, using the childrenSelector, which may be either
            ///synchronous or asynchronous.</summary>
            ///<param name="data" type="Object">The datasource. It can be an array of nodes or a function. 
            ///See jpvs.readDataSource for details on how a datasource is expected to work.</param>
        },

        refreshChildren: function (nodeElement, callback) {
            ///<summary>Given a NodeElement, uses the childrenSelector to load/reload the children and then updates 
            ///the ChildrenContainer with the newly-read nodes.</summary>
            ///<param name="nodeElement" type="jpvs.Tree.NodeElement">Node element whose children are to be reloaded.</param>
            ///<param name="callback" type="Function">Function with no arguments that will be called at the end of the operation.</param>
        },

        nodeElements: function () {
            ///<summary>Returns the root node elements after databinding.</summary>
            return [];
        }
    }
});

