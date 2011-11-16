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
        WaitForElementEnd = 6;


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
        var curNode, curAttrName, curAttrValue, curText = "";

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
                    }
                    else {
                    }
                }
                else {
                    //Still reading the tag name
                    curNode.name += c;
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
                nodeTransform(node);

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