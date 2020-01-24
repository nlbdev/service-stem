#!/usr/bin/env node
/*jshint esversion: 8 */

const X2JS = require("x2js");
const { Translate } = require('@google-cloud/translate').v2;
const operators = require("./data/text-operators.json");
const identifiers = require("./data/text-identifiers.json");
const misc = require("./data/text-misc.json");

/**
 * Get the correct string and return it, return undefined if not found
 * @param s A string or number to find
 * @param source The JSON source
 */
function GetTranslatedText(s, source) {
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
        words.push(GetTranslatedText("divided by", misc));
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
                        words.push(GetTranslatedText(Attr.nodeValue.charCodeAt(), misc));
                    }
                    break;
                case 91:
                case 123:
                case 124:
                    words.push(GetTranslatedText(Attr.nodeValue.charCodeAt(), misc));
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
                        words.push(GetTranslatedText(Attr.nodeValue.charCodeAt(), misc));
                    }
                    break;
                case 93:
                case 125:
                    words.push(GetTranslatedText(Attr.nodeValue.charCodeAt(), misc));
                    break;
                case 124:
                    words.push(GetTranslatedText(Attr.nodeValue.charCodeAt(), misc));
                    words.push(GetTranslatedText("end", misc));
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
        if(node.parentNode.previousSibling != null && (
            node.parentNode.previousSibling.localName == "mi" || 
            node.parentNode.previousSibling.localName == "mn" || 
            node.parentNode.previousSibling.localName == "mrow" || 
            node.parentNode.previousSibling.localName == "mfenced")) {
            if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8242) {
                words.push(GetTranslatedText("derived", misc));
            }
            else if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8243) {
                words.push(GetTranslatedText("double derived", misc));
            }
            else {
                words.push(GetTranslatedText("to the power of", misc));
            }
        }
    }
    if(node.parentNode != null && node.parentNode.localName == "mrow" && node.parentNode.parentNode != null && node.parentNode.parentNode.localName == "msup" && node == node.parentNode.firstChild) {
        words.push(GetTranslatedText("to the power of", misc));
    }
    if ((node.parentNode != null && node.parentNode.localName == "msub") && (node.parentNode.previousSibling != null && (node.parentNode.previousSibling.localName == "mi" || node.parentNode.previousSibling.localName == "mn" || node.parentNode.previousSibling.localName == "mrow" || node.parentNode.previousSibling.localName == "mfenced"))) {
        words.push(GetTranslatedText("with the lower index", misc));
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
                    if (node.lastChild != null && node.lastChild.localName == "mo" && node.lastChild.firstChild.nodeValue.charCodeAt() == 8594) words.push(GetTranslatedText("vector", misc));
                    for (var o = 0; o < node.childNodes.length; o++) {
                        ParseNode(node.childNodes[o], words);
                    }
                    if (node.lastChild != null && node.lastChild.localName == "mo" && node.lastChild.firstChild.nodeValue.charCodeAt() == 8594) words.push(`${GetTranslatedText("vector", misc)} ${GetTranslatedText("end", misc)}`);
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

                        words.push(`${GetTranslatedText("the", misc)} ${GetTranslatedText(integralType, misc)}`);
                        words.push(GetTranslatedText("with the lower limit", misc));
                        if (node.childNodes[1] != null) {
                            ParseNode(node.childNodes[1], words);
                        }
                        words.push(GetTranslatedText("and with the upper limit", misc));
                        if (node.childNodes[2] != null) {
                            ParseNode(node.childNodes[2], words);
                        }
                        words.push(`${GetTranslatedText(integralType, misc)} ${GetTranslatedText("end", misc)}`);
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
                        words.push(GetTranslatedText("and", misc));
                    }
                    words.pop(); // remove extra 'and'
                    ParenthesisTextClose(node, words);
                    RaisedLoweredDerivedText(node, words);
                    break;
                case "mrow":
                    if(IsFunc(node)) words.push(`${GetTranslatedText("the", misc)} ${GetTranslatedText("function", misc)}`);
                    for (var k = 0; k < node.childNodes.length; k++) {
                        ParseNode(node.childNodes[k], words);
                    }
                    if(IsFunc(node)) words.push(`${GetTranslatedText("function", misc)} ${GetTranslatedText("end", misc)}`);
                    break;
                case "msqrt":
                    DividendText(node, words);
                    words.push(`${GetTranslatedText("the", misc)} ${GetTranslatedText("square root", misc)} ${GetTranslatedText("of", misc)}`);
                    for (var i = 0; i < node.childNodes.length; i++) ParseNode(node.childNodes[i], words);
                    words.push(`${GetTranslatedText("square root", misc)} ${GetTranslatedText("end", misc)}`);
                    break;
                case "mroot":
                    DividendText(node, words);
                    if (node.lastChild != null && node.lastChild.localName == "mn") words.push(`the ${RootNumbers(node.lastChild.firstChild.nodeValue)} root of`); else words.push("the root of");
                    for (var n = 0; n < node.childNodes.length; n++) {
                        if (node.childNodes[n] != node.lastChild && node.lastChild.localName == "mn") {
                            ParseNode(node.childNodes[n], words);
                        }
                    }
                    words.push(`${GetTranslatedText("root", misc)} ${GetTranslatedText("end", misc)}`);
                    break;
                case "mfrac":
                    RaisedLoweredDerivedText(node, words);
                    words.push(GetTranslatedText("division with the dividend", misc));
                    for (var j = 0; j < node.childNodes.length; j++) {
                        ParseNode(node.childNodes[j], words);
                    }
                    words.push(`${GetTranslatedText("division", misc)} ${GetTranslatedText("end", misc)}`);
                    break;
                case "mo":
                    DividendText(node, words);
                    RaisedLoweredDerivedText(node, words);
                    var mo_val = node.firstChild.nodeValue;
                    var mo_t = GetTranslatedText(mo_val, operators);
                    if(mo_t != undefined) {
                        words.push(mo_t);
                    }
                    else {
                        var mo_code = mo_val.charCodeAt();
                        var mo_c = GetTranslatedText(mo_code, operators);
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
                                        words.push(GetTranslatedText("larr", identifiers));
                                    }
                                    break;
                                case 8594:
                                    if (node.parentNode != null && node.parentNode.localName == "mrow") {
                                        words.push(mo_c);
                                    }
                                    else {
                                        words.push(GetTranslatedText("rarr", identifiers));
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
                    var mi_t = GetTranslatedText(mi_val, identifiers);
                    if(mi_t != undefined) {
                        words.push(mi_t);
                    }
                    else {
                        var mi_code = mi_val.charCodeAt();
                        var mi_c = GetTranslatedText(mi_code, identifiers);
                        if(mi_c != undefined) {
                            switch(mi_code) {
                                case 176:
                                    words.push(GetTranslatedText((node.previousSibling.firstChild.nodeValue == 1) ? "degree" : "degrees", identifiers));
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
            var lang = ExtractLanguage(root);
            return { success: true, language: lang, words: words };
        }
        catch (ex) {
            throw ex;
        }
    },
    TranslateTexts: async (texts, target) => {
        const projectId = "nlb-babel-dev";
        const translate = new Translate({projectId});

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