#!/usr/bin/env node
/*jshint esversion: 8 */

const operators = require("./data/text-operators.json");
const identifiers = require("./data/text-identifiers.json");
const misc = require("./data/text-misc.json");
const DOMParser = require("xmldom").DOMParser;
const { GetALIX, GetDefaultIndexes, GetDefaultModifiers } = require("./alix");
const modifiers = GetDefaultModifiers();

/**
 * Get the correct string and return it, return undefined if not found
 * @param {String} s A string or number to find
 * @param {String} source The JSON source
 * @returns {String|undefined} The text found
 */
function GetText(s, source) {
    var found;
    if(typeof(s) == "string") {
        if(/[^\u0000-\u00ff]/.test(s)) {
            found = source.unicode.find( m => m.code == s );
        }
        else {
            found = source.strings.find( m => m.name == s );
        }
        return (found != undefined) ? found.value : undefined;
    }
    else if(typeof(s) == "number") {
        found = source.chars.find( m => m.code == s );
        return (found != undefined) ? found.value : undefined;
    }
    else {
        return undefined;
    }
}

/**
 * Adds a word to the words array
 * @param {String} word The word to add
 * @param {Array<String>} words The words array
 * @returns {Boolean} Successful?
 */
function AddWord(word, words) {
    var success = false;
    try {
        if(word) words.push(word);
        success = true;
    } catch(ex) {
        console.error(ex);
    }
    return success;
}

/**
 * Extracts attributes from document
 * @param {HTMLElement} root The document to work with
 * @returns {Array<{name:String,value:String|null}>} The extracted attributes
 */
function ExtractAttributes(root) {
    return [
        {name: "language", value: root.getAttribute("xml:lang") || null },
        {name: "ascii", value: root.getAttribute("alttext") || null },
        {name: "display", value: root.getAttribute("display") || null },
        {name: "image", value: root.getAttribute("altimg") || null }
    ];
}

/**
 * Generates dividend text
 * @param {ChildNode} node The document to work with
 * @param {Array<String>} words The words array
 */
function DividendText(node, words) {
    if (node.parentNode != null && (node.parentNode.localName == "mfrac" && node == node.parentNode.lastChild)) {
        AddWord(GetText("and denominator", misc), words);
    }
}

/**
 * Generates parenthesis start text
 * @param {ChildNode} node The document to work with
 * @param {Array<String>} words The words array
 */
function ParenthesisTextOpen(node, words) {
    var cont = true;
    if(node.nextSibling != null && node.nextSibling.localName == "mo") {
        if(node.nextSibling.firstChild.nodeValue.charCodeAt() == 8242) {// Derivative
            cont = false;
            AddWord(GetText("the derivative of the expression", misc), words);
        }
        else if(node.nextSibling.firstChild.nodeValue.charCodeAt() == 8243) { // Double derivative
            cont = false;
            AddWord(GetText("the double derivative of the expression", misc), words);
        }
    }

    if(cont) {
        var Attr = node.getAttribute("open"), charCode = 0, IsSiblingMo = false, IsPreviousSiblingFunction = false, IsFirstChildMtable = false;

        try {
            charCode = Attr.charCodeAt();
        } catch(ex) {
            // Do nothing
        }

        try {
            IsSiblingMo = node.previousSibling.localName == "mo";
        } catch(ex) { 
            // Do nothing
        }
        try {
            IsPreviousSiblingFunction = node.previousSibling.firstChild.nodeValue.charCodeAt() == 8289;
        } catch(ex) { 
            // Do nothing
        }
        try {
            IsFirstChildMtable = node.firstChild.localName == "mtable";
        } catch(ex) { 
            // Do nothing
        }

        switch (charCode) {
            case 40:
                if ((IsPreviousSiblingFunction && IsSiblingMo) || IsFirstChildMtable ) {
                    // Its does not require parenthesis text
                } else {
                    AddWord(GetText(charCode, misc), words);
                }
                break;
            case 91:
            case 123:
            case 124:
                AddWord(GetText(charCode, misc), words);
                break;
            default:
                console.warn(` [ WARNING ] Missing text for PAREN: ${Attr} (char code: ${charCode})`);
                AddWord(GetText(40, misc), words);
                break;
        }
    }
}

/**
 * Generates parenthesis end text
 * @param {ChildNode} node The document to work with
 * @param {Array<String>} words The words array
 */
function ParenthesisTextClose(node, words) {
    var cont = true;
    if(node.nextSibling != null && node.nextSibling.localName == "mo") {
        if(node.nextSibling.firstChild.nodeValue.charCodeAt() == 8242 || node.nextSibling.firstChild.nodeValue.charCodeAt() == 8243) { // Derivative or Double derivative
            cont = false;
            AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
        }
    }

    if(cont) {
        var Attr = node.getAttribute("close"), charCode = 0, IsSiblingMo = false, IsPreviousSiblingFunction = false, IsFirstChildMtable = false;

        try {
            charCode = Attr.charCodeAt();
        } catch(ex) {
            // Do nothing
        }

        try {
            IsSiblingMo = node.previousSibling.localName == "mo";
        } catch(ex) { 
            // Do nothing
        }
        try {
            IsPreviousSiblingFunction = node.previousSibling.firstChild.nodeValue.charCodeAt() == 8289;
        } catch(ex) { 
            // Do nothing
        }
        try {
            IsFirstChildMtable = node.firstChild.localName == "mtable";
        } catch(ex) { 
            // Do nothing
        }

        switch (charCode) {
            case 41:
                if ((IsPreviousSiblingFunction && IsSiblingMo) || IsFirstChildMtable ) {
                    // Its does not require parenthesis text
                } else {
                    AddWord(GetText(charCode, misc), words);
                }
                break;
            case 93:
            case 125:
                AddWord(GetText(charCode, misc), words);
                break;
            case 124:
                AddWord(`${GetText(charCode, misc)} ${GetText("end", misc)},`, words);
                break;
            default:
                console.warn(` [ WARNING ] Missing text for PAREN: ${Attr} (char code: ${charCode})`);
                AddWord(GetText(41, misc), words);
                break;
        }
        charCode = 0;
    }
}

/**
 * Generates raised and lowered texts
 * @param {ChildNode} node The document to work with
 * @param {Array<String>} words The words array
 */
function RaisedLoweredText(node, words) {
    if (node.parentNode != null && node.parentNode.localName == "msup") {
        if(node.previousSibling != null && (node.previousSibling.localName == "mi" || node.previousSibling.localName == "mn" || node.previousSibling.localName == "mrow" || node.previousSibling.localName == "mfenced")) {
            if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8242) {
                // Derivative is handled elsewhere
                AddWord(GetText("derivative", misc), words);
            }
            else if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8243) {
                // Double derivative is handled elsewhere
                AddWord(GetText("double derivative", misc), words);
            }
            else {
                AddWord(GetText("to the power of", misc), words);
            }
        }
    }
    if(node.parentNode != null && node.parentNode.localName == "mrow" && node.parentNode.parentNode != null && node.parentNode.parentNode.localName == "msup" && node == node.parentNode.firstChild) {
        AddWord(GetText("to the power of", misc), words);
    }
}

/**
 * Creates a standard loop on the node document
 * @param {ChildNode} node The document to work with
 * @param {Array<String>} words The words array
 * @param {Number} start Where to start the loop
 * @param {Array<String>} indexes The index array
 * @param {?Array<ChildNode>} exclude Exclude the following nodes
 */
function StandardLoop(node, words, start, indexes, exclude = []) {
    for (var num = start; num < node.childNodes.length; num++) {
        if(node.childNodes[num]) {
            const child = node.childNodes[num];
            if (exclude.length > 0) {
                if (exclude.includes(child) === false) {
                    ParseNode(child, words, indexes);
                }
            } else {
                ParseNode(child, words, indexes);
            }
        }
    }
}

/**
 * Checks if this is a vector
 * @param {ChildNode} node The document to work with
 * @param {Array<String>} words The words array
 * @returns {Boolean} Is this a vector or not
 */
function IsVector(node, words) {
    if(node.lastChild != null && node.lastChild.localName == "mo" && node.lastChild.firstChild.nodeValue.charCodeAt() == 8594) {
        return true;
    }
    else {
        return false;
    }
}

/**
 * Returns the correct root text for a specified number.
 * @param {String} i A number as string or a string
 * @returns {String} The textual represenation of a root number
 */
function RootNumbers(i) {
    const roots = require("./data/text-roots.json");
    
    return roots.find(root => root.id == i).value;
}

/**
 * Checks if this is a function
 * @param {ChildNode} node The document to work with
 * @returns {Boolean} Is it a function?
 */
function IsFunc(node) {
    if (node.localName == "mrow") {
        return (node.lastChild != null && node.lastChild.localName == "mfenced" && node.lastChild.previousSibling != null && node.lastChild.previousSibling.localName == "mo" && node.lastChild.previousSibling.firstChild.nodeValue.charCodeAt() == 8289);
    }
    else {
        return false;
    }
}

/**
 * Checks if this is an expression
 * @param {ChildNode} node The document to work with
 * @returns {Boolean} Is it an expression?
 */
function IsExp(node) {
    if (["mrow","msup","msub","mfrac"].includes(node.localName)) {
        var idents = ["sin","log","ln","tan","arcsin","arccos","arctan","sinh","cosh","tanh","coth","sech","cosech","csch","arsinh","arcosh","artanh",
            "arcoth","cot","sec","cosec","csc","arccot","arcsec","arccosec","arccsc"];
        return ((node.previousSibling != null && node.previousSibling.localName == "mo" && node.previousSibling.firstChild.nodeValue.charCodeAt() == 8289) && 
            (node.previousSibling.previousSibling != null && node.previousSibling.previousSibling.localName == "mi" && 
            idents.includes(node.previousSibling.previousSibling.firstChild.nodeValue)));
    }
    else {
        return false;
    }
}

/**
 * Parses document node generating a words array
 * @param {Node} node The document to work with
 * @param {Array<String>} words The generated words array
 * @param {Array<String>} indexes The index array
 */
function ParseNode(node, words, indexes) {
    try {
        if (node != null) {
            indexes[node.localName]++;
            switch (node.localName) {
                case "mphantom":
                case "mspace":
                case "maligngroup":
                case "malignmark":
                case "maction":
                case "merror":
                case "msline":
                case "none":
                    break;
                case "mstyle":
                case "mprescripts":
                case "mpadded":
                case "menclose":
                case "math":
                case "semantics":
                case "mstack":
                case "msgroup":
                case "msrow":
                case "mscarries":
                case "mscarry":
                case "mlongdiv":
                    StandardLoop(node, words, 0, indexes);
                    break;
                case "mmultiscripts":
                    if (node.firstChild.localName === "mtext" && node.firstChild.nextSibling.localName === "mprescripts") {
                        // Chemical isotopes
                        var definingNode = node.firstChild;
                        var preRaisedNode = definingNode.nextSibling.nextSibling.nextSibling.firstChild;
                        var preLoweredNode = definingNode.nextSibling.nextSibling;

                        AddWord(preRaisedNode.firstChild.nodeValue, words);
                        AddWord(`${GetText("over", misc) }`, words);
                        AddWord(preLoweredNode.firstChild.nodeValue, words);
                        AddWord(`${GetText("prior to", misc)}`, words);
                        AddWord(definingNode.firstChild.nodeValue, words);
                    }
                    break;
                case "mtable":
                    AddWord(`${GetText("matrix", misc)} ${GetText("start", misc)}, ${GetText("the matrix contains", misc)} ${node.childNodes.length} ${GetText("rows", misc)},`, words);
                    StandardLoop(node, words, 0, indexes);
                    AddWord(`${GetText("matrix", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "mtr":
                case "mlabeledtr":
                    for(var tr = 0; tr < node.parentNode.childNodes.length; tr++) if(node == node.parentNode.childNodes[tr]) break;
                    AddWord(`${GetText("row", misc)} ${(tr+1)} ${GetText("contains", misc)} ${node.childNodes.length} ${GetText("cells", misc)}:`, words);
                    for (var y = 0; y < node.childNodes.length; y++) {
                        AddWord(`${GetText("cell", misc)} ${y+1} ${GetText("contains", misc)}`, words);
                        ParseNode(node.childNodes[y], words, indexes);
                        words[words.length-1] = `${words[words.length-1]},`;
                    }
                    AddWord(`${GetText("row", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "mtd":
                    StandardLoop(node, words, 0, indexes);
                    break;
                case "msub":
                    DividendText(node, words);
                    if((node.parentNode != null && node.parentNode.localName === "mover")) {
                        if(node.nextSibling != null && node.nextSibling.localName === "mo" && (node.nextSibling.firstChild != null && node.nextSibling.firstChild.nodeValue.charCodeAt() == 8594)) {
                            if(node.childNodes.length >= 2) {
                                ParseNode(node.childNodes[0], words, indexes);
                                AddWord(`${GetText("with the lower index", misc)}`, words);
                                StandardLoop(node, words, 1, indexes);
                            }
                            else {
                                ParseNode(node.childNodes[0], words, indexes);
                            }
                        }
                    }
                    else if(node.childNodes.length >= 2) {
                        ParseNode(node.childNodes[0], words, indexes);
                        AddWord(`${GetText("with the lower index", misc)}`, words);
                        StandardLoop(node, words, 1, indexes);
                        AddWord(`${GetText("index", misc)} ${GetText("end", misc)},`, words);
                    }
                    else {
                        if(IsExp(node)) AddWord(`${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                        StandardLoop(node, words, 0, indexes);
                        if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
                    }
                    break;
                case "msup":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if(IsExp(node)) AddWord(`${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                    StandardLoop(node, words, 0, indexes);
                    if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "mover":
                    var isBound = false;
                    if (IsVector(node, words)) {
                        AddWord(GetText("vector", misc), words);
                        if(node.childNodes[0] != null && node.childNodes[0].localName == "mi") {
                            AddWord(node.childNodes[0].firstChild.nodeValue, words);
                        }
                        else {
                            StandardLoop(node, words, 0, indexes);
                        }
                        AddWord(`${GetText("vector", misc)} ${GetText("end", misc)},`, words);
                    }
                    else {
                        if(node.childNodes.length == 2) { // Length should always be 2 if set delimiter
                            var IsMacron1 = false;
                            var HasAccent1 = false;
                            try {
                                IsMacron1 = ( node.lastChild && node.lastChild.localName === "mo" && node.lastChild.firstChild.nodeValue.charCodeAt() === 175 );
                            } catch(ex) {
                                // Do nothing
                            }
                            try {
                                HasAccent1 = ( node.getAttribute("accent") === "true" || node.getAttribute("accentunder") === "true" || node.getAttribute("accentover") === "true" );
                            } catch(ex) {
                                // Do nothing
                            }
                            if(IsMacron1) {
                                AddWord(GetText("the arithmetic mean", misc), words);
                                ParseNode(node.childNodes[0], words, indexes);
                            } else if (HasAccent1) {
                                AddWord(`${GetText("curly bracket", misc)} ${GetText("over", misc)} ${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                                ParseNode(node.childNodes[0], words, indexes);
                                AddWord(`${GetText("with the upper index", misc)}`, words);
                                StandardLoop(node, words, 1, indexes);
                                AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
                            } else {
                                ParseNode(node.childNodes[0], words, indexes);
                                AddWord(`${GetText("with the upper index", misc)}`, words);
                                StandardLoop(node, words, 1, indexes);
                                AddWord(',', words);
                            }
                        }
                        else {
                            StandardLoop(node, words, 0, indexes);
                        }
                    }
                    break;
                case "munder":
                    if(node.childNodes.length == 2) {
                        var IsMacron2 = false;
                        var HasAccent2 = false;
                        try {
                            IsMacron2 = ( node.lastChild && node.lastChild.localName === "mo" && node.lastChild.firstChild.nodeValue.charCodeAt() === 175 );
                        } catch(ex) {
                            // Do nothing
                        }
                        try {
                            HasAccent2 = ( node.getAttribute("accent") === "true" || node.getAttribute("accentunder") === "true" || node.getAttribute("accentover") === "true" );
                        } catch(ex) {
                            // Do nothing
                        }
                        if(IsMacron2) {
                            AddWord(GetText("the arithmetic mean", misc), words);
                            ParseNode(node.firstChild, words, indexes);
                        } else if (HasAccent2) {
                            AddWord(`${GetText("curly bracket", misc)} ${GetText("under", misc)} ${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                            ParseNode(node.firstChild, words, indexes);
                            AddWord(`${GetText("with the lower index", misc)}`, words);
                            StandardLoop(node, words, 1, indexes);
                            AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
                        } else {
                            ParseNode(node.firstChild, words, indexes);
                            AddWord(`${GetText("with the lower index", misc)}`, words);
                            StandardLoop(node, words, 1, indexes);
                            if(node.firstChild != null && node.firstChild.firstChild != null && node.firstChild.firstChild.firstChild != null && node.firstChild.firstChild.firstChild.nodeValue == "lim") {
                                AddWord(',', words);
                                if (node.nextSibling.firstChild.localName != "mfrac") {
                                    AddWord(`${GetText("for", misc)}`, words);
                                }
                            }
                        }
                    }
                    else {
                        StandardLoop(node, words, 0);
                    }
                    break;
                case "munderover":
                case "msubsup":
                    if (node.childNodes.length == 3 && node.firstChild.localName == "mo" && (node.firstChild.firstChild.nodeValue.charCodeAt() == 8747 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8748 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8749 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8750)) {
                        var integralType = "integral";
                        if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8748) integralType = "double integral";
                        else if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8749) integralType = "triple integral";
                        else if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8750) integralType = "contour integral";

                        AddWord(`${GetText("the", misc)} ${GetText(integralType, misc)}`, words);
                        AddWord(GetText("with the lower limit", misc), words);
                        if (node.childNodes[1] != null) {
                            ParseNode(node.childNodes[1], words, indexes);
                        }
                        AddWord(GetText("and with the upper limit", misc), words);
                        if (node.childNodes[2] != null) {
                            ParseNode(node.childNodes[2], words, indexes);
                        }
                        AddWord(`${GetText(integralType, misc)} ${GetText("end", misc)},`, words);
                    } else {
                        StandardLoop(node, words, 0, indexes);
                    }
                    break;
                case "mfenced":
                    DividendText(node, words);
                    ParenthesisTextOpen(node, words);
                    for (var l = 0; l < node.childNodes.length; l++) {
                        ParseNode(node.childNodes[l], words, indexes);
                        AddWord(GetText("and", misc), words);
                    }
                    words.pop(); // remove extra 'and'
                    ParenthesisTextClose(node, words);
                    RaisedLoweredText(node, words);
                    break;
                case "mrow":
                    DividendText(node, words);
                    if(IsFunc(node)) AddWord(`${GetText("the", misc)} ${GetText("function", misc)}`, words);
                    if(IsExp(node)) AddWord(`${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                    StandardLoop(node, words, 0, indexes);
                    if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
                    if(IsFunc(node)) AddWord(`${GetText("function", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "msqrt":
                    DividendText(node, words);
                    AddWord(`${GetText("the", misc)} ${GetText("square root", misc)} ${GetText("of", misc)}`, words);
                    for (var i = 0; i < node.childNodes.length; i++) ParseNode(node.childNodes[i], words, indexes);
                    AddWord(`${GetText("square root", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "mroot":
                    DividendText(node, words);
                    if (node.lastChild != null && node.lastChild.localName == "mn") AddWord(`the ${RootNumbers(node.lastChild.firstChild.nodeValue)} root of`); else AddWord("the root of", words);
                    for (var n = 0; n < node.childNodes.length; n++) {
                        if (node.childNodes[n] != node.lastChild && node.lastChild.localName == "mn") {
                            ParseNode(node.childNodes[n], words, indexes);
                        }
                    }
                    AddWord(`${GetText("root", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "mfrac":
                    RaisedLoweredText(node, words);
                    if(IsExp(node)) AddWord(`${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                    AddWord(GetText("fraction with counter", misc), words);
                    StandardLoop(node, words, 0, indexes);
                    AddWord(`${GetText("fraction", misc)} ${GetText("end", misc)},`, words);
                    if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "mo":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if(node.firstChild !== null) {
                        var mo_val = node.firstChild.nodeValue;
                        var mo_text = GetText(mo_val, operators);
                        var mo_code = mo_val.charCodeAt();
                        if(mo_text != undefined) {
                            switch(mo_code) {
                                case 8242:
                                case 8243:
                                    break;
                                case 8592:
                                    if (node.parentNode != null && node.parentNode.localName == "mrow") {
                                        AddWord(mo_text, words);
                                    }
                                    else {
                                        AddWord(GetText("larr", identifiers), words);
                                    }
                                    break;
                                case 8594:
                                    if (node.parentNode != null ) {
                                        if(node.parentNode.localName == "mrow") {
                                            AddWord(mo_text, words);
                                        }
                                        else if(node.parentNode.localName == "mover") {
                                            // It's a vector, do nothing
                                        }
                                    }
                                    else {
                                        AddWord(GetText("rarr", identifiers), words);
                                    }
                                    break;
                                default:
                                    AddWord(mo_text, words);
                                    break;
                            }
                        }
                        else {
                            var mo_c = GetText(mo_code, operators);
                            if(mo_c != undefined) {
                                switch(mo_code) {
                                    case 8242:
                                    case 8243:
                                        break;
                                    case 8592:
                                        if (node.parentNode != null && node.parentNode.localName == "mrow") {
                                            AddWord(mo_c, words);
                                        }
                                        else {
                                            AddWord(GetText("larr", identifiers), words);
                                        }
                                        break;
                                    case 8594:
                                        if (node.parentNode != null ) {
                                            if(node.parentNode.localName == "mrow") {
                                                AddWord(mo_c, words);
                                            }
                                            else if(node.parentNode.localName == "mover") {
                                                // It's a vector, do nothing
                                            }
                                        }
                                        else {
                                            AddWord(GetText("rarr", identifiers), words);
                                        }
                                        break;
                                    default:
                                        AddWord(mo_c, words);
                                        break;
                                }
                            }
                            else {
                                if (mo_code > 127) console.warn(` [ WARNING ] Missing text-operator: ${mo_val} (char code: ${mo_code})`);
                                
                                var value = 1;
                                if ( mo_code === 176) {
                                    try {
                                        value = node.previousSibling.firstChild.nodeValue;
                                    }
                                    catch(ex) {
                                        // Do nothing
                                    }
                                    AddWord(GetText((value === 1) ? "degree" : "degrees", identifiers), words);
                                }
                                else {
                                    AddWord(mo_val, words);
                                }
                            }
                        }
                    }
                    break;
                case "mi":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if (node.firstChild != null && node.firstChild.nodeValue == node.firstChild.nodeValue.toUpperCase() && (node.firstChild != null && node.firstChild.nodeValue.charCodeAt() != 8734)) { // if capital, except infinity
                        AddWord("capital", words);
                        node.firstChild.nodeValue = node.firstChild.nodeValue.toLowerCase();
                    }

                    if(node.firstChild !== null) {
                        var mi_val = node.firstChild.nodeValue;
                        var mi_text = GetText(mi_val, identifiers);
                        var mi_code = mi_val.charCodeAt();
                        var value = 1;
                        if(mi_text != undefined) {
                            switch(mi_code) {
                                case 176:
                                    try {
                                        value = node.previousSibling.firstChild.nodeValue;
                                    }
                                    catch(ex) {
                                        // Do nothing
                                    }
                                    AddWord(GetText((value === 1) ? "degree" : "degrees", identifiers), words);
                                    break;
                                default:
                                    AddWord(mi_text, words);
                                    break;
                            }
                        }
                        else {
                            var mi_c = GetText(mi_code, identifiers);
                            if(mi_c != undefined) {
                                switch(mi_code) {
                                    case 176:
                                        try {
                                            value = node.previousSibling.firstChild.nodeValue;
                                        }
                                        catch(ex) {
                                            // Do nothing
                                        }
                                        AddWord(GetText((value === 1) ? "degree" : "degrees", identifiers), words);
                                        break;
                                    default:
                                        AddWord(mi_c, words);
                                        break;
                                }
                            }
                            else {
                                if (mi_code > 127) console.warn(` [ WARNING ] Missing text-identifier: ${mi_val} (char code: ${mi_code})`);
                                AddWord(mi_val, words);
                            }
                        }
                    }
                    break;
                case "mtext":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if(node.firstChild !== null) AddWord(node.firstChild.nodeValue, words);
                    break;
                case "mn":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if(node.firstChild !== null) AddWord(node.firstChild.nodeValue, words);
                    break;
                case "mspace":
                    break;
                default:
                    if(node.firstChild !== null) {
                        console.warn(` [ WARNING ] Missing translation for: ${node.firstChild.nodeValue}`);
                        AddWord(node.firstChild.nodeValue, words);
                    }
                    break;
            }
        }
    }
    catch (ex) {
        console.error(ex);
        throw ex;
    }
}

module.exports = {
    GenerateMath: async (content) => {
        var words = [];
        var indexes = GetDefaultIndexes();

        try {
            var dom = new DOMParser().parseFromString(content);

            var root = dom.documentElement;

            // Build words array
            AddWord("equation", words);
            ParseNode(root, words, indexes);
            AddWord("equation end", words);

            // Generate "Algoritme LesbarhetsIndeX (ALIX)"
            var alix = GetALIX(indexes, modifiers);
            var attributes = ExtractAttributes(root);

            // Defaults
            var lang = "no", asciiMath = "", display = "block", image = "";

            if(attributes.find(m => m.name == "language") != null) lang = attributes.find(m => m.name == "language").value;
            if(attributes.find(m => m.name == "ascii") != null) asciiMath = attributes.find( m => m.name == "ascii").value;
            if(attributes.find(m => m.name == "display") != null) display = attributes.find( m => m.name == "display").value;
            if(attributes.find(m => m.name == "image") != null) image = attributes.find( m => m.name == "image").value;

            // Return values
            var obj = { success: true, language: lang, words, ascii: asciiMath, display, imagepath: image, alix };
            return obj;
        }
        catch (ex) {
            throw ex;
        }
    }
};
