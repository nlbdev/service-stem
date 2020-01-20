#!/usr/bin/env node
/*jshint esversion: 8 */

const X2JS = require("x2js");
const { Translate } = require('@google-cloud/translate').v2;

function ExtractLanguage(node) {
    let lang = "en";
    if (node.attributes.length > 0) {
        for (var i = 0; i < node.attributes.length; i++) {
            var Attr = node.attributes[i];
            if (Attr.nodeName == "xml:lang") lang = Attr.nodeValue;
        }
    }
    return lang;
}

function DividendText(node, words) {
    if (node.parentNode != null && (node.parentNode.localName == "mfrac" && node == node.parentNode.lastChild)) {
        words.push("divided by");
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
                    } else {
                        words.push("left parenthesis");
                    }
                    break;
                case 91:
                    words.push("left square bracket");
                    break;
                case 123:
                    words.push("left curly bracket");
                    break;
                case 124:
                    words.push("the absolute value");
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
                    } else {
                        words.push("right parenthesis");
                    }
                    break;
                case 93:
                    words.push("right square bracket");
                    break;
                case 124:
                    words.push("absolute value end");
                    break;
                case 125:
                    words.push("right curly bracket");
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
    if (node.parentNode != null && (node.parentNode.localName == "msup") && node.previousSibling != null && (node.previousSibling.localName == "mi" || node.previousSibling.localName == "mn" || node.previousSibling.localName == "mrow" || node.previousSibling.localName == "mfenced")) {
        if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8242) {
            words.push("derived");
        }
        else if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8243) {
            words.push("double derived");
        }
        else {
            words.push("to the power of");
        }
    }
    if (node.parentNode != null && (node.parentNode.localName == "msub") && node.previousSibling != null && (node.previousSibling.localName == "mi" || node.previousSibling.localName == "mn" || node.previousSibling.localName == "mrow" || node.previousSibling.localName == "mfenced")) {
        words.push("with the lower index");
    }
}

/**
 * Returns the correct order text for a specified number.
 * @param i A number as string or a string
 */
function RootNumbers(i) {
    var tmp = "";
    switch (i) {
        case "1":
            tmp = "radical";
            break;
        case "2":
            tmp = "square";
            break;
        case "3":
            tmp = "cube";
            break;
        case "4":
            tmp = "fourth";
            break;
        case "5":
            tmp = "fifth";
            break;
        case "6":
            tmp = "sixth";
            break;
        case "7":
            tmp = "seventh";
            break;
        case "8":
            tmp = "eight";
            break;
        case "9":
            tmp = "ninth";
            break;
        case "10":
            tmp = "tenth";
            break;
        case "n":
            tmp = "nth";
            break;
        default:
            tmp = i;
            break;
    }
    return tmp;
}

function IsFunc(node) {
    if (node.localName == "mrow") {
        return (node.lastChild != null && node.lastChild.localName == "mfenced" && node.lastChild.previousSibling != null && node.lastChild.previousSibling.localName == "mo" && node.lastChild.previousSibling.firstChild.nodeValue.charCodeAt() == 8289);
    }
    else {
        return false;
    }
}

function ParseNode(node, words) {
    try {
        if (node != null) {
            switch (node.localName) {
                case "math":
                case "msub":
                case "semantics":
                    for (var m = 0; m < node.childNodes.length; m++) {
                        ParseNode(node.childNodes[m], words);
                    }
                    break;
                case "msup":
                    RaisedLoweredDerivedText(node, words);
                    for (var q = 0; q < node.childNodes.length; q++) {
                        ParseNode(node.childNodes[q], words);
                    }
                    break;
                case "mover":
                    if (node.lastChild != null && node.lastChild.localName == "mo" && node.lastChild.firstChild.nodeValue.charCodeAt() == 8594) words.push("vector");
                    for (var o = 0; o < node.childNodes.length; o++) {
                        ParseNode(node.childNodes[o], words);
                    }
                    if (node.lastChild != null && node.lastChild.localName == "mo" && node.lastChild.firstChild.nodeValue.charCodeAt() == 8594) words.push("vector end");
                    break;
                case "munder":
                    for (var s = 0; s < node.childNodes.length; s++) {
                        ParseNode(node.childNodes[s], words);
                    }
                    break;
                case "munderover":
                    if (node.childNodes.length == 3 && node.firstChild.localName == "mo" && (node.firstChild.firstChild.nodeValue.charCodeAt() == 8747 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8748 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8749 || node.firstChild.firstChild.nodeValue.charCodeAt() == 8750)) {
                        var integralType = "integral";
                        if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8748) integralType = "double integral";
                        else if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8749) integralType = "triple integral";
                        else if (node.firstChild.firstChild.nodeValue.charCodeAt() == 8750) integralType = "contour integral";

                        words.push(`the ${integralType}`);
                        words.push("with the lower limit");
                        if (node.nextSibling != null) {
                            ParseNode(node.nextSibling, words);
                        }
                        words.push("and with the upper limit")
                        if (node.lastChild != null) {
                            ParseNode(node.lastChild, words);
                        }
                        words.push(`${integralType} end`);
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
                        words.push("and");
                    }
                    words.pop(); // remove extra 'and'
                    ParenthesisTextClose(node, words);
                    RaisedLoweredDerivedText(node, words);
                    break;
                case "mrow":
                    if (IsFunc(node)) words.push("the function");
                    for (var k = 0; k < node.childNodes.length; k++) {
                        ParseNode(node.childNodes[k], words);
                    }
                    if (IsFunc(node)) words.push("function end");
                    break;
                case "msqrt":
                    DividendText(node, words);
                    words.push("the square root of");
                    for (var i = 0; i < node.childNodes.length; i++) ParseNode(node.childNodes[i], words);
                    words.push("square root end");
                    break;
                case "mroot":
                    DividendText(node, words);
                    if (node.lastChild != null && node.lastChild.localName == "mn") words.push(`the ${RootNumbers(node.lastChild.firstChild.nodeValue)} root of`); else words.push("the root of");
                    for (var n = 0; n < node.childNodes.length; n++) {
                        if (node.childNodes[n] != node.lastChild && node.lastChild.localName == "mn") {
                            ParseNode(node.childNodes[n], words);
                        }
                    }
                    words.push("root end");
                    break;
                case "mfrac":
                    RaisedLoweredDerivedText(node, words);
                    words.push("division with the dividend");
                    for (var j = 0; j < node.childNodes.length; j++) {
                        ParseNode(node.childNodes[j], words);
                    }
                    words.push("division end");
                    break;
                case "mo":
                    DividendText(node, words);
                    RaisedLoweredDerivedText(node, words);
                    switch (node.firstChild.nodeValue) {
                        case "lim":
                            words.push("limit");
                            break;
                        default:
                            switch (node.firstChild.nodeValue.charCodeAt()) {
                                case 42:
                                case 8290:
                                    words.push("times");
                                    break;
                                case 8901:
                                    words.push("multiplied by");
                                    break;
                                case 43:
                                    words.push("plus");
                                    break;
                                case 45:
                                    words.push("minus");
                                    break;
                                case 60:
                                    words.push("is less than");
                                    break;
                                case 61:
                                    words.push("is equal to");
                                    break;
                                case 62:
                                    words.push("is more than");
                                    break;
                                case 8804:
                                    words.push("is less than or equal to");
                                    break;
                                case 8805:
                                    words.push("is more than or equal to");
                                    break;
                                case 8242:
                                case 8243:
                                    break;
                                case 8517:
                                case 8518:
                                    words.push("differential with respect to");
                                    break;
                                case 8289:
                                    words.push("of");
                                    break;
                                case 8747:
                                    words.push("the integral of");
                                    break;
                                case 8748:
                                    words.push("the double integral of");
                                    break;
                                case 8749:
                                    words.push("the triple integral of");
                                    break;
                                case 8750:
                                    words.push("the contour integral of");
                                    break;
                                case 8594:
                                    if (node.parentNode != null && node.parentNode.localName == "mrow") words.push("approaches");
                                    // Vector is handled elsewhere
                                    break;
                                default:
                                    console.warn(` [ WARNING ] Missing text for MO: ${node.firstChild.nodeValue} (char code: ${node.firstChild.nodeValue.charCodeAt()})`);
                                    words.push(node.firstChild.nodeValue);
                                    break;
                            }
                            break;
                    }
                    break;
                case "mi":
                    DividendText(node, words);
                    RaisedLoweredDerivedText(node, words);
                    if (node.firstChild != null && node.firstChild.nodeValue == node.firstChild.nodeValue.toUpperCase() && (node.firstChild != null && node.firstChild.nodeValue.charCodeAt() != 8734)) words.push("capital"); // if capital, except infinity
                    switch (node.firstChild.nodeValue) {
                        case "sin":
                            words.push("sine");
                            break;
                        case "cos":
                            words.push("cosine");
                            break;
                        case "log":
                            words.push("the log");
                            break;
                        case "ln":
                            words.push("the natural log");
                            break;
                        default:
                            switch (node.firstChild.nodeValue.charCodeAt()) {
                                case 176:
                                    words.push((node.previousSibling.firstChild.nodeValue == 1) ? "degree" : "degrees");
                                    break;
                                case 593:
                                    words.push("alpha");
                                    break;
                                case 916:
                                    words.push("delta");
                                    break;
                                case 947:
                                    words.push("gamma");
                                    break;
                                case 960:
                                    words.push("pi");
                                    break;
                                case 966:
                                    words.push("phi");
                                    break;
                                case 968:
                                    words.push("psi");
                                    break;
                                case 976:
                                    words.push("beta");
                                    break;
                                case 977:
                                    words.push("theta");
                                    break;
                                case 8734:
                                    words.push("infinity");
                                    break;
                                default:
                                    console.warn(` [ WARNING ] Missing text for MI: ${node.firstChild.nodeValue} (char code: ${node.firstChild.nodeValue.charCodeAt()})`);
                                    words.push(node.firstChild.nodeValue.toLowerCase());
                                    break;
                            }
                            break;
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
                    console.warn(` [ WARNING ] Missing translation for: ${node.firstChild.nodeValue}`);
                    words.push(node.firstChild.nodeValue);
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
        var words = [], x2js = new X2JS(), root = {};

        try {
            var dom = x2js.xml2dom(content);

            // Build words array
            root = dom.childNodes[0];
            if (root.localName == "math") {
                words.push("formula");
                ParseNode(dom.childNodes[0], words);
                words.push("formula end");
            }
            // Return words in an array which can be prosessed by the translation service and API
            var lang = ExtractLanguage(root);
            return ((lang != "en") ? await module.exports.TranslateTexts(words, lang) : words);
        }
        catch (ex) {
            throw ex;
        }
    },
    TranslateTexts: async (texts, target) => {
        const translate = new Translate();

        const options = {
            to: target,
            source: "en",
            model: "nmt",
        };

        let [translations] = await translate.translate(texts, options);
        translations = Array.isArray(translations) ? translations : [translations];
        return translations;
    }
};