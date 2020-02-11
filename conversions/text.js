#!/usr/bin/env node
/*jshint esversion: 8 */

const X2JS = require("x2js");
const operators = require("./data/text-operators.json");
const identifiers = require("./data/text-identifiers.json");
const misc = require("./data/text-misc.json");

/**
 * Get the correct string and return it, return undefined if not found
 * @param s A string or number to find
 * @param source The JSON source
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

function ExtractAttributes(node) {
    var arr = [];
    if (node.attributes.length > 0) {
        for (var i = 0; i < node.attributes.length; i++) {
            var Attr = node.attributes[i];
            if (Attr.nodeName == "xml:lang") arr.push({name: "language", value: Attr.nodeValue});
            else if (Attr.nodeName == "alttext") arr.push({name: "ascii", value: Attr.nodeValue});
            else if (Attr.nodeName == "display") arr.push({name: "display", value: Attr.nodeValue});
            else if (Attr.nodeName == "altimg") arr.push({name: "image", value: Attr.nodeValue});
        }
    }
    return arr;
}

function DividendText(node, words) {
    if (node.parentNode != null && (node.parentNode.localName == "mfrac" && node == node.parentNode.lastChild)) {
        words.push(GetText("and denominator", misc));
    }
}

function ParenthesisTextOpen(node, words) {
    for (var n = 0; n < node.attributes.length; n++) {
        var Attr = node.attributes[n];
        if (Attr.localName == "open") {
            switch (Attr.nodeValue.charCodeAt()) {
                case 40:
                    if (node.previousSibling != null && node.previousSibling.localName == "mo" && node.previousSibling.firstChild.nodeValue.charCodeAt() == 8289) {
                        // Its a function and does not require parenthesis
                    } else if (node.childNodes.firstChild != null && node.childNodes.firstChild.localName == "mtable") {
                        // Its a matrix and does not require parenthesis
                    } else {
                        words.push(GetText(Attr.nodeValue.charCodeAt(), misc));
                    }
                    break;
                case 91:
                case 123:
                case 124:
                    words.push(GetText(Attr.nodeValue.charCodeAt(), misc));
                    break;
                default:
                    console.warn(` [ WARNING ] Missing text for PAREN: ${Attr.nodeValue} (char code: ${Attr.nodeValue.charCodeAt()})`);
                    words.push(Attr.nodeValue);
                    break;
            }
        }
    }
}

function ParenthesisTextClose(node, words) {
    for (var o = 0; o < node.attributes.length; o++) {
        var Attr = node.attributes[o];
        if (Attr.localName == "close") {
            switch (Attr.nodeValue.charCodeAt()) {
                case 41:
                    if (node.previousSibling != null && node.previousSibling.localName == "mo" && node.previousSibling.firstChild.nodeValue.charCodeAt() == 8289) {
                        // Its a function and does not require parenthesis
                    } else if (node.childNodes.firstChild != null && node.childNodes.firstChild.localName == "mtable") {
                        // Its a matrix and does not require parenthesis
                    } else {
                        words.push(GetText(Attr.nodeValue.charCodeAt(), misc));
                    }
                    break;
                case 93:
                case 125:
                    words.push(GetText(Attr.nodeValue.charCodeAt(), misc));
                    break;
                case 124:
                    words.push(GetText(Attr.nodeValue.charCodeAt(), misc));
                    words.push(GetText("end", misc));
                    break;
                default:
                    console.warn(` [ WARNING ] Missing text for PAREN: ${Attr.nodeValue} (char code: ${Attr.nodeValue.charCodeAt()})`);
                    words.push(Attr.nodeValue);
                    break;
            }
        }
    }
}

function RaisedLoweredDerivedText(node, words) {
    if (node.parentNode != null && node.parentNode.localName == "msup") {
        if(node.previousSibling != null && (node.previousSibling.localName == "mi" || node.previousSibling.localName == "mn" || node.previousSibling.localName == "mrow" || node.previousSibling.localName == "mfenced")) {
            if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8242) {
                words.push(GetText("derivative", misc));
            }
            else if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8243) {
                words.push(GetText("double derivative", misc));
            }
            else {
                words.push(GetText("to the power of", misc));
            }
        }
    }
    if(node.parentNode != null && node.parentNode.localName == "mrow" && node.parentNode.parentNode != null && node.parentNode.parentNode.localName == "msup" && node == node.parentNode.firstChild) {
        words.push(GetText("to the power of", misc));
    }
    if ((node.parentNode != null && node.parentNode.localName == "msub") && (node.parentNode.previousSibling != null && (node.parentNode.previousSibling.localName == "mi" || node.parentNode.previousSibling.localName == "mn" || node.parentNode.previousSibling.localName == "mrow" || node.parentNode.previousSibling.localName == "mfenced"))) {
        words.push(GetText("with the lower index", misc));
    }
}

function IsVector(node, words) {
    if(node.lastChild != null && node.lastChild.localName == "mo" && node.lastChild.firstChild.nodeValue.charCodeAt() == 8594) {
        words.push(GetText("vector", misc));
        return true;
    }
    else {
        return false;
    }
}

/**
 * Returns the correct root text for a specified number.
 * @param i A number as string or a string
 */
function RootNumbers(i) {
    const roots = require("./data/text-roots.json");
    
    return roots.find(root => root.id == i).value;
}

function IsFunc(node) {
    if (node.localName == "mrow") {
        return (node.lastChild != null && node.lastChild.localName == "mfenced" && node.lastChild.previousSibling != null && node.lastChild.previousSibling.localName == "mo" && node.lastChild.previousSibling.firstChild.nodeValue.charCodeAt() == 8289);
    }
    else {
        return false;
    }
}

function inWords(num) {
    var a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
    var b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + '' + a[n[5][1]]) : '';
    return str;
}

function ParseNode(node, words) {
    try {
        if (node != null) {
            switch (node.localName) {
                case "mphantom":
                case "mspace":
                case "maligngroup":
                case "malignmark":
                case "maction":
                case "merror":
                case "msline":
                case "none":
                case "mmultiscripts":
                case "mstyle":
                    // Just used for visual representation
                    break;
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
                    for (var m = 0; m < node.childNodes.length; m++) {
                        ParseNode(node.childNodes[m], words);
                    }
                    break;
                case "mtable":
                    words.push(`${GetText("matrix", misc)} ${GetText("start", misc)}, ${GetText("the matrix contains", misc)} ${node.childNodes.length} ${GetText("rows", misc)},`);
                    for (var x = 0; x < node.childNodes.length; x++) {
                        ParseNode(node.childNodes[x], words);
                    }
                    words.push(`${GetText("matrix", misc)} ${GetText("end", misc)}`);
                    break;
                case "mtr":
                case "mlabeledtr":
                    for(var tr = 0; tr < node.parentNode.childNodes.length; tr++) if(node == node.parentNode.childNodes[tr]) break;
                    words.push(`${GetText("row", misc)} ${(tr+1)} ${GetText("contains", misc)} ${node.childNodes.length} ${GetText("cells", misc)}:`);
                    for (var y = 0; y < node.childNodes.length; y++) {
                        words.push(`${GetText("cell", misc)} ${y+1} ${GetText("contains", misc)}`);
                        ParseNode(node.childNodes[y], words);
                    }
                    words.push(`${GetText("row", misc)} ${GetText("end", misc)}${(node != node.parentNode.lastChild ? ',' : '')}`);
                    break;
                case "mtd":
                    for (var a = 0; a < node.childNodes.length; a++) {
                        ParseNode(node.childNodes[a], words);
                    }
                    break;
                case "msub":
                    if((node.parentNode != null && node.parentNode.localName == "mover") && (node.nextSibling != null && node.nextSibling.localName == "mo") && (node.nextSibling.firstChild != null && node.nextSibling.firstChild.nodeValue.charCodeAt() == 8594)) {
                        if(node.childNodes.length >= 2) {
                            ParseNode(node.childNodes[0], words);
                            for (var c = 1; c < node.childNodes.length; c++) {
                                ParseNode(node.childNodes[c], words);
                            }
                        }
                        else {
                            ParseNode(node.childNodes[0], words);
                        }
                    }
                    else {
                        for (var d = 0; d < node.childNodes.length; d++) {
                            ParseNode(node.childNodes[d], words);
                        }
                    }
                    break;
                case "msup":
                    RaisedLoweredDerivedText(node, words);
                    for (var q = 0; q < node.childNodes.length; q++) {
                        ParseNode(node.childNodes[q], words);
                    }
                    break;
                case "mover":
                    var isBound = false;
                    if (IsVector(node, words)) {
                        if(node.childNodes[0] != null && node.childNodes[0].localName == "mi") {
                            words.push(node.childNodes[0].firstChild.nodeValue);
                        }
                        else {
                            for (var o = 0; o < node.childNodes.length; o++) {
                                ParseNode(node.childNodes[o], words);
                            }
                        }
                        words.push(`${GetText("vector", misc)} ${GetText("end", misc)}`);
                    }
                    else {
                        if(node.childNodes.length == 2) { // Length should always be 2 if set delimiter
                            if(node.attributes[0] != null && node.attributes[0].firstChild.nodeName == "accent" && node.attributes[0].firstChild.nodeValue == "true") words.push(`${GetText("bracket", misc)} ${GetText("start", misc)}`);
                            ParseNode(node.childNodes[0], words);
                            words.push(`${GetText("with the upper index", misc)}`);
                            for (var g = 1; g < node.childNodes.length; g++) {
                                ParseNode(node.childNodes[g], words);
                            }
                            if(node.attributes[0] != null && node.attributes[0].firstChild.nodeName == "accent" && node.attributes[0].firstChild.nodeValue == "true") words.push(`${GetText("bracket", misc)} ${GetText("end", misc)}`);
                        }
                        else {
                            for (var p = 0; p < node.childNodes.length; p++) {
                                ParseNode(node.childNodes[p], words);
                            }
                        }
                    }
                    break;
                case "munder":
                    if(node.childNodes.length == 2) { // Length should always be 2 if set delimiter
                        if(node.attributes[0] != null && node.attributes[0].firstChild.nodeName == "accent" && node.attributes[0].firstChild.nodeValue == "true") words.push(`${GetText("bracket", misc)} ${GetText("start", misc)}`);
                        ParseNode(node.childNodes[0], words);
                        words.push(`${GetText("with the lower index", misc)}`);
                        for (var f = 1; f < node.childNodes.length; f++) {
                            ParseNode(node.childNodes[f], words);
                        }
                        if(node.attributes[0] != null && node.attributes[0].firstChild.nodeName == "accent" && node.attributes[0].firstChild.nodeValue == "true") words.push(`${GetText("bracket", misc)} ${GetText("end", misc)}`);
                    }
                    else {
                        for (var s = 0; s < node.childNodes.length; s++) {
                            ParseNode(node.childNodes[s], words);
                        }
                    }
                    break;
                case "munderover":
                case "msubsup":
                    if (node.childNodes.length == 3 && node.firstChild.localName == "mo" && (node.firstChild.firstChild.nodeValue.charCodeAt() == 8747 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8748 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8749 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8750)) {
                        var integralType = "integral";
                        if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8748) integralType = "double integral";
                        else if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8749) integralType = "triple integral";
                        else if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8750) integralType = "contour integral";

                        words.push(`${GetText("the", misc)} ${GetText(integralType, misc)}`);
                        words.push(GetText("with the lower limit", misc));
                        if (node.childNodes[1] != null) {
                            ParseNode(node.childNodes[1], words);
                        }
                        words.push(GetText("and with the upper limit", misc));
                        if (node.childNodes[2] != null) {
                            ParseNode(node.childNodes[2], words);
                        }
                        words.push(`${GetText(integralType, misc)} ${GetText("end", misc)}`);
                    } else {
                        for (var u = 0; u < node.childNodes.length; u++) {
                            ParseNode(node.childNodes[u], words);
                        }
                    }
                    break;
                case "mfenced":
                    DividendText(node, words);
                    ParenthesisTextOpen(node, words);
                    for (var l = 0; l < node.childNodes.length; l++) {
                        ParseNode(node.childNodes[l], words);
                        words.push(GetText("and", misc));
                    }
                    words.pop(); // remove extra 'and'
                    ParenthesisTextClose(node, words);
                    RaisedLoweredDerivedText(node, words);
                    break;
                case "mrow":
                    if(IsFunc(node)) words.push(`${GetText("the", misc)} ${GetText("function", misc)}`);
                    for (var k = 0; k < node.childNodes.length; k++) {
                        ParseNode(node.childNodes[k], words);
                    }
                    if(IsFunc(node)) words.push(`${GetText("function", misc)} ${GetText("end", misc)}`);
                    break;
                case "msqrt":
                    DividendText(node, words);
                    words.push(`${GetText("the", misc)} ${GetText("square root", misc)} ${GetText("of", misc)}`);
                    for (var i = 0; i < node.childNodes.length; i++) ParseNode(node.childNodes[i], words);
                    words.push(`${GetText("square root", misc)} ${GetText("end", misc)}`);
                    break;
                case "mroot":
                    DividendText(node, words);
                    if (node.lastChild != null && node.lastChild.localName == "mn") words.push(`the ${RootNumbers(node.lastChild.firstChild.nodeValue)} root of`); else words.push("the root of");
                    for (var n = 0; n < node.childNodes.length; n++) {
                        if (node.childNodes[n] != node.lastChild && node.lastChild.localName == "mn") {
                            ParseNode(node.childNodes[n], words);
                        }
                    }
                    words.push(`${GetText("root", misc)} ${GetText("end", misc)}`);
                    break;
                case "mfrac":
                    RaisedLoweredDerivedText(node, words);
                    words.push(GetText("fraction with counter", misc));
                    for (var j = 0; j < node.childNodes.length; j++) {
                        ParseNode(node.childNodes[j], words);
                    }
                    words.push(`${GetText("fraction", misc)} ${GetText("end", misc)}`);
                    break;
                case "mo":
                    DividendText(node, words);
                    RaisedLoweredDerivedText(node, words);
                    var mo_val = node.firstChild.nodeValue;
                    var mo_t = GetText(mo_val, operators);
                    if(mo_t != undefined) {
                        words.push(mo_t);
                    }
                    else {
                        var mo_code = mo_val.charCodeAt();
                        var mo_c = GetText(mo_code, operators);
                        if(mo_c != undefined) {
                            switch(mo_code) {
                                case 8242:
                                case 8243:
                                    break;
                                case 8592:
                                    if (node.parentNode != null && node.parentNode.localName == "mrow") {
                                        words.push(mo_c);
                                    }
                                    else {
                                        words.push(GetText("larr", identifiers));
                                    }
                                    break;
                                case 8594:
                                    if (node.parentNode != null ) {
                                        if(node.parentNode.localName == "mrow") {
                                            words.push(mo_c);
                                        }
                                        else if(node.parentNode.localName == "mover") {
                                            // It's a vector, do nothing
                                        }
                                    }
                                    else {
                                        words.push(GetText("rarr", identifiers));
                                    }
                                    break;
                                default:
                                    words.push(mo_c);
                                    break;
                            }
                        }
                        else {
                            if (mo_code > 127) console.warn(` [ WARNING ] Missing text-operator: ${mo_val} (char code: ${mo_code})`);
                            words.push(mo_val);
                        }
                    }
                    break;
                case "mi":
                    DividendText(node, words);
                    RaisedLoweredDerivedText(node, words);
                    if (node.firstChild != null && node.firstChild.nodeValue == node.firstChild.nodeValue.toUpperCase() && (node.firstChild != null && node.firstChild.nodeValue.charCodeAt() != 8734)) words.push("capital"); // if capital, except infinity
                    
                    var mi_val = node.firstChild.nodeValue;
                    var mi_t = GetText(mi_val, identifiers);
                    if(mi_t != undefined) {
                        words.push(mi_t);
                    }
                    else {
                        var mi_code = mi_val.charCodeAt();
                        var mi_c = GetText(mi_code, identifiers);
                        if(mi_c != undefined) {
                            switch(mi_code) {
                                case 176:
                                    words.push(GetText((node.previousSibling.firstChild.nodeValue == 1) ? "degree" : "degrees", identifiers));
                                    break;
                                default:
                                    words.push(mi_c);
                                    break;
                            }
                        }
                        else {
                            if (mi_code > 127) console.warn(` [ WARNING ] Missing text-identifier: ${mi_val} (char code: ${mi_code})`);
                            words.push(mi_val);
                        }
                    }
                    break;
                case "mtext":
                    DividendText(node, words);
                    RaisedLoweredDerivedText(node, words);
                    words.push(node.firstChild.nodeValue);
                    break;
                case "mn":
                    DividendText(node, words);
                    RaisedLoweredDerivedText(node, words);
                    words.push(node.firstChild.nodeValue);
                    break;
                case "mspace":
                    break;
                default:
                    if(node.firstChild != null) {
                        console.warn(` [ WARNING ] Missing translation for: ${node.firstChild.nodeValue}`);
                        words.push(node.firstChild.nodeValue);
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

function Detect(root, words) {
    var word = "";
    for(var z = 0; z < root.attributes.length; z++) {
        var Attr = root.attributes[z];
        if(Attr.nodeName == "class") {
            if(Attr.nodeValue == "chemistry") {
                word = "chemical formula";
            }
            else if(Attr.nodeValue == "physics") {
                word = "physics formula";
            }
            break;
        }
    }
    if(word == "" && root.localName == "math") word = "formula";
    words.push(word);
}

module.exports = {
    GenerateMath: async (content) => {
        var words = [], x2js = new X2JS(), root = {};

        try {
            var dom = x2js.xml2dom(content);

            // Build words array
            root = dom.childNodes[0];
            Detect(root, words);
            ParseNode(dom.childNodes[0], words);
            words.push("formula end");
            // Return words in an array which can be prosessed by the translation service and API
            
            var attributes = ExtractAttributes(root);

            // Defaults
            var lang = "no", asciiMath = "", display = "block", image = "";

            if(attributes.find(m => m.name == "language") != null) lang = attributes.find(m => m.name == "language").value;
            if(attributes.find(m => m.name == "ascii") != null) asciiMath = attributes.find( m => m.name == "ascii").value;
            if(attributes.find(m => m.name == "display") != null) display = attributes.find( m => m.name == "display").value;
            if(attributes.find(m => m.name == "image") != null) image = attributes.find( m => m.name == "image").value;

            return { success: true, language: lang, words: words, ascii: asciiMath, display: display, imagepath: image };
        }
        catch (ex) {
            throw ex;
        }
    }
};