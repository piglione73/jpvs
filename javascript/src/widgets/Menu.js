/* JPVS
Module: widgets
Classes: Menu
Depends: core, Table
*/

/// <reference path="../../libs/jquery-1.7.2.js" />
/// <reference path="../../docs/jpvs-doc.js" />

(function () {

    jpvs.Menu = function (selector) {
        this.attach(selector);

        this.click = jpvs.event(this);
    };


    jpvs.Menu.Templates = {

        HorizontalMenuBar: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A horizontal menu bar is a horizontal table of items.
            Each menu item is a TD.
            */
            var tbl = jpvs.Table.create(this).addClass("HorizontalMenuBar").addClass("HorizontalMenuBar-Level" + level);
            var row = tbl.writeBodyRow();

            $.each(menuItems, function (i, item) {
                var cell = row.writeCell().addClass("Item");

                //Hovering effect
                cell.hover(function () {
                    cell.addClass("Item-Hover");
                }, function () {
                    cell.removeClass("Item-Hover");
                });

                //Write the menu item using the menu item template
                jpvs.applyTemplate(cell, menuItemTemplate, item);
            });

            //The menu template must return the DOM element
            return tbl.element;
        },

        VerticalMenuBar: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A vertical menu bar is a vertical table of items.
            Each menu item is a TD.
            */
            var tbl = jpvs.Table.create(this).addClass("VerticalMenuBar").addClass("VerticalMenuBar-Level" + level);

            $.each(menuItems, function (i, item) {
                var row = tbl.writeBodyRow();
                var cell = row.writeCell().addClass("Item");

                //Hovering effect
                cell.hover(function () {
                    cell.addClass("Item-Hover");
                }, function () {
                    cell.removeClass("Item-Hover");
                });

                //Write the menu item using the menu item template
                jpvs.applyTemplate(cell, menuItemTemplate, item);
            });

            //The menu template must return the DOM element
            return tbl.element;
        },

        PopupMenu: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A popup menu is a vertical table of items.
            Each menu item is a TD.
            */
            var tbl = jpvs.Table.create(this).addClass("PopupMenu").addClass("PopupMenu-Level" + level);

            $.each(menuItems, function (i, item) {
                var row = tbl.writeBodyRow();
                var cell = row.writeCell().addClass("Item");

                //Hovering effect
                cell.hover(function () {
                    cell.addClass("Item-Hover");
                }, function () {
                    cell.removeClass("Item-Hover");
                });

                //Write the menu item using the menu item template
                jpvs.applyTemplate(cell, menuItemTemplate, item);
            });

            //The menu template must return the DOM element
            return tbl.element;
        }

    };

    jpvs.Menu.ItemTemplates = {

        HorizontalMenuBarItem: function (menuItem) {
            jpvs.write(this, menuItem.text);
        },

        VerticalMenuBarItem: function (menuItem) {
            jpvs.write(this, menuItem.text);
        },

        PopupMenuItem: function (menuItem) {
            jpvs.write(this, menuItem.text);
        }

    };

    //Defaults
    jpvs.Menu.Templates.Default_Level0 = jpvs.Menu.Templates.HorizontalMenuBar;
    jpvs.Menu.Templates.Default_OtherLevels = jpvs.Menu.Templates.PopupMenu;

    jpvs.Menu.ItemTemplates.Default_Level0 = jpvs.Menu.ItemTemplates.HorizontalMenuBarItem;
    jpvs.Menu.ItemTemplates.Default_OtherLevels = jpvs.Menu.ItemTemplates.PopupMenuItem;


    //Widget definition
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
            //There can be a content. Let's try to interpret it as a menu, using common-sense
            //semantic-like interpretation
            var menuItems = parseContent(this.element);

            //Then, let's empty the element...
            this.element.empty();

            //...and recreate the content
            this.menuItems(menuItems);
        },

        canAttachTo: function (obj) {
            //No autoattach
            return false;
        },

        prototype: {
            template: templateProperty("jpvsTemplate"),

            itemTemplate: templateProperty("jpvsItemTemplate"),

            menuItems: jpvs.property({
                get: function () {
                    return this.element.data("menuItems");
                },
                set: function (value) {
                    this.element.data("menuItems", value);
                    renderMenu(this, value);
                }
            })
        }
    });

    /*
    jpvs.property that stores a menu template or menu item template in this.element.data(dataName)
    */
    function templateProperty(dataName) {
        return jpvs.property({
            get: function () {
                var template = this.element.data(dataName);
                if (!template)
                    return [];

                if (typeof (template) == "string") {
                    //Split into substrings
                    var tpl = template.split(",");
                    return tpl;
                }
                else
                    return template;
            },
            set: function (value) {
                this.element.data(dataName, value);
            }
        })
    }

    function parseContent(elem) {
        //Parses the element recursively and fills a menu items array
        var menuItems = [];
        process(elem, null, menuItems);
        return menuItems;

        function process(curElem, curItem, curLevel) {
            //Look for menu items in curElem. Loop over children and see if anything can be considered a menu item
            var children = $(curElem).contents();
            children.each(function () {
                var child = this;
                var $child = $(this);

                if (child.nodeType == Node.TEXT_NODE) {
                    //Child is a text node. We consider it part of the current item text
                    if (curItem)
                        curItem.text = concatTextNode(curItem.text, $child.text());
                }
                else if (child.nodeType == Node.ELEMENT_NODE) {
                    //Child is an element. Let's see what type
                    var nodeName = child.nodeName.toLowerCase();
                    if (nodeName == "ul" || nodeName == "ol") {
                        //Child represents a list of items. Let's just go down the hierarchy as if this ul/ol didn't exist
                        process(child, null, curLevel);
                    }
                    else if (nodeName == "a") {
                        //Child is a link. We consider it part of the current item text and we take the href also
                        if (curItem) {
                            curItem.text = concatTextNode(curItem.text, $child.text());
                            curItem.href = $child.attr("href");
                        }
                    }
                    else if (nodeName == "button") {
                        //Child is a button. We consider it part of the current item text and we take the onclick also
                        if (curItem) {
                            curItem.text = concatTextNode(curItem.text, $child.text());
                            curItem.click = child.onclick;
                        }
                    }
                    else {
                        //Child is something else (div or li or anything)
                        //This marks the beginning of a new menu item. We get it and go down the hierarchy looking for
                        //the menu item textual content and the child items
                        var parkedItem = curItem;
                        curItem = { text: "", items: [] };
                        curLevel.push(curItem);
                        process(child, curItem, curItem.items);

                        //End of the newly created and processed item, go back to previous
                        curItem = parkedItem;
                    }
                }
            });
        }

        function concatTextNode(text, textToAdd) {
            text = $.trim(text) + " " + $.trim(textToAdd);
            return $.trim(text);
        }
    }

    function renderMenu(W, menuItems) {
        //Empty everything
        W.element.empty();

        //Now recreate the items according to the template
        var template = W.template();
        var itemTemplate = W.itemTemplate();

        //template[0] is the template for the root level
        //template[1] is the template for the first nesting level
        //template[2] is the template for the second nesting level
        //...
        //itemTemplate[0] is the item template for the root level
        //itemTemplate[1] is the item template for the first nesting level
        //itemTemplate[2] is the item template for the second nesting level
        //...
        render(W.element, template, itemTemplate, 0, menuItems);

        function render(elem, tpl, itemTpl, level, items) {
            if (!items || items.length == 0)
                return;

            //If not specified, render as a PopupMenu
            var curLevelTemplate = getTemplate(tpl[level], level, jpvs.Menu.Templates);
            var curLevelItemTemplate = getTemplate(itemTpl[level], level, jpvs.Menu.ItemTemplates);

            //Apply the template. The menu templates must return the element, so we can hide/show it as needed by the menu behavior
            var levelElem = jpvs.applyTemplate(elem, curLevelTemplate, { items: items, itemTemplate: curLevelItemTemplate, level: level });

            //The root level is always visible. The inner levels are hidden.
            if (level == 0)
                levelElem.show();
            else
                levelElem.hide();

            //Then render the next inner level
            $.each(items, function (i, item) {
                render(elem, tpl, itemTpl, level + 1, item.items);
            });
        }
    }

    function getTemplate(templateSpec, level, defaultTemplates) {
        var tpl;

        //Use templateSpec to determine a template function
        if (typeof (templateSpec) == "function") {
            //If templateSpec is already a function, then we have nothing to do
            tpl = templateSpec;
        }
        else if (typeof (templateSpec) == "string") {
            //If it is a string, then it must be a default template
            tpl = defaultTemplates[templateSpec];
        }

        //If we still don't have a template here, let's apply a default setting
        if (!tpl) {
            if (level == 0)
                tpl = defaultTemplates.Default_Level0;
            else
                tpl = defaultTemplates.Default_OtherLevels;
        }

        //Here we have a template
        return tpl;
    }

})();
