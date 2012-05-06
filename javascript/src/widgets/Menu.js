/* JPVS
Module: widgets
Classes: Menu
Depends: core
*/

(function() {

	jpvs.Menu = function (selector) {
		this.attach(selector);

		this.click = jpvs.event(this);
	};


	jpvs.Menu.Templates = {

		HorizontalMenuBar: function (menuItems) {
			var $this = this;
			jpvs.writeln(this, "HorizontalMenuBar: ");
			$.each(menuItems, function(i, item) {
				jpvs.writeln($this, "\u00a0\u00a0\u00a0\u00a0" + item.text);
			});
			jpvs.writeln($this);
		},

		VerticalMenuBar: function (menuItems) {
			var $this = this;
			jpvs.writeln(this, "VerticalMenuBar: ");
			$.each(menuItems, function(i, item) {
				jpvs.writeln($this, "\u00a0\u00a0\u00a0\u00a0" + item.text);
			});
			jpvs.writeln($this);
		},

		PopupMenu: function (menuItems) {
			var $this = this;
			jpvs.writeln(this, "PopupMenu: ");
			$.each(menuItems, function(i, item) {
				jpvs.writeln($this, "\u00a0\u00a0\u00a0\u00a0" + item.text);
			});
			jpvs.writeln($this);
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
			template: jpvs.property({
				get: function() {
					var strTemplate = this.element.data("jpvsTemplate");
					if(!strTemplate)
						return [];
						
					var tpl = strTemplate.split(",");
					return tpl;
				},
				set: function(value) {
					var strTemplate = value.join(",");
					this.element.data("jpvsTemplate", strTemplate);
				}
			}),
			
			menuItems: jpvs.property({
				get: function() {
					return this.element.data("menuItems");
				},
				set: function(value) {
					this.element.data("menuItems", value);
					renderMenu(this, value);
				}
			}),
		}
	});

	
	function parseContent(elem) {
		//Parses the element recursively and fills a menu items array
		var menuItems = [];
		process(elem, null, menuItems);
		return menuItems;
		
		function process(curElem, curItem, curLevel) {
			//Look for menu items in curElem. Loop over children and see if anything can be considered a menu item
			var children = $(curElem).contents();
			children.each(function() {
				var child = this;
				var $child = $(this);
				
				if(child.nodeType == Node.TEXT_NODE) {
					//Child is a text node. We consider it part of the current item text
					if(curItem)
						curItem.text = concatTextNode(curItem.text, $child.text());
				}
				else if(child.nodeType == Node.ELEMENT_NODE) {
					//Child is an element. Let's see what type
					var nodeName = child.nodeName.toLowerCase();
					if(nodeName == "ul" || nodeName == "ol") {
						//Child represents a list of items. Let's just go down the hierarchy as if this ul/ol didn't exist
						process(child, null, curLevel);
					}
					else if(nodeName == "a") {
						//Child is a link. We consider it part of the current item text and we take the href also
						if(curItem) {
							curItem.text = concatTextNode(curItem.text, $child.text());
							curItem.href = $child.attr("href");
						}
					}
					else if(nodeName == "button") {
						//Child is a button. We consider it part of the current item text and we take the onclick also
						if(curItem) {
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
		
		function concatTextNode(text, textToAdd)  {
			text = $.trim(text) + " " + $.trim(textToAdd);
			return $.trim(text);
		}
	}
	
	function renderMenu(W, menuItems) {
		//Empty everything
		W.element.empty();
		
		//Now recreate the items according to the template
		var template = W.template();
		
		//template[0] is the template for the root level
		//template[1] is the template for the first nesting level
		//template[2] is the template for the second nesting level
		//...
		render(W.element, template, 0, menuItems);
		
		function render(elem, tpl, level, items) {
			if(!items || items.length == 0)
				return;
				
			//If not specified, render as a PopupMenu
			var curLevelTemplate = tpl[level] || "PopupMenu";
			curLevelTemplate = jpvs.Menu.Templates[curLevelTemplate];
			
			//Apply the template
			jpvs.applyTemplate(elem, curLevelTemplate, items);
			
			//Then render the next inner level
			$.each(items, function(i, item) {
				render(elem, tpl, level + 1, item.items);
			});
		}
	}
})();
