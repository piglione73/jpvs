window.jpvs = window.jpvs || {};

jpvs.Menu = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Menu,
    type: "Menu",

    prototype: {
        template: function (value) {
            /// <summary>Property: menu template. The menu template is an array of strings or functions. Each array item represents the template to be used for each menu level. Calling "arr" the menu template array, the root level is arr[0], the first level of submenus is arr[1], ... Possible values for each item: "HorizontalMenuBar", "VerticalMenuBar", "PopupMenu", jpvs.Menu.Templates.HorizontalMenuBar, ..., a custom function.</summary>
            return this;
        },

        itemTemplate: function (value) {
            /// <summary>Property: menu item template. The menu item template is an array of strings or functions. Each array item represents the item template to be used for each menu level. Calling "arr" the menu item template array, the root level is arr[0], the first level of submenus is arr[1], ... Possible values for each item: "HorizontalMenuBarItem", "VerticalMenuBarItem", "PopupMenuItem", jpvs.Menu.ItemTemplates.HorizontalMenuBarItem, ..., a custom function.</summary>
            return this;
        },

        menuItems: function (value) {
            /// <summary>Property: array of menu items. Each menu item is in this form: { text: String, icon: Url, tooltip: String, click: Function, href: String, items: Array }. Every field is optional. A separator can be specified as jpvs.Menu.Separator.</summary>
            return this;
        }
    }
});
