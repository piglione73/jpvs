/* JPVS
Module: widgets
Classes: Menu
Depends: core, Table
*/

/// <reference path="../../libs/jquery-1.7.2.js" />
/// <reference path="../../docs/jpvs-doc.js" />

(function () {

    //Keep track of all menus
    var allMenus = {};

    //Attach global events for handling menus
    $(document).ready(function () {
        $(document).on("mouseover.jpvsMenu", ".Menu .Item", onItemMouseOver);
        $(document).on("mouseout.jpvsMenu", ".Menu .Item", onItemMouseOut);
        $(document).on("click.jpvsMenu", onGlobalClick);
    });


    //Menu object
    jpvs.Menu = function (selector) {
        this.attach(selector);

        this.click = jpvs.event(this);
    };

    //Special menu item: separator. Usually rendered as a line.
    jpvs.Menu.Separator = {};


    /*
    The MenuElement object is a special object that must be returned by the menu template functions.
    It allows the Menu object to show/hide all the menu levels.
    */
    jpvs.Menu.MenuElement = function (element, menuItems, level, isPopup, childrenAlignment) {
        this.element = element;
        this.menuItems = menuItems;
        this.level = level;
        this.isPopup = isPopup;
        this.childrenAlignment = childrenAlignment;

        this.itemElements = element.find(".Item");

        //This member is loaded just after the rendering function finishes
        this.parentElement = null;
    };

    jpvs.Menu.MenuElement.prototype.show = function () {
        //When showing a "MenuElement", first make sure all other non-root menus of all menus are hidden
        $.each(allMenus, function (i, menu) {
            closeAllNonRoot(menu);
        });

        //Then show this "MenuElement", its parent, ..., up to the root element
        var allLine = [];
        for (var x = this; x != null; x = x.parentElement)
            allLine.unshift(x);

        //allLine has all the MenuElements that we must show
        for (var i = 0; i < allLine.length; i++) {
            var me = allLine[i];
            if (me.isPopup) {
                //A popup menu must appear close to the parent menu item
                var parentElement = me.parentElement;

                //Find the item (in the parent menu element) that has "me" as submenu
                var parentMenuItem = findParentItem(parentElement, me);

                //Determine the coordinates and show
                var box = getBox(parentMenuItem);
                var coords = getPopupCoords(box, parentElement.childrenAlignment);

                me.element.show().css({
                    position: "absolute",
                    left: coords.x + "px",
                    top: coords.y + "px"
                });

                //Then fit in visible area
                jpvs.fitInWindow(me.element);
            }
            else {
                //A non-popup menu, must just appear
                me.element.show();
            }
        }

        function findParentItem(parentElement, menuElement) {
            for (var i = 0; i < parentElement.itemElements.length; i++) {
                var itemElement = $(parentElement.itemElements[i]);
                var subMenu = itemElement.data("subMenu");

                //If this item's submenu is the menuElement, we have found the parent menu item of the "menuElement"
                if (subMenu === menuElement)
                    return itemElement;
            }
        }

        function getBox(elem) {
            var pos = elem.offset();
            var w = elem.outerWidth();
            var h = elem.outerHeight();

            return { x: pos.left, y: pos.top, w: w, h: h };
        }

        function getPopupCoords(box, align) {
            if (align == "right")
                return { x: box.x + box.w, y: box.y };
            else if (align == "bottom")
                return { x: box.x, y: box.y + box.h };
            else
                return box;
        }
    };

    jpvs.Menu.MenuElement.prototype.hide = function () {
        this.element.hide();
    };

    jpvs.Menu.MenuElement.prototype.hideIfNonRoot = function () {
        if (this.level != 0)
            this.element.hide();
    };

    jpvs.Menu.MenuElement.prototype.getChildren = function () {
        //Each itemElement may have an associated submenu
        var subMenus = [];
        $.each(this.itemElements, function (i, itemElem) {
            //It may also be null/undefined if this menu item has no submenu
            var subMenu = $(itemElem).data("subMenu");
            subMenus.push(subMenu);
        });

        return subMenus;
    };



    /*
    Standard menu templates
    */
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

                //Write the menu item using the menu item template
                jpvs.applyTemplate(cell, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, false, "bottom");
        },

        VerticalMenuBar: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A vertical menu bar is a vertical table of items.
            Each menu item is a TR.
            */
            var tbl = jpvs.Table.create(this).addClass("VerticalMenuBar").addClass("VerticalMenuBar-Level" + level);

            $.each(menuItems, function (i, item) {
                var row = tbl.writeBodyRow();
                row.element.addClass("Item");

                //Write the menu item using the menu item template
                jpvs.applyTemplate(row, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, false, "right");
        },

        PopupMenu: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A popup menu is a vertical table of items.
            Each menu item is a TR.
            */
            var tbl = jpvs.Table.create(this).addClass("PopupMenu").addClass("PopupMenu-Level" + level);

            $.each(menuItems, function (i, item) {
                var row = tbl.writeBodyRow();
                row.element.addClass("Item");

                //Write the menu item using the menu item template
                jpvs.applyTemplate(row, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, true, "right");
        }

    };


    /*
    Standard menu item templates
    */
    jpvs.Menu.ItemTemplates = {

        HorizontalMenuBarItem: function (menuItem) {
            //In the HorizontalMenuBar, "this" is a TD
            if (menuItem === jpvs.Menu.Separator) {
                //Separator
                this.addClass("Separator");
                jpvs.write(this, "|");
            }
            else {
                //Normal item
                jpvs.write(this, menuItem.text);
            }
        },

        VerticalMenuBarItem: function (menuItem) {
            //In the VerticalMenuBar, "this" is a TR
            //Render as a PopupMenuItem
            jpvs.Menu.ItemTemplates.PopupMenuItem.call(this, menuItem);
        },

        PopupMenuItem: function (menuItem) {
            //In the PopupMenu, "this" is a TR
            if (menuItem === jpvs.Menu.Separator) {
                //Separator
                this.addClass("Separator");
                var td = jpvs.writeTag(this, "td").attr("colspan", 3);
                jpvs.writeTag(td, "hr");
            }
            else {
                //Normal item: 3 cells (icon, text, submenu arrow)
                var td1 = jpvs.writeTag(this, "td").addClass("Icon");
                var td2 = jpvs.writeTag(this, "td", menuItem.text).addClass("Text");
                var td3 = jpvs.writeTag(this, "td").addClass("SubMenu");

                if (menuItem.icon) {
                    var icon = jpvs.writeTag(td1, "img");
                    icon.attr("src", menuItem.icon);
                }

                if (menuItem.items && menuItem.items.length) {
                    var arrow = jpvs.writeTag(td3, "img");
                    arrow.attr("src", jpvs.Resources.images.subMenuMarker);
                }
            }
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

            //Register the menu
            this.ensureId();
            allMenus[this.id()] = this;
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
        //Parses the element recursively and fills a menu items tree
        var menuItems = [];
        process(elem, null, menuItems);

        //After filling the tree, process it recursively and replace items with no text and no subitems
        //with a jpvs.Menu.Separator
        lookForSeparators(menuItems);

        //Finally, return the menu items tree
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

        function lookForSeparators(menuItems) {
            if (!menuItems)
                return;

            for (var i = 0; i < menuItems.length; i++) {
                var item = menuItems[i];
                var hasText = (item.text != null && $.trim(item.text) != "");
                var hasChildren = (item.items != null && item.items.length != 0);

                if (!hasText && !hasChildren)
                    menuItems[i] = jpvs.Menu.Separator;

                //If has children, do the same on them
                lookForSeparators(item.items);
            }
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

        //Store the root element
        W.rootElement = render(W.element, template, itemTemplate, 0, menuItems);

        //Recursively navigate all the structure, starting from the root element and fill the MenuElement.parentElement of
        //all MenuElements
        recursivelySetParent(null, W.rootElement);

        function recursivelySetParent(parentElement, currentElement) {
            if (!currentElement)
                return;

            //Assign the parent to the currentElement
            currentElement.parentElement = parentElement;

            //Then do the same on currentElement's children
            var children = currentElement.getChildren();
            $.each(children, function (i, child) {
                recursivelySetParent(currentElement, child);
            });
        }

        function render(elem, tpl, itemTpl, level, items) {
            if (!items || items.length == 0)
                return;

            //If not specified, render as a PopupMenu
            var curLevelTemplate = getTemplate(tpl[level], level, jpvs.Menu.Templates);
            var curLevelItemTemplate = getTemplate(itemTpl[level], level, jpvs.Menu.ItemTemplates);

            //Apply the template. The menu templates must return a MenuElement, so we can hide/show it as needed by the menu behavior
            var levelElem = jpvs.applyTemplate(elem, curLevelTemplate, { items: items, itemTemplate: curLevelItemTemplate, level: level });

            //The root level is always visible. The inner levels are hidden.
            if (level == 0)
                levelElem.show();
            else
                levelElem.hide();

            //Get all items that have just been created (they have the "Item" class)...
            var itemElements = levelElem.element.find(".Item");

            //...and associate the corresponding menuitem to each
            //Then render the next inner level and keep track of the submenu of each item
            $.each(items, function (i, item) {
                var itemElement = itemElements[i];
                if (itemElement) {
                    var $itemElem = $(itemElement);
                    $itemElem.data("menuItem", item);

                    var subMenu = render(elem, tpl, itemTpl, level + 1, item.items);
                    if (subMenu)
                        $itemElem.data("subMenu", subMenu);
                }
            });

            return levelElem;
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

    function closeAllNonRoot(menu) {
        var root = menu.rootElement;

        recursivelyClosePopups(root);

        function recursivelyClosePopups(menuElement) {
            if (!menuElement)
                return;

            menuElement.hideIfNonRoot();

            var childMenuElements = menuElement.getChildren();
            $.each(childMenuElements, function (i, cme) {
                //Only menu elements with submenu have children. The others are undefined.
                recursivelyClosePopups(cme);
            });
        }
    }

    function onItemMouseOver(e) {
        var item = $(e.currentTarget);

        //Menu item clicked
        var menuItem = item.data("menuItem");

        //If separator, do nothing
        if (menuItem === jpvs.Menu.Separator)
            return;

        //Hovering effect
        item.addClass("Item-Hover");
    }

    function onItemMouseOut(e) {
        var item = $(e.currentTarget);

        //Hovering effect
        item.removeClass("Item-Hover");
    }

    function onGlobalClick(e) {
        var clickedElem = $(e.target);
        var clickedItem = clickedElem.closest(".Menu .Item");
        var clickedMenu = clickedItem.closest(".Menu");

        //If no menu item clicked, then hide all non-root menus
        if (clickedItem.length == 0) {
            $.each(allMenus, function (i, menu) {
                closeAllNonRoot(menu);
            });
        }
        else {
            //Menu item clicked
            var menuItem = clickedItem.data("menuItem");

            //If separator, do nothing
            if (menuItem === jpvs.Menu.Separator)
                return;

            //Menu clicked
            var menu = jpvs.find(clickedMenu);

            //Show the submenu, if any
            var subMenu = clickedItem.data("subMenu");
            if (subMenu)
                subMenu.show();
            else {
                //If no submenu, hide all non-root
                closeAllNonRoot(menu);
            }

            //Finally handle events
            //Trigger the click event
            menu.click.fire(menu, null, menuItem);

            //Call the menu item click function, if any.
            //Pass the menuItem as the "this" and as the first argument
            if (menuItem.click)
                menuItem.click.call(menuItem, menuItem);

            //Follow the href, if any
            if (menuItem.href)
                window.location = menuItem.href;
        }
    }

})();
