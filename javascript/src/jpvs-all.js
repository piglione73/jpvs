/* JPVS
Module: bootstrap
*/

var jpvs = (function () {
    function loadJS(url, callback) {
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        var script = document.createElement("script");
        script.src = url;

        // Handle Script loading
        var done = false;

        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                done = true;
                callback();
            }
        };

        // Use insertBefore instead of appendChild to circumvent an IE6 bug.
        head.insertBefore(script, head.firstChild);
    }

    function setAdd(list, item) {
        var found = false;
        for (var i in list) {
            var x = list[i];
            if (x == item) {
                found = true;
                break;
            }
        }

        if (!found) {
            list.push(item);
            return true;
        }
        else
            return false;
    }

    function resolveDependencies(classes, modules) {
        //The following comment is a placeholder. During the build process it will be replaced with a dependency tree
        //of all files, classes and modules.
        /* $JPVSTREE$ */

        //Start from classes and get a list of modules
        var mods = [];
        if (classes) {
            for (var i in classes) {
                var cls = classes[i];
                var mod = tree.ClassToModule[cls];
                setAdd(mods, mod);
            }
        }

        //Next, add modules
        if (modules) {
            for (var i in modules) {
                var mod = modules[i];
                setAdd(mods, mod);
            }
        }

        //Finally, let's add all dependencies
        var loopAgain = true;
        while (loopAgain) {
            loopAgain = false;
            for (var i in mods) {
                var mod = mods[i];
                var depends = tree.ModuleToDepends[mod];
                for (var j in depends) {
                    var depend = depends[j];
                    if (setAdd(mods, depend))
                        loopAgain = true;
                }
            }
        }

        //Now we have all required modules
        //Let's determine the files to load
        var jpvsBaseUrl = jpvs.baseUrl || "jpvs";

        var files = [];
        for (var i in mods) {
            var mod = mods[i];
            var fileGroup = tree.ModuleToFiles[mod];
            for (var j in fileGroup) {
                var file = fileGroup[j];
                setAdd(files, jpvsBaseUrl + "/" + file);
            }
        }

        //Return in reverse order
        files.reverse();
        return files;
    }

    return function (classesAndModules, onready) {
        //Variable number of parameters
        if (!classesAndModules) {
            //No params
        }
        else if (typeof (classesAndModules) == "function") {
            //One param: callback
            onready = classesAndModules;
            $(document).ready(onready);
        }
        else {
            //Two params: classesAndModules, onready
            //Javascript files to load
            var files = resolveDependencies(classesAndModules.classes, classesAndModules.modules);

            function loadAllJS() {
                if (!files.TotalCount)
                    files.TotalCount = files.length;

                var firstJS = files.shift();
                if (firstJS) {
                    setTimeout(function () {
                        loadJS(firstJS, loadAllJS);
                    }, 10);
                }
                else {
                    //Done
                    if (onready)
                        onready();
                }
            }

            $(document).ready(loadAllJS);
        }
    }
})();

/* JPVS
Module: core
Classes: jpvs
Depends:
*/

jpvs.states = {
    HOVER: "Hover",
    FOCUS: "Focus",
    ERROR: "Error",
    DISABLED: "Disabled"
};

jpvs.property = function (propdef) {
    return function (value) {
        if (value === undefined)
            return propdef.get.call(this);
        else {
            propdef.set.call(this, value);
            return this;
        }
    };
};

jpvs.event = function (widget) {
    return new jpvs.Event(widget);
};

jpvs.makeWidget = function (widgetDef) {
    //Widget
    var fn = widgetDef.widget;
    if (!fn)
        throw "Missing widget field in widget definition";

    //Widget creator
    if (!widgetDef.create)
        throw "Missing create function in widget definition";

    //Widget initialization
    if (!widgetDef.init)
        throw "Missing init function in widget definition";

    //Widget name
    fn.__WIDGET__ = widgetDef.type;
    if (!fn.__WIDGET__)
        throw "Missing type field in widget definition";

    //Widget CSS class
    if (!widgetDef.cssClass)
        throw "Missing cssClass field in widget definition";

    //Static methods
    fn.create = create_static(widgetDef);
    fn.attach = attach_static(widgetDef);

    //Instance methods
    fn.prototype.toString = function () { return this.__WIDGET__; };
    fn.prototype.attach = attach(widgetDef);
    fn.prototype.addState = addState(widgetDef);
    fn.prototype.removeState = removeState(widgetDef);

    //Additional prototype methods defined in "widgetDef"
    if (widgetDef.prototype) {
        $.each(widgetDef.prototype, function (memberName, member) {
            fn.prototype[memberName] = member;
        });
    }

    function create_static(widgetDef) {
        return function (selector) {
            var objs = [];

            $(selector).each(function (i, elem) {
                var obj = widgetDef.create(elem);
                objs.push(widgetDef.widget.attach(obj));
            });

            if (objs.length == 1)
                return objs[0];
            else if (objs.length == 0)
                return undefined;
            else
                return objs;
        };
    }

    function attach_static(widgetDef) {
        return function (selector) {
            return new widgetDef.widget(selector);
        };
    }

    function attach(widgetDef) {
        return function (selector) {
            this.__WIDGET__ = widgetDef.type;
            this.element = $(selector);

            //Decorate with CSS
            this.element.addClass("Widget");
            this.element.addClass(widgetDef.cssClass);

            //Initialize widget behavior
            init(this);
            widgetDef.init.call(this, this);
        };
    }

    function init(W) {
        //Hovering
        W.element.hover(
            function () {
                W.addState(jpvs.states.HOVER);
            },
            function () {
                W.removeState(jpvs.states.HOVER);
            }
        );

        //Focusing
        W.element.focusin(
            function () {
                W.addState(jpvs.states.FOCUS);
            }
        );
        W.element.focusout(
            function () {
                W.removeState(jpvs.states.FOCUS);
            }
        );
    }

    function addState(wd) {
        return function (state) {
            this.element.addClass("Widget-" + state);
            this.element.addClass(wd.cssClass + "-" + state);
        };
    }

    function removeState(wd) {
        return function (state) {
            this.element.removeClass("Widget-" + state);
            this.element.removeClass(wd.cssClass + "-" + state);
        };
    }
};


/* JPVS
Module: core
Classes: Event
Depends:
*/

jpvs.Event = function (widget) {
    this.widget = widget;
    this.handlers = {};
};

jpvs.Event.prototype.bind = function (handlerName, handler) {
    if (!handler) {
        handler = handlerName;
        handlerName = new Date().toString();
    }

    this.handlers[handlerName] = handler;

    return this.widget;
};

jpvs.Event.prototype.unbind = function (handlerName) {
    delete this.handlers[handlerName];
    return this.widget;
};

jpvs.Event.prototype.fire = function (widget, handlerName, params) {
    if (handlerName)
        fireHandler(this.handlers[handlerName], params);
    else {
        for (var hn in this.handlers) {
            var h = this.handlers[hn];
            fireHandler(h, params);
        }
    }

    return this.widget;

    function fireHandler(handler) {
        if (handler)
            handler.call(widget, params);
    }
};

/*
****************************************
SVG-to-JSON parser
****************************************



EXAMPLE

Given this SVG image:

<svg xmlns="http://www.w3.org/2000/svg">
<circle cx="100" cy="50" r="40" style="stroke:brown;stroke-width:5;fill:#00FF00" />
</svg> 

The following call:

var svg = SvgParser.parseString("<svg xmlns=\"http://www.w3.org/2000/svg\">\n\t<circle cx=\"100\" cy=\"50\" r=\"40\" style=\"stroke:brown;stroke-width:5;fill:green\" />\n</svg>");

yields the following JSON object:

svg = {
ids:{},
elements: [
{
name: "circle",
children: [],
cx: 100,
cy: 50,
r: 40,
stroke: { color: { r: 165, g: 42, b: 42, a: 1 } },
stroke-width: 5,
fill: { color: { r: 0, g: 128, b: 0, a: 1 } }
}
]
};

*/

/* JPVS
Module: parsers
Classes: SvgParser
Depends:
*/
var SvgParser = (function () {

    var BLACK = { r: 0, g: 0, b: 0, a: 1 };

    var ColorData = {
        aliceblue: '#F0F8FF',
        antiquewhite: '#FAEBD7',
        aquamarine: '#7FFFD4',
        azure: '#F0FFFF',
        beige: '#F5F5DC',
        bisque: '#FFE4C4',
        black: '#000000',
        blanchedalmond: '#FFEBCD',
        blue: '#0000FF',
        blueviolet: '#8A2BE2',
        brown: '#A52A2A',
        burlywood: '#DEB887',
        cadetblue: '#5F9EA0',
        chartreuse: '#7FFF00',
        chocolate: '#D2691E',
        coral: '#FF7F50',
        cornflowerblue: '#6495ED',
        cornsilk: '#FFF8DC',
        crimson: '#DC143C',
        cyan: '#00FFFF',
        darkblue: '#00008B',
        darkcyan: '#008B8B',
        darkgoldenrod: '#B8860B',
        darkgray: '#A9A9A9',
        darkgreen: '#006400',
        darkgrey: '#A9A9A9',
        darkkhaki: '#BDB76B',
        darkmagenta: '#8B008B',
        darkolivegreen: '#556B2F',
        darkorange: '#FF8C00',
        darkorchid: '#9932CC',
        darkred: '#8B0000',
        darksalmon: '#E9967A',
        darkseagreen: '#8FBC8F',
        darkslateblue: '#483D8B',
        darkslategray: '#2F4F4F',
        darkslategrey: '#2F4F4F',
        darkturquoise: '#00CED1',
        darkviolet: '#9400D3',
        deeppink: '#FF1493',
        deepskyblue: '#00BFFF',
        dimgray: '#696969',
        dimgrey: '#696969',
        dodgerblue: '#1E90FF',
        firebrick: '#B22222',
        floralwhite: '#FFFAF0',
        forestgreen: '#228B22',
        gainsboro: '#DCDCDC',
        ghostwhite: '#F8F8FF',
        gold: '#FFD700',
        goldenrod: '#DAA520',
        green: '#008000',
        grey: '#808080',
        greenyellow: '#ADFF2F',
        honeydew: '#F0FFF0',
        hotpink: '#FF69B4',
        indianred: '#CD5C5C',
        indigo: '#4B0082',
        ivory: '#FFFFF0',
        khaki: '#F0E68C',
        lavender: '#E6E6FA',
        lavenderblush: '#FFF0F5',
        lawngreen: '#7CFC00',
        lemonchiffon: '#FFFACD',
        lightblue: '#ADD8E6',
        lightcoral: '#F08080',
        lightcyan: '#E0FFFF',
        lightgoldenrodyellow: '#FAFAD2',
        lightgreen: '#90EE90',
        lightgrey: '#D3D3D3',
        lightpink: '#FFB6C1',
        lightsalmon: '#FFA07A',
        lightseagreen: '#20B2AA',
        lightskyblue: '#87CEFA',
        lightslategray: '#778899',
        lightslategrey: '#778899',
        lightsteelblue: '#B0C4DE',
        lightyellow: '#FFFFE0',
        limegreen: '#32CD32',
        linen: '#FAF0E6',
        magenta: '#FF00FF',
        mediumaquamarine: '#66CDAA',
        mediumblue: '#0000CD',
        mediumorchid: '#BA55D3',
        mediumpurple: '#9370DB',
        mediumseagreen: '#3CB371',
        mediumslateblue: '#7B68EE',
        mediumspringgreen: '#00FA9A',
        mediumturquoise: '#48D1CC',
        mediumvioletred: '#C71585',
        midnightblue: '#191970',
        mintcream: '#F5FFFA',
        mistyrose: '#FFE4E1',
        moccasin: '#FFE4B5',
        navajowhite: '#FFDEAD',
        oldlace: '#FDF5E6',
        olivedrab: '#6B8E23',
        orange: '#FFA500',
        orangered: '#FF4500',
        orchid: '#DA70D6',
        palegoldenrod: '#EEE8AA',
        palegreen: '#98FB98',
        paleturquoise: '#AFEEEE',
        palevioletred: '#DB7093',
        papayawhip: '#FFEFD5',
        peachpuff: '#FFDAB9',
        peru: '#CD853F',
        pink: '#FFC0CB',
        plum: '#DDA0DD',
        powderblue: '#B0E0E6',
        red: '#FF0000',
        rosybrown: '#BC8F8F',
        royalblue: '#4169E1',
        saddlebrown: '#8B4513',
        salmon: '#FA8072',
        sandybrown: '#F4A460',
        seagreen: '#2E8B57',
        seashell: '#FFF5EE',
        sienna: '#A0522D',
        skyblue: '#87CEEB',
        slateblue: '#6A5ACD',
        slategray: '#708090',
        slategrey: '#708090',
        snow: '#FFFAFA',
        springgreen: '#00FF7F',
        steelblue: '#4682B4',
        tan: '#D2B48C',
        thistle: '#D8BFD8',
        tomato: '#FF6347',
        turquoise: '#40E0D0',
        violet: '#EE82EE',
        wheat: '#F5DEB3',
        whitesmoke: '#F5F5F5',
        yellow: '#FFFF00',
        yellowgreen: '#9ACD32'
    };



    function parseString(s) {
        //Parse as XML
        var doc = XmlParser.parseString(s, transform);
        if (doc)
            return {
                ids: doc.__$ids$__,
                elements: doc.children
            };
        else
            return null;
    }

    function transform(node, rootNode) {
        //Fill the "ids" field in rootNode along the way
        if (!rootNode.__$ids$__)
            rootNode.__$ids$__ = {};

        if (node.attributes.id)
            rootNode.__$ids$__[node.attributes.id] = node;

        //Strip comments from children
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.name == "#COMMENT") {
                //Remove
                node.children.splice(i--, 1);
            }
        }

        //Remove value
        delete node.value;

        //Pull attributes out and remove the attributes object
        for (var i in node.attributes) {
            var attr = node.attributes[i];
            processAttribute(node, i, attr);
        }

        delete node.attributes;

        function processAttribute(destination, name, value) {
            if (name == "style")
                processStyle(destination, value);
            else if (name == "fill")
                processFill(destination, value);
            else if (name == "stroke")
                processStroke(destination, value);
            else if (name == "d")
                processPathDefinition(destination, value);
            else {
                //Transfer to destination
                var endsWithPercent = /%$/g.test(value);
                var valueAsNumber = parseFloat(value);
                var valueIsNumber = isFinite(valueAsNumber) && !endsWithPercent;
                destination[name] = valueIsNumber ? valueAsNumber : value;
            }
        }

        function processPathDefinition(destination, value) {
            var pd = parsePathDefinition(value);
            destination.d = pd;
        }

        function processFill(destination, value) {
            //Special case: none
            if (!value) {
                destination.fill = {};
                return;
            }

            value = trim(value);
            if (value == "" || value.toLowerCase() == "none") {
                destination.fill = {};
                return;
            }

            //Value is a color or gradient
            var urlRegEx = /^url *\( *#(.+) *\) *$/gi;
            var result = urlRegEx.exec(value);

            if (result) {
                //Reference to a gradient
                var gradientId = result[1];

                //Let us assume that the "gradientId" has already been encountered in the 
                //document (i.e., the "defs" element is before all shapes in the SVG document)
                var grad = rootNode.__$ids$__[gradientId];
                if (grad.name == "linearGradient") {
                    //Linear gradient
                    var x1 = parseNumberOrPercentage(grad.x1);
                    var x2 = parseNumberOrPercentage(grad.x2);
                    var y1 = parseNumberOrPercentage(grad.y1);
                    var y2 = parseNumberOrPercentage(grad.y2);

                    destination.fill = {
                        linearGradient: {
                            x1: x1,
                            y1: y1,
                            x2: x2,
                            y2: y2,
                            stops: []
                        }
                    };

                    //Parse stops
                    for (var i in grad.children) {
                        var stop = grad.children[i];
                        if (stop.name != "stop")
                            continue;

                        var offset = stop.offset;
                        var color = parseColor(stop["stop-color"]);
                        var opacity = stop["stop-opacity"];

                        if (opacity != null)
                            color.a *= opacity;

                        destination.fill.linearGradient.stops.push({
                            color: color,
                            offset: offset
                        });
                    }
                }
                else {
                    //Not supported yet
                }
            }
            else {
                //Solid color
                destination.fill = { color: parseColor(value) };
            }
        }

        function parseNumberOrPercentage(x) {
            if (/%$/g.test(x)) {
                //Ends with %
                return parseFloat(x.substring(0, x.length - 1)) / 100;
            }
            else
                return parseFloat(x);
        }

        function processStroke(destination, value) {
            //Special case: none
            if (!value) {
                destination.stroke = {};
                return;
            }

            value = trim(value);
            if (value == "" || value.toLowerCase() == "none") {
                destination.stroke = {};
                return;
            }

            //Value is a color
            destination.stroke = { color: parseColor(value) };
        }

        function processStyle(destination, value) {
            value = trim(value);
            var parts = value.split(";");

            for (var i in parts) {
                var part = parts[i];

                //Split part (name: value)
                var subparts = part.split(":");
                var stylePartName = trim(subparts[0]);
                var stylePartValue = trim(subparts[1]);

                //Apply as a normal attribute specified outside of "style"
                processAttribute(destination, stylePartName, stylePartValue);
            }
        }
    }

    function trim(str) {
        return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    function parseColor(color) {
        //No color ---> return default color (black)
        if (!color)
            return BLACK;

        color = trim(color);

        if (color == "")
            return BLACK;

        if ((/^#/gi).test(color))
            return parseHexColor(color.substring(1));
        else if ((/^RGB[^A]/gi).test(color))
            return parseRGBColor(color.substring(3));
        else if ((/^RGBA/gi).test(color))
            return parseRGBAColor(color.substring(4));
        else {
            //Try as a color name
            color = color.toLowerCase();
            color = ColorData[color];
            return parseColor(color);
        }

        function parseHexColor(color) {
            color = trim(color);

            if (color.length == 3) {
                //ABC must be interpreted as AABBCC
                color = String.fromCharCode(color.charCodeAt(0), color.charCodeAt(0), color.charCodeAt(1), color.charCodeAt(1), color.charCodeAt(2), color.charCodeAt(2));
            }

            //Now we have six hex digits
            return {
                r: parseInt(color.substring(0, 2), 16),
                g: parseInt(color.substring(2, 4), 16),
                b: parseInt(color.substring(4, 6), 16),
                a: 1
            };
        }

        function parseRGBColor(color) {
            color = trim(color);
            if ((/^\(.*\)$/gi).test(color)) {
                //Starts with ( and ends with )
                color = color.substring(1, color.length - 1);

                //Now we only have numbers
                var parts = trim(color).split(",");
                var r = parseInt(parts[0]);
                var g = parseInt(parts[1]);
                var b = parseInt(parts[2]);
                var a = 1;

                return { r: r, g: g, b: b, a: a };
            }
            else
                return BLACK;
        }

        function parseRGBAColor(color) {
            color = trim(color);
            if ((/^\(.*\)$/gi).test(color)) {
                //Starts with ( and ends with )
                color = color.substring(1, color.length - 1);

                //Now we only have numbers
                var parts = trim(color).split(",");
                var r = parseInt(parts[0]);
                var g = parseInt(parts[1]);
                var b = parseInt(parts[2]);
                var a = parseFloat(parts[3]);

                return { r: r, g: g, b: b, a: a };
            }
            else
                return BLACK;
        }
    }

    var NUMERIC_CHARS = "1234567890.-+";
    var ALPHA_CHARS = "qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM";

    function parsePathDefinition(d) {
        //Empty or no definition --> return null
        if (!d)
            return null;

        d = trim(d);
        if (d == "")
            return null;

        //States
        var START = 0;
        var READ_PARAMS = 1;
        var IN_PARAM = 2;

        //Otherwise, parse
        var commands = [];
        var curCmd, curParam;
        var state = START;

        for (var i = 0; i < d.length; i++) {
            var c = d[i];

            if (state == START) {
                if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else {
                    //Ignore any other char
                }
            }
            else if (state == READ_PARAMS) {
                if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a new command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else if (NUMERIC_CHARS.indexOf(c) >= 0) {
                    //Numeric char: here starts a parameter
                    curParam = c;
                    state = IN_PARAM;
                }
                else {
                    //Ignore any other char
                }
            }
            else if (state == IN_PARAM) {
                if (NUMERIC_CHARS.indexOf(c) >= 0) {
                    //Numeric char: here continues the current parameter
                    curParam += c;
                }
                else if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a new command
                    //First, end processing the current param
                    curCmd.params.push(parseFloat(curParam));
                    curParam = null;

                    //Then start the new command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else {
                    //Any other char means we are done reading this parameter
                    //First, end processing the current param
                    curCmd.params.push(parseFloat(curParam));
                    curParam = null;

                    //Then go back to waiting for a new param or a new command
                    state = READ_PARAMS;
                }
            }
        }

        //At the end, end processing the current param, if any
        if (curParam)
            curCmd.params.push(parseFloat(curParam));

        return commands;
    }


    return {
        parseString: parseString,
        parseColor: parseColor,
        parsePathDefinition: parsePathDefinition
    };

})();
/*
****************************************
XML-to-JSON parser
****************************************



EXAMPLE

Given this XML document:

<books>
<book title="The red apple" />

Random text...

<book title="The Javascript Language" />
</books>


The following call:

var doc = XmlParser.parseString("<books>\n\t<book title=\"The red apple\"/>\n\n\tRandom text...\n\n\t<book title=\"The Javascript Language\" />\n</books>");

yields the following JSON object:

doc = {
name: "books",
attributes: {},
value: null,
children: [
{
name: "book",
attributes: { title: "The red apple" },
value: null,
children: []
},
{
name: "#TEXT",
attributes: { },
value: "Random text...",
children: []
},
{
name: "book",
attributes: { title: "The Javascript Language" },
value: null,
children: []
}
]
}

*/

/* JPVS
Module: parsers
Classes: XmlParser
Depends: 
*/
var XmlParser = (function () {

    var OutOfTag = 0,
        TagName = 1,
        WaitForAttributeName = 2,
        AttributeName = 3,
        WaitForAttributeValue = 4,
        AttributeValue = 5,
        WaitForElementEnd = 6,
        Comment = 7;


    function trim(str) {
        return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    function createEmptyNode() {
        return {
            name: "",
            attributes: {},
            children: [],
            value: null
        };
    }

    function createTextNode(text) {
        return {
            name: "#TEXT",
            attributes: {},
            children: [],
            value: text
        };
    }

    function parseString(s, nodeTransform) {
        //No string --> return null
        if (!s || s == "")
            return null;

        //String present, let's parse
        var state = OutOfTag;
        var nodeStack = [];
        var curNode, curAttrName, curAttrValue, curText = "", curComment = "";

        for (var i = 0; i < s.length; i++) {
            var c = s[i];

            if (state == OutOfTag) {
                //Tag not yet found, look for "<"
                if (c == "<") {
                    //Tag is starting, prepare for reading the tag name
                    state = TagName;

                    //If we have text accumulated, then emit a text node and append it to the current node
                    curText = trim(curText);
                    if (curText.length > 0) {
                        var textNode = createTextNode(curText);
                        curNode.children.push(textNode);
                    }

                    //Reset the accumulated text
                    curText = "";

                    //Create a new node and add it as a child to the current node, if any
                    var oldCurNode = curNode;
                    curNode = createEmptyNode();
                    nodeStack.push(curNode);

                    if (oldCurNode)
                        oldCurNode.children.push(curNode);
                }
                else {
                    //Any other char is plain text
                    curText += c;
                }
            }
            else if (state == TagName) {
                //We are now reading the tag name
                //Stop at the first blank or or "/" or ">"
                if (c == " ") {
                    //End of tag name, look for attributes
                    state = WaitForAttributeName;
                }
                else if (c == "/") {
                    if (curNode.name == "") {
                        //This is a closing tag (</example>) and we have just read the slash, let's keep on reading the name
                        curNode.closing = true;
                    }
                    else {
                        //This is a slash after a tag name
                        //End of tag, no children, let's wait for the closing ">"
                        state = WaitForElementEnd;
                    }
                }
                else if (c == ">") {
                    //End of tag
                    state = OutOfTag;

                    //Let's see what to do with the node stack
                    if (curNode.closing) {
                        //Just finished reading a closing tag
                        //Let's remove this and pop it from the stack
                        if (nodeStack.length > 1) {
                            nodeStack.pop();
                            curNode = nodeStack[nodeStack.length - 1];

                            //The closing tag itself is not a child of the parent: let's pop it off
                            curNode.children.pop();
                        }

                        //Now go up one level (to the parent) because we have just closed an element
                        if (nodeStack.length > 1) {
                            nodeStack.pop();
                            curNode = nodeStack[nodeStack.length - 1];
                        }
                    }
                    else {
                    }
                }
                else {
                    //Still reading the tag name
                    curNode.name += c;

                    //See if this is a comment
                    if (curNode.name == "!--") {
                        //This is not an element but a comment
                        //Let's go to comment mode
                        curComment = "";
                        state = Comment;
                    }
                }
            }
            else if (state == WaitForAttributeName) {
                if (c == " ") {
                    //Still waiting for attribute name
                }
                else if (c == "/") {
                    //End of tag, no children
                    state = WaitForElementEnd;
                }
                else if (c == ">") {
                    //End of tag
                    state = OutOfTag;
                }
                else {
                    //Here an attribute name starts
                    state = AttributeName;
                    curAttrName = c;
                    curAttrValue = "";
                }
            }
            else if (state == AttributeName) {
                if (c == "=") {
                    //End of attribute name, wait for value
                    state = WaitForAttributeValue;
                }
                else {
                    //Still reading the attribute name
                    curAttrName += c;
                }
            }
            else if (state == WaitForAttributeValue) {
                //Only " or blank is valid here
                if (c == " ") {
                    //Keep waiting
                }
                else if (c == "\"") {
                    //Opened quote: now we prepare to read the value
                    state = AttributeValue;
                }
                else {
                    //Not valid
                    throwInvalidChar();
                }
            }
            else if (state == AttributeValue) {
                //We are in the attribute value: keep reading until a closing quote
                if (c == "\"") {
                    //Closing quote, let's wait for a possible next attribute
                    state = WaitForAttributeName;

                    //Add the attribute name/value to the collection
                    curNode.attributes[trim(curAttrName)] = curAttrValue;
                }
                else {
                    //Part of value
                    curAttrValue += c;
                }
            }
            else if (state == WaitForElementEnd) {
                //Found "/", so now the only acceptable char is > or blank
                if (c == " ") {
                    //Keep waiting
                }
                else if (c == ">") {
                    //Tag closed
                    state = OutOfTag;

                    //This also closes the current node
                    if (nodeStack.length > 1) {
                        nodeStack.pop();
                        curNode = nodeStack[nodeStack.length - 1];
                    }
                }
                else {
                    //Not valid
                    throwInvalidChar();
                }
            }
            else if (state == Comment) {
                //We are in a comment, so let's accumulate the chars into the comment string
                curComment += c;

                //Let's determine when the comment finishes
                if ((/-->$/gi).test(curComment)) {
                    //The comment ends here
                    //Let's strip the comment closing sequence "-->" and the blanks
                    curComment = trim(curComment.substring(0, curComment.length - 3));

                    //Let's now update curNode
                    curNode.name = "#COMMENT";
                    curNode.value = curComment;

                    //End of node
                    nodeStack.pop();
                    curNode = nodeStack[nodeStack.length - 1];
                    state = OutOfTag;
                }
            }
            else
                throwUnexpectedState();
        }

        //End: transform all nodes if required
        var doc = nodeStack[0] || null;
        if (nodeTransform)
            transformRecursively(doc);

        return doc;


        function transformRecursively(node) {
            if (node) {
                //Transform the node...
                nodeTransform(node, doc);

                //... and all its children
                if (node.children) {
                    for (var i in node.children) {
                        var child = node.children[i];
                        transformRecursively(child);
                    }
                }
            }
        }

        function throwInvalidChar() {
            throw "Invalid character: " + c;
        }

        function throwUnexpectedState() {
            throw "Unexpected parser state: " + state;
        }
    }

    return {
        parseString: parseString
    };

})();
/* JPVS
Module: widgets
Classes: Button
Depends: core
*/

jpvs.Button = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Button,
    type: "Button",
    cssClass: "Button",

    create: function (container) {
        var obj = document.createElement("button");
        $(obj).attr("type", "button");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.click(function () {
            W.click.fire(W);
        });
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        })
    }
});


/* JPVS
Module: widgets
Classes: CheckBox
Depends: core
*/

jpvs.CheckBox = function (selector) {
    this.attach(selector);
};

jpvs.makeWidget({
    widget: jpvs.CheckBox,
    type: "CheckBox",
    cssClass: "CheckBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "checkbox");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
    },

    prototype: {
        checked: jpvs.property({
            get: function () { return this.element.prop("checked"); },
            set: function (value) { this.element.prop("checked", value); }
        })
    }
});



/* JPVS
Module: widgets
Classes: DropDownList
Depends: core
*/

jpvs.DropDownList = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DropDownList,
    type: "DropDownList",
    cssClass: "DropDownList",

    create: function (container) {
        var obj = document.createElement("select");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            W.change.fire(W);
        });
    },

    prototype: {
        clearItems: function () {
            this.element.empty();
            return this;
        },

        addItem: function (value, text) {
            var opt = document.createElement("option");
            $(opt).attr("value", value).text(text || value).appendTo(this.element);
            return this;
        },

        addItems: function (items) {
            var W = this;
            $.each(items, function (i, item) {
                if (item.value)
                    W.addItem(item.value, item.text);
                else
                    W.addItem(item);
            });

            return this;
        },

        selectedValue: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        })
    }
});


/* JPVS
Module: widgets
Classes: LinkButton
Depends: core
*/

jpvs.LinkButton = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.LinkButton,
    type: "LinkButton",
    cssClass: "LinkButton",

    create: function (container) {
        var obj = document.createElement("a");
        $(obj).attr("href", "#");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.click(function () {
            W.click.fire(W);
        });
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        })
    }
});


/* JPVS
Module: widgets
Classes: TextBox
Depends: core
*/

jpvs.TextBox = function (selector) {
    this.attach(selector);
};

jpvs.makeWidget({
    widget: jpvs.TextBox,
    type: "TextBox",
    cssClass: "TextBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "text");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        })
    }
});


