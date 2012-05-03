/* JPVS
Module: widgets
Classes: Menu
Depends: core
*/

jpvs.Menu = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};


jpvs.Menu.Templates = {

    HorizontalMenuBar: function (menuItems) {
    },

    VerticalMenuBar: function (menuItems) {
    },

    PopupMenu: function (menuItems) {
    }

};


jpvs.makeWidget({
    widget: jpvs.Menu,
    type: "Menu",
    cssClass: "Menu",

    create: function (container) {
        var obj = document.createElement("div");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
    },

    canAttachTo: function (obj) {
        //No autoattach
        return false;
    },

    prototype: {
    }
});
