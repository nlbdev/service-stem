#!/usr/bin/env node
/*jshint esversion: 8 */

const operators = require("./data/text-operators.json");
const identifiers = require("./data/text-identifiers.json");
const misc = require("./data/text-misc.json");
const { Cipher } = require("crypto");
const DOMParser = require("xmldom").DOMParser;

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

function ExtractAttributes(node) {
    return [
        {name: "language", value: node.getAttribute("xml:lang") || null },
        {name: "ascii", value: node.getAttribute("alttext") || null },
        {name: "display", value: node.getAttribute("display") || null },
        {name: "image", value: node.getAttribute("altimg") || null }
    ];
}

function DividendText(node, words) {
    if (node.parentNode != null && (node.parentNode.localName == "mfrac" && node == node.parentNode.lastChild)) {
        AddWord(GetText("and denominator", misc), words);
    }
}

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

function ParenthesisTextClose(node, words) {
    var cont = true;
    if(node.nextSibling != null && node.nextSibling.localName == "mo") {
        if(node.nextSibling.firstChild.nodeValue.charCodeAt() == 8242 || node.nextSibling.firstChild.nodeValue.charCodeAt() == 8243) { // Derivative or Double derivative
            cont = false;
            AddWord(`${GetText("expression", misc)} ${GetText("end", misc)}`, words);
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
                AddWord(`${GetText(charCode, misc)} ${GetText("end", misc)}`, words);
                break;
            default:
                console.warn(` [ WARNING ] Missing text for PAREN: ${Attr} (char code: ${charCode})`);
                AddWord(GetText(41, misc), words);
                break;
        }
        charCode = 0;
    }
}

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
    if ((node.parentNode != null && node.parentNode.localName == "msub") && (node.parentNode.previousSibling != null && (node.parentNode.previousSibling.localName == "mi" || node.parentNode.previousSibling.localName == "mn" || node.parentNode.previousSibling.localName == "mrow" || node.parentNode.previousSibling.localName == "mfenced"))) {
        AddWord(GetText("with the lower index", misc), words);
    }
}

function StandardLoop(node, words, start) {
    for (var num = start; num < node.childNodes.length; num++) {
        if(node.childNodes[num]) ParseNode(node.childNodes[num], words);
    }
}

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
                    StandardLoop(node, words, 0);
                    break;
                case "mtable":
                    AddWord(`${GetText("matrix", misc)} ${GetText("start", misc)}, ${GetText("the matrix contains", misc)} ${node.childNodes.length} ${GetText("rows", misc)},`, words);
                    StandardLoop(node, words, 0);
                    AddWord(`${GetText("matrix", misc)} ${GetText("end", misc)}`, words);
                    break;
                case "mtr":
                case "mlabeledtr":
                    for(var tr = 0; tr < node.parentNode.childNodes.length; tr++) if(node == node.parentNode.childNodes[tr]) break;
                    AddWord(`${GetText("row", misc)} ${(tr+1)} ${GetText("contains", misc)} ${node.childNodes.length} ${GetText("cells", misc)}:`, words);
                    for (var y = 0; y < node.childNodes.length; y++) {
                        AddWord(`${GetText("cell", misc)} ${y+1} ${GetText("contains", misc)}`, words);
                        ParseNode(node.childNodes[y], words);
                        words[words.length-1] = `${words[words.length-1]},`;
                    }
                    AddWord(`${GetText("row", misc)} ${GetText("end", misc)}${(node != node.parentNode.lastChild ? ',' : '')}`, words);
                    break;
                case "mtd":
                    StandardLoop(node, words, 0);
                    break;
                case "msub":
                    DividendText(node, words);
                    if((node.parentNode != null && node.parentNode.localName === "mover")) {
                        if(node.nextSibling != null && node.nextSibling.localName === "mo" && (node.nextSibling.firstChild != null && node.nextSibling.firstChild.nodeValue.charCodeAt() == 8594)) {
                            if(node.childNodes.length >= 2) {
                                ParseNode(node.childNodes[0], words);
                                AddWord(`${GetText("with the lower index", misc)}`, words);
                                StandardLoop(node, words, 1);
                            }
                            else {
                                ParseNode(node.childNodes[0], words);
                            }
                        }
                    }
                    else if(node.childNodes.length >= 2) {
                        ParseNode(node.childNodes[0], words);
                        AddWord(`${GetText("with the lower index", misc)}`, words);
                        StandardLoop(node, words, 1);
                        AddWord(`${GetText("index", misc)} ${GetText("end", misc)}`, words);
                    }
                    else {
                        if(IsExp(node)) AddWord(`${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                        StandardLoop(node, words, 0);
                        if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)}`, words);
                    }
                    break;
                case "msup":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if(IsExp(node)) AddWord(`${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                    StandardLoop(node, words, 0);
                    if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)}`, words);
                    break;
                case "mover":
                    var isBound = false;
                    if (IsVector(node, words)) {
                        AddWord(GetText("vector", misc), words);
                        if(node.childNodes[0] != null && node.childNodes[0].localName == "mi") {
                            AddWord(node.childNodes[0].firstChild.nodeValue, words);
                        }
                        else {
                            StandardLoop(node, words, 0);
                        }
                        AddWord(`${GetText("vector", misc)} ${GetText("end", misc)}`, words);
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
                                ParseNode(node.childNodes[0], words);
                            } else {
                                if(HasAccent1) AddWord(`${GetText("curly bracket", misc)} ${GetText("over", misc)} ${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                                ParseNode(node.childNodes[0], words);
                                AddWord(`${GetText("with the upper index", misc)}`, words);
                                StandardLoop(node, words, 1);
                                if(HasAccent1) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)}`, words);
                            }
                        }
                        else {
                            StandardLoop(node, words, 0);
                        }
                    }
                    break;
                case "munder":
                    if(node.childNodes.length == 2) { // Length should always be 2 if set delimiter
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
                            ParseNode(node.childNodes[0], words);
                        } else {
                            if(HasAccent2) AddWord(`${GetText("curly bracket", misc)} ${GetText("under", misc)} ${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                            ParseNode(node.childNodes[0], words);
                            AddWord(`${GetText("with the lower index", misc)}`, words);
                            StandardLoop(node, words, 1);
                            if(HasAccent2) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)}`, words);
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
                            ParseNode(node.childNodes[1], words);
                        }
                        AddWord(GetText("and with the upper limit", misc), words);
                        if (node.childNodes[2] != null) {
                            ParseNode(node.childNodes[2], words);
                        }
                        AddWord(`${GetText(integralType, misc)} ${GetText("end", misc)}`, words);
                    } else {
                        StandardLoop(node, words, 0);
                    }
                    break;
                case "mfenced":
                    DividendText(node, words);
                    ParenthesisTextOpen(node, words);
                    for (var l = 0; l < node.childNodes.length; l++) {
                        ParseNode(node.childNodes[l], words);
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
                    StandardLoop(node, words, 0);
                    if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)}`, words);
                    if(IsFunc(node)) AddWord(`${GetText("function", misc)} ${GetText("end", misc)}`, words);
                    break;
                case "msqrt":
                    DividendText(node, words);
                    AddWord(`${GetText("the", misc)} ${GetText("square root", misc)} ${GetText("of", misc)}`, words);
                    for (var i = 0; i < node.childNodes.length; i++) ParseNode(node.childNodes[i], words);
                    AddWord(`${GetText("square root", misc)} ${GetText("end", misc)}`, words);
                    break;
                case "mroot":
                    DividendText(node, words);
                    if (node.lastChild != null && node.lastChild.localName == "mn") AddWord(`the ${RootNumbers(node.lastChild.firstChild.nodeValue)} root of`); else AddWord("the root of", words);
                    for (var n = 0; n < node.childNodes.length; n++) {
                        if (node.childNodes[n] != node.lastChild && node.lastChild.localName == "mn") {
                            ParseNode(node.childNodes[n], words);
                        }
                    }
                    AddWord(`${GetText("root", misc)} ${GetText("end", misc)}`, words);
                    break;
                case "mfrac":
                    RaisedLoweredText(node, words);
                    if(IsExp(node)) AddWord(`${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                    AddWord(GetText("fraction with counter", misc), words);
                    StandardLoop(node, words, 0);
                    AddWord(`${GetText("fraction", misc)} ${GetText("end", misc)}`, words);
                    if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)}`, words);
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

function Detect(root, words) {
    var word = "";
    switch(root.getAttribute("class")) {
        case "chemistry":
            word = "chemical formula";
            break;
        case "physics":
            word = "physics formula";
            break;
        default:
            break;
    }
    if(word == "" && root.localName == "math") word = "formula";
    AddWord(word, words);
}

module.exports = {
    GenerateMath: async (content) => {
        var words = [];

        try {
            var dom = new DOMParser().parseFromString(content);

            // Build words array
            var root = dom.documentElement;
            Detect(root, words);
            ParseNode(root, words);
            AddWord("formula end", words);
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