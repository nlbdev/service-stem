/*jshint esversion: 8 */
import operators from "../data/text-operators.json";
import identifiers from "../data/text-identifiers.json";
import misc from "../data/text-misc.json";

function DividendText(node: CheerioElement, words: string[]) {
    if (node.parentNode !== null && (node.parentNode.tagName === "mfrac" && node === node.parentNode.lastChild)) {
        words.push(GetText("and denominator", misc) || "");
    }
}

function ParenthesisTextOpen(node: CheerioElement, words: string[]) {
    let cont = true;
    if (node.nextSibling !== null && node.nextSibling.tagName === "mo") {
        if (node.nextSibling.firstChild.nodeValue.charCodeAt(0) === 8242) {// Derivative
            cont = false;
            words.push(GetText("the derivative of the expression", misc) || "");
        }
        else if (node.nextSibling.firstChild.nodeValue.charCodeAt(0) === 8243) { // Double derivative
            cont = false;
            words.push(GetText("the double derivative of the expression", misc) || "");
        }
    }

    if (cont) {
        const entries = Object.entries(node.attribs);
        for(const [key, value] of entries) {
            if (key === "open") {
                switch (value.charCodeAt(0)) {
                    case 40:
                        if (node.previousSibling !== null && node.previousSibling.tagName === "mo" && node.previousSibling.firstChild.nodeValue.charCodeAt(0) === 8289) {
                            // Its a function and does not require parenthesis
                        } else if (node.firstChild !== null && node.firstChild.tagName === "mtable") {
                            // Its a matrix and does not require parenthesis
                        } else {
                            words.push(GetText(value.charCodeAt(0).toString(), misc) || "");
                        }
                        break;
                    case 91:
                    case 123:
                    case 124:
                        words.push(GetText(value.charCodeAt(0).toString(), misc) || "");
                        break;
                    default:
                        console.warn(` [ WARNING ] Missing text for PAREN: ${value} (char code: ${value.charCodeAt(0)})`);
                        words.push(value);
                        break;
                }
            }
        }
    }
}

function ParenthesisTextClose(node: CheerioElement, words: string[]) {
    let cont = true;
    if (node.nextSibling !== null && node.nextSibling.tagName === "mo") {
        if (node.nextSibling.firstChild.nodeValue.charCodeAt(0) === 8242 || node.nextSibling.firstChild.nodeValue.charCodeAt(0) === 8243) { // Derivative or Double derivative
            cont = false;
            words.push(`${GetText("expression", misc)} ${GetText("end", misc)}`);
        }
    }

    if (cont) {
        const entries = Object.entries(node.attribs);
        for(const [key, value] of entries) {
            if (key === "close") {
                switch (value.charCodeAt(0)) {
                    case 41:
                        if (node.previousSibling !== null && node.previousSibling.tagName === "mo" && node.previousSibling.firstChild.nodeValue.charCodeAt(0) === 8289) {
                            // Its a function and does not require parenthesis
                        } else if (node.firstChild !== null && node.firstChild.tagName === "mtable") {
                            // Its a matrix and does not require parenthesis
                        } else {
                            words.push(GetText(value.charCodeAt(0).toString(), misc) || "");
                        }
                        break;
                    case 93:
                    case 125:
                        words.push(GetText(value.charCodeAt(0).toString(), misc) || "");
                        break;
                    case 124:
                        words.push(`${GetText(value.charCodeAt(0).toString(), misc)} ${GetText("end", misc)}`);
                        break;
                    default:
                        console.warn(` [ WARNING ] Missing text for PAREN: ${value} (char code: ${value.charCodeAt(0)})`);
                        words.push(value);
                        break;
                }
            }
        }
    }
}

function RaisedLoweredText(node: CheerioElement, words: string[]) {
    if (node.parentNode !== null && node.parentNode.tagName === "msup") {
        if (node.previousSibling !== null && (node.previousSibling.tagName === "mi" || node.previousSibling.tagName === "mn" || node.previousSibling.tagName === "mrow" || node.previousSibling.tagName === "mfenced")) {
            if (node.firstChild.nodeValue !== null && node.firstChild.nodeValue.charCodeAt(0) === 8242) {
                // Derivative is handled elsewhere
                words.push(GetText("derivative", misc) || "");
            }
            else if (node.firstChild.nodeValue !== null && node.firstChild.nodeValue.charCodeAt(0) === 8243) {
                // Double derivative is handled elsewhere
                words.push(GetText("double derivative", misc) || "");
            }
            else {
                words.push(GetText("to the power of", misc) || "");
            }
        }
    }
    if (node.parentNode !== null
        && node.parentNode.tagName === "mrow"
        && node.parentNode.parentNode !== null
        && node.parentNode.parentNode.tagName === "msup"
        && node === node.parentNode.firstChild)
    {
        words.push(GetText("to the power of", misc) || "");
    }
    if ((node.parentNode !== null && node.parentNode.tagName === "msub")
        && (node.parentNode.previousSibling !== null
        && (node.parentNode.previousSibling.tagName === "mi" || node.parentNode.previousSibling.tagName === "mn" ||
        node.parentNode.previousSibling.tagName === "mrow" || node.parentNode.previousSibling.tagName === "mfenced")))
    {
        words.push(GetText("with the lower index", misc) || "");
    }
}

function StandardLoop(node: CheerioElement, words: string[], start: number) {
    for (let num = start; num < node.childNodes.length; num++) {
        ParseNode(node.childNodes[num], words);
    }
}

function IsVector(node: CheerioElement, words: string[]) {
    if (node.lastChild !== null && node.lastChild.tagName === "mo" && node.lastChild.firstChild.nodeValue.charCodeAt(0) === 8594) {
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
function RootNumbers(i: number) {
    const roots = require("./data/text-roots.json");

    return roots.find((root: { id: string, value: string }) => root.id === i.toString()).value;
}

function IsFunc(node: CheerioElement) {
    if (node.tagName === "mrow") {
        return (node.lastChild !== null && node.lastChild.tagName === "mfenced" && node.lastChild.previousSibling !== null && node.lastChild.previousSibling.tagName === "mo" && node.lastChild.previousSibling.firstChild.nodeValue.charCodeAt(0) === 8289);
    }
    else {
        return false;
    }
}

function IsExp(node: CheerioElement) {
    if (["mrow", "msup", "msub", "mfrac"].includes(node.tagName)) {
        const idents = ["sin", "log", "ln", "tan", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "coth", "sech", "cosech", "csch", "arsinh", "arcosh", "artanh",
            "arcoth", "cot", "sec", "cosec", "csc", "arccot", "arcsec", "arccosec", "arccsc"];
        return ((node.previousSibling !== null && node.previousSibling.tagName === "mo" && node.previousSibling.firstChild.nodeValue.charCodeAt(0) === 8289) &&
            (node.previousSibling.previousSibling !== null && node.previousSibling.previousSibling.tagName === "mi" &&
                idents.includes(node.previousSibling.previousSibling.firstChild.nodeValue)));
    }
    else {
        return false;
    }
}

const ones: string[] = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const tens: string[] = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const teens: string[] = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

function ConvertMillions(num: number): string {
    if (num >= 1000000) {
        return ConvertMillions(Math.floor(num / 1000000)) + " million " + ConvertThousands(num % 1000000);
    } else {
        return ConvertThousands(num);
    }
}

function ConvertThousands(num: number): string {
    if (num >= 1000) {
        return ConvertHundreds(Math.floor(num / 1000)) + " thousand " + ConvertHundreds(num % 1000);
    } else {
        return ConvertHundreds(num);
    }
}

function ConvertHundreds(num: number): string {
    if (num > 99) {
        return ones[Math.floor(num / 100)] + " hundred " + ConvertTens(num % 100);
    } else {
        return ConvertTens(num);
    }
}

function ConvertTens(num: number): string {
    if (num < 10) return ones[num];
    else if (num >= 10 && num < 20) return teens[num - 10];
    else {
        return tens[Math.floor(num / 10)] + " " + ones[num % 10];
    }
}

function Convert(num: number): string {
    if (num === 0) return "zero";
    else return ConvertMillions(num);
}

function ParseNode(node: CheerioElement, words: string[]) {
    try {
        if (node !== null) {
            switch (node.tagName) {
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
                    StandardLoop(node, words, 0);
                    break;
                case "mtable":
                    words.push(`${GetText("matrix", misc)} ${GetText("start", misc)}, ${GetText("the matrix contains", misc)} ${node.childNodes.length} ${GetText("rows", misc)},`);
                    StandardLoop(node, words, 0);
                    words.push(`${GetText("matrix", misc)} ${GetText("end", misc)}`);
                    break;
                case "mtr":
                case "mlabeledtr":
                    for (let tr = 0; tr < node.parentNode.childNodes.length; tr++) {
                        if (node === node.parentNode.childNodes[tr]) break;
                        words.push(`${GetText("row", misc)} ${(tr + 1)} ${GetText("contains", misc)} ${node.childNodes.length} ${GetText("cells", misc)}:`);
                    }
                    for (let y = 0; y < node.childNodes.length; y++) {
                        words.push(`${GetText("cell", misc)} ${y + 1} ${GetText("contains", misc)}`);
                        ParseNode(node.childNodes[y], words);
                        words[words.length - 1] = `${words[words.length - 1]},`;
                    }
                    words.push(`${GetText("row", misc)} ${GetText("end", misc)}${(node !== node.parentNode.lastChild ? ',' : '')}`);
                    break;
                case "mtd":
                    StandardLoop(node, words, 0);
                    break;
                case "msub":
                    DividendText(node, words);
                    if ((node.parentNode !== null && node.parentNode.tagName === "mover")) {
                        if (node.nextSibling !== null && node.nextSibling.tagName === "mo" && (node.nextSibling.firstChild !== null && node.nextSibling.firstChild.nodeValue.charCodeAt(0) === 8594)) {
                            if (node.childNodes.length >= 2) {
                                ParseNode(node.childNodes[0], words);
                                words.push(`${GetText("with the lower index", misc)}`);
                                StandardLoop(node, words, 1);
                            }
                            else {
                                ParseNode(node.childNodes[0], words);
                            }
                        }
                    }
                    else if (node.childNodes.length >= 2) {
                        ParseNode(node.childNodes[0], words);
                        words.push(`${GetText("with the lower index", misc)}`);
                        StandardLoop(node, words, 1);
                    }
                    else {
                        if (IsExp(node)) words.push(`${GetText("the", misc)} ${GetText("expression", misc)}`);
                        StandardLoop(node, words, 0);
                        if (IsExp(node)) words.push(`${GetText("expression", misc)} ${GetText("end", misc)}`);
                    }
                    break;
                case "msup":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if (IsExp(node)) words.push(`${GetText("the", misc)} ${GetText("expression", misc)}`);
                    StandardLoop(node, words, 0);
                    if (IsExp(node)) words.push(`${GetText("expression", misc)} ${GetText("end", misc)}`);
                    break;
                case "mover":
                    const isBound = false;
                    if (IsVector(node, words)) {
                        words.push(GetText("vector", misc) || "");
                        if (node.childNodes[0] !== null && node.childNodes[0].tagName === "mi") {
                            words.push(node.childNodes[0].firstChild.nodeValue);
                        }
                        else {
                            StandardLoop(node, words, 0);
                        }
                        words.push(`${GetText("vector", misc)} ${GetText("end", misc)}`);
                    }
                    else {
                        if (node.childNodes.length === 2) { // Length should always be 2 if set delimiter
                            if (node.attribs.accent && node.attribs.accent === "true") words.push(`${GetText("bracket", misc)} ${GetText("start", misc)}`);
                            ParseNode(node.childNodes[0], words);
                            words.push(`${GetText("with the upper index", misc)}`);
                            StandardLoop(node, words, 1);
                            if (node.attribs.accent && node.attribs.accent === "true") words.push(`${GetText("bracket", misc)} ${GetText("end", misc)}`);
                        }
                        else {
                            StandardLoop(node, words, 0);
                        }
                    }
                    break;
                case "munder":
                    if (node.childNodes.length === 2) { // Length should always be 2 if set delimiter
                        if (node.attribs.accent && node.attribs.accent === "true") words.push(`${GetText("bracket", misc)} ${GetText("start", misc)}`);
                        ParseNode(node.childNodes[0], words);
                        words.push(`${GetText("with the lower index", misc)}`);
                        StandardLoop(node, words, 1);
                        if (node.attribs.accent && node.attribs.accent === "true") words.push(`${GetText("bracket", misc)} ${GetText("end", misc)}`);
                    }
                    else {
                        StandardLoop(node, words, 0);
                    }
                    break;
                case "munderover":
                case "msubsup":
                    if (node.childNodes.length === 3
                        && node.firstChild.tagName === "mo"
                        && (node.firstChild.firstChild.nodeValue.charCodeAt(0) === 8747
                        || node.firstChild.firstChild.nodeValue.charCodeAt(0) === 8748
                        || node.firstChild.firstChild.nodeValue.charCodeAt(0) === 8749
                        || node.firstChild.firstChild.nodeValue.charCodeAt(0) === 8750))
                    {
                        let integralType = "integral";
                        if (node.firstChild.firstChild.nodeValue.charCodeAt(0) === 8748) integralType = "double integral";
                        else if (node.firstChild.firstChild.nodeValue.charCodeAt(0) === 8749) integralType = "triple integral";
                        else if (node.firstChild.firstChild.nodeValue.charCodeAt(0) === 8750) integralType = "contour integral";

                        words.push(`${GetText("the", misc)} ${GetText(integralType, misc)}`);
                        words.push(GetText("with the lower limit", misc) || "");
                        if (node.childNodes[1] !== null) {
                            ParseNode(node.childNodes[1], words);
                        }
                        words.push(GetText("and with the upper limit", misc) || "");
                        if (node.childNodes[2] !== null) {
                            ParseNode(node.childNodes[2], words);
                        }
                        words.push(`${GetText(integralType, misc)} ${GetText("end", misc)}`);
                    } else {
                        StandardLoop(node, words, 0);
                    }
                    break;
                case "mfenced":
                    DividendText(node, words);
                    ParenthesisTextOpen(node, words);
                    for(const childNode of node.childNodes) {
                        ParseNode(childNode, words);
                        words.push(GetText("and", misc) || "");
                    }
                    words.pop(); // remove extra 'and'
                    ParenthesisTextClose(node, words);
                    RaisedLoweredText(node, words);
                    break;
                case "mrow":
                    if (IsFunc(node)) words.push(`${GetText("the", misc)} ${GetText("function", misc)}`);
                    if (IsExp(node)) words.push(`${GetText("the", misc)} ${GetText("expression", misc)}`);
                    StandardLoop(node, words, 0);
                    if (IsExp(node)) words.push(`${GetText("expression", misc)} ${GetText("end", misc)}`);
                    if (IsFunc(node)) words.push(`${GetText("function", misc)} ${GetText("end", misc)}`);
                    break;
                case "msqrt":
                    DividendText(node, words);
                    words.push(`${GetText("the", misc)} ${GetText("square root", misc)} ${GetText("of", misc)}`);
                    for(const childNode of node.childNodes) ParseNode(childNode, words);
                    words.push(`${GetText("square root", misc)} ${GetText("end", misc)}`);
                    break;
                case "mroot":
                    DividendText(node, words);
                    if (node.lastChild !== null && node.lastChild.tagName === "mn") words.push(`the ${RootNumbers(parseFloat(node.lastChild.firstChild.nodeValue))} root of`); else words.push("the root of");
                    for(const childNode of node.childNodes) {
                        if(childNode !== node.lastChild && node.lastChild.tagName === "mn") {
                            ParseNode(childNode, words);
                        }
                    }
                    words.push(`${GetText("root", misc)} ${GetText("end", misc)}`);
                    break;
                case "mfrac":
                    RaisedLoweredText(node, words);
                    if (IsExp(node)) words.push(`${GetText("the", misc)} ${GetText("expression", misc)}`);
                    words.push(GetText("fraction with counter", misc) || "");
                    StandardLoop(node, words, 0);
                    words.push(`${GetText("fraction", misc)} ${GetText("end", misc)}`);
                    if (IsExp(node)) words.push(`${GetText("expression", misc)} ${GetText("end", misc)}`);
                    break;
                case "mo":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    const OperatorValue = node.firstChild.nodeValue;
                    const OperatorText = GetText(OperatorValue, operators);
                    const OperatorCode = OperatorValue.charCodeAt(0);
                    if (OperatorText !== undefined) {
                        switch (OperatorCode) {
                            case 8242:
                            case 8243:
                                break;
                            case 8592:
                                if (node.parentNode !== null && node.parentNode.tagName === "mrow") {
                                    words.push(OperatorText);
                                }
                                else {
                                    words.push(GetText("larr", identifiers) || "");
                                }
                                break;
                            case 8594:
                                if (node.parentNode !== null) {
                                    if (node.parentNode.tagName === "mrow") {
                                        words.push(OperatorText);
                                    }
                                    else if (node.parentNode.tagName === "mover") {
                                        // It's a vector, do nothing
                                    }
                                }
                                else {
                                    words.push(GetText("rarr", identifiers) || "");
                                }
                                break;
                            default:
                                words.push(OperatorText);
                                break;
                        }
                    }
                    else {
                        const OperatorCodeText = GetText(OperatorCode.toString(), operators);
                        if (OperatorCodeText !== undefined) {
                            switch (OperatorCode) {
                                case 8242:
                                case 8243:
                                    break;
                                case 8592:
                                    if (node.parentNode !== null && node.parentNode.tagName === "mrow") {
                                        words.push(OperatorCodeText);
                                    }
                                    else {
                                        words.push(GetText("larr", identifiers) || "");
                                    }
                                    break;
                                case 8594:
                                    if (node.parentNode !== null) {
                                        if (node.parentNode.tagName === "mrow") {
                                            words.push(OperatorCodeText);
                                        }
                                        else if (node.parentNode.tagName === "mover") {
                                            // It's a vector, do nothing
                                        }
                                    }
                                    else {
                                        words.push(GetText("rarr", identifiers) || "");
                                    }
                                    break;
                                default:
                                    words.push(OperatorCodeText);
                                    break;
                            }
                        }
                        else {
                            if (OperatorCode > 127) console.warn(` [ WARNING ] Missing text-operator: ${OperatorValue} (char code: ${OperatorCode})`);
                            words.push(OperatorValue);
                        }
                    }
                    break;
                case "mi":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if (node.firstChild !== null && node.firstChild.nodeValue === node.firstChild.nodeValue.toUpperCase() && (node.firstChild !== null && node.firstChild.nodeValue.charCodeAt(0) !== 8734)) { // if capital, except infinity
                        words.push("capital");
                        node.firstChild.nodeValue = node.firstChild.nodeValue.toLowerCase();
                    }

                    const IdentifierValue = node.firstChild.nodeValue;
                    const IdentifierText = GetText(IdentifierValue, identifiers);
                    const IdentifierCode = IdentifierValue.charCodeAt(0);
                    if (IdentifierText !== undefined) {
                        switch (IdentifierCode) {
                            case 176:
                                words.push(GetText((node.previousSibling.firstChild.nodeValue === "1") ? "degree" : "degrees", identifiers) || "");
                                break;
                            default:
                                words.push(IdentifierText);
                                break;
                        }
                    }
                    else {
                        const IdentifierCodeText = GetText(IdentifierCode.toString(), identifiers);
                        if (IdentifierCodeText !== undefined) {
                            switch (IdentifierCode) {
                                case 176:
                                    words.push(GetText((node.previousSibling.firstChild.nodeValue === "1") ? "degree" : "degrees", identifiers) || "");
                                    break;
                                default:
                                    words.push(IdentifierCodeText);
                                    break;
                            }
                        }
                        else {
                            if (IdentifierCode > 127) console.warn(` [ WARNING ] Missing text-identifier: ${IdentifierValue} (char code: ${IdentifierCode})`);
                            words.push(IdentifierValue);
                        }
                    }
                    break;
                case "mtext":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    words.push(node.firstChild.nodeValue);
                    break;
                case "mn":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    words.push(node.firstChild.nodeValue);
                    break;
                case "mspace":
                    break;
                default:
                    if (node.firstChild !== null) {
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

/**
 * Get the correct string and return it, return undefined if not found
 * @param s A string or number to find
 * @param source The JSON source
 */
function GetText(s: string, source: { strings: TextStrings[]; chars: TextChars[]; unicode: TextUnicodes[]; }): string | undefined {
    let found;
    if (typeof (s) === "string") {
        if (/[^\u0000-\u00ff]/.test(s)) {
            found = source.unicode.find(m => m.code === s);
        }
        else {
            found = source.strings.find(m => m.name === s);
        }
        return (found !== undefined) ? found.value : undefined;
    }
    else if (typeof (s) === "number") {
        found = source.chars.find(m => m.code === s);
        return (found !== undefined) ? found.value : undefined;
    }
    else {
        return undefined;
    }
}

function ExtractAttributes(node: CheerioElement): { name: string, value: string }[] {
    const arr:{ name: string, value: string }[] = [];
    const entries = Object.entries(node.attribs);
    for(const [key, value] of entries) {
        if (key === "xml:lang") arr.push({ name: "language", value });
        else if (key === "alttext") arr.push({ name: "ascii", value });
        else if (key === "display") arr.push({ name: "display", value });
        else if (key === "altimg") arr.push({ name: "image", value });
    }

    return arr;
}

function Detect(root: CheerioElement, words: string[]) {
    let word:string = "";
    const entries = Object.entries(root.attribs);
    for(const [key, value] of entries) {
        if(key === "class") {
            switch(value) {
                case "chemistry":
                    word = "chemical formula";
                    break;
                case "physics":
                    word = "physics formula";
                    break;
                default:
                    break;
            }
        }
    }
    words.push(word || "formula");
}

export class TextClass {
    GenerateMath = async (content: string): Promise<{success: boolean;language: string;words: string[];ascii: string;display: string;imagepath: string;}> => {
        const cheerio = require('cheerio');
        // tslint:disable-next-line: prefer-const
        let words: string[] = [];

        try {
            const $ = cheerio.load(content, {
                xmlMode: true
            });

            // Build words array
            const root = $("*")[0];
            Detect(root, words);
            ParseNode(root, words);
            words.push("formula end");
            // Return words in an array which can be prosessed by the translation service and API

            // Do stuff
            const attributes = ExtractAttributes(root);
            const lang = attributes.find(m => m.name === "language") || {name: "language", value: "no"};
            const asciiMath = attributes.find(m => m.name === "ascii") || {name: "ascii", value: ""};
            const display = attributes.find(m => m.name === "display") || {name: "display", value: "block"};
            const image = attributes.find(m => m.name === "image") || {name: "image", value: ""};

            return { success: true, language: lang.value, words, ascii: asciiMath.value, display: display.value, imagepath: image.value };
        }
        catch (ex) {
            throw ex;
        }
    }
}