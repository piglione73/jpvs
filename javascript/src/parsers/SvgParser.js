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

svg = [
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
];

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
            return doc.children;
        else
            return null;
    }

    function transform(node) {
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
            else {
                //Transfer to destination
                var valueAsNumber = parseFloat(value);
                var valueIsNumber = isFinite(valueAsNumber);
                destination[name] = valueIsNumber ? valueAsNumber : value;
            }
        }

        function processFill(destination, value) {
            //Value is a color
            destination.fill = { color: parseColor(value) };
        }

        function processStroke(destination, value) {
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

    return {
        parseString: parseString,
        parseColor: parseColor
    };

})();