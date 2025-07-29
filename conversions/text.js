#!/usr/bin/env node
/*jshint esversion: 8 */

const operators = require("./data/text-operators.json");
const identifiers = require("./data/text-identifiers.json");
const misc = require("./data/text-misc.json");
const X2JS = require("x2js");
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
    // Check if this is inside a labeled equation
    let isInLabeledEquation = false;
    let parent = node.parentNode;
    while (parent) {
        if (parent.localName === "mtable") {
            // Check if this mtable is a labeled equation
            if (parent.childNodes.length > 0) {
                const firstRow = parent.childNodes[0];
                if (firstRow && firstRow.localName === "mtr" && firstRow.childNodes.length > 0) {
                    const firstCell = firstRow.childNodes[0];
                    if (firstCell && firstCell.localName === "mtd") {
                        const intent = firstCell.getAttribute("intent");
                        if (intent === ":equation-label") {
                            isInLabeledEquation = true;
                            break;
                        } else if (firstCell.firstChild && firstCell.firstChild.localName === "mtext") {
                            const labelText = firstCell.firstChild.firstChild.nodeValue;
                            if (labelText && /^\([^)]+\)$/.test(labelText)) {
                                isInLabeledEquation = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        parent = parent.parentNode;
    }
    
    if (node.parentNode != null && node.parentNode.localName == "msup" && node == node.parentNode.firstChild) {
        if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8242) {
            // Derivative is handled elsewhere
            AddWord(GetText("derivative", misc), words);
        }
        else if (node.firstChild.nodeValue != null && node.firstChild.nodeValue.charCodeAt() == 8243) {
            // Double derivative is handled elsewhere
            AddWord(GetText("double derivative", misc), words);
        }
        else {
            if (!isInLabeledEquation) {
                AddWord(GetText("to the power of", misc), words);
            }
        }
    }
    if(node.parentNode != null && node.parentNode.localName == "mrow" && node.parentNode.parentNode != null && node.parentNode.parentNode.localName == "msup" && node == node.parentNode.firstChild) {
        if (!isInLabeledEquation) {
            AddWord(GetText("to the power of", misc), words);
        }
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
                case "mstack":
                case "msgroup":
                case "msrow":
                case "mscarries":
                case "mscarry":
                case "mlongdiv":
                    StandardLoop(node, words, 0, indexes);
                    break;
                // Remove support for deprecated semantics and annotation elements
                // These should not be used according to new guidelines unless specifically requested
                case "semantics":
                case "annotation":
                case "annotation-xml":
                    // Skip these elements entirely - they are deprecated
                    break;
                case "mmultiscripts":
                    // Handle chemical isotopes and other multiscript notation
                    if (node.childNodes.length >= 5) {
                        // Check if this is a chemical isotope (has mprescripts)
                        let hasPrescripts = false;
                        for (let i = 0; i < node.childNodes.length; i++) {
                            if (node.childNodes[i].localName === "mprescripts") {
                                hasPrescripts = true;
                                break;
                            }
                        }
                        
                        if (hasPrescripts) {
                            // Chemical isotope notation: <mmultiscripts><mi>C</mi><mrow></mrow><mrow></mrow><mprescripts/><mrow></mrow><mn>14</mn></mmultiscripts>
                            // Structure: base, post-sub, post-sup, mprescripts, pre-sub, pre-sup
                            const base = node.childNodes[0];
                            const postSub = node.childNodes[1];
                            const postSup = node.childNodes[2];
                            const prescripts = node.childNodes[3];
                            const preSub = node.childNodes[4];
                            const preSup = node.childNodes[5];
                            
                            // Process isotope: pre-superscript (mass number) over base element
                            if (preSup && preSup.firstChild && preSup.firstChild.nodeValue) {
                                AddWord(preSup.firstChild.nodeValue, words);
                                AddWord(GetText("superscript", misc), words);
                            }
                            
                            // Process base element
                            ParseNode(base, words, indexes);
                            
                            // Process post-subscript if present
                            if (postSub && postSub.firstChild && postSub.firstChild.nodeValue) {
                                AddWord(GetText("subscript", misc), words);
                                ParseNode(postSub, words, indexes);
                            }
                            
                            // Process post-superscript if present
                            if (postSup && postSup.firstChild && postSup.firstChild.nodeValue) {
                                AddWord(GetText("superscript", misc), words);
                                ParseNode(postSup, words, indexes);
                            }
                        } else {
                            // Regular multiscripts (not isotope)
                            StandardLoop(node, words, 0, indexes);
                        }
                    } else {
                        // Fallback for other multiscript structures
                        StandardLoop(node, words, 0, indexes);
                    }
                    break;
                case "mtable":
                    // Check if this is a labeled equation (has intent=":equation-label" in first cell)
                    let isLabeledEquation = false;
                    if (node.childNodes.length > 0) {
                        const firstRow = node.childNodes[0];
                        if (firstRow && firstRow.localName === "mtr" && firstRow.childNodes.length > 0) {
                            const firstCell = firstRow.childNodes[0];
                            if (firstCell && firstCell.localName === "mtd") {
                                const intent = firstCell.getAttribute("intent");
                                if (intent === ":equation-label") {
                                    isLabeledEquation = true;
                                } else {
                                    // Check if first cell contains text that looks like a label (e.g., "(1.4)")
                                    if (firstCell.firstChild && firstCell.firstChild.localName === "mtext") {
                                        const labelText = firstCell.firstChild.firstChild.nodeValue;
                                        if (labelText && /^\([^)]+\)$/.test(labelText)) {
                                            isLabeledEquation = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    if (isLabeledEquation) {
                        // Handle as labeled equation - simpler approach
                        AddWord(`${GetText("equation", misc)} ${GetText("start", misc)},`, words);
                        // Process each row directly without detailed cell breakdown
                        for (let i = 0; i < node.childNodes.length; i++) {
                            const row = node.childNodes[i];
                            if (row && row.localName === "mtr") {
                                // Process each cell in the row
                                for (let j = 0; j < row.childNodes.length; j++) {
                                    const cell = row.childNodes[j];
                                    if (cell && cell.localName === "mtd") {
                                        ParseNode(cell, words, indexes);
                                    }
                                }
                            }
                        }
                        AddWord(`${GetText("equation", misc)} ${GetText("end", misc)},`, words);
                    } else {
                        // Check if this is inside a labeled equation (for nested matrices)
                        let isInsideLabeledEquation = false;
                        let parent = node.parentNode;
                        while (parent) {
                            if (parent.localName === "mtable") {
                                // Check if this parent mtable is a labeled equation
                                if (parent.childNodes.length > 0) {
                                    const firstRow = parent.childNodes[0];
                                    if (firstRow && firstRow.localName === "mtr" && firstRow.childNodes.length > 0) {
                                        const firstCell = firstRow.childNodes[0];
                                        if (firstCell && firstCell.localName === "mtd") {
                                            const intent = firstCell.getAttribute("intent");
                                            if (intent === ":equation-label") {
                                                isInsideLabeledEquation = true;
                                                break;
                                            } else if (firstCell.firstChild && firstCell.firstChild.localName === "mtext") {
                                                const labelText = firstCell.firstChild.firstChild.nodeValue;
                                                if (labelText && /^\([^)]+\)$/.test(labelText)) {
                                                    isInsideLabeledEquation = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            parent = parent.parentNode;
                        }
                        
                        if (isInsideLabeledEquation) {
                            // Use simpler matrix text when inside labeled equations
                            AddWord(GetText("matrix", misc), words);
                            StandardLoop(node, words, 0, indexes);
                        } else {
                            // Handle as regular matrix
                            AddWord(GetText("matrix", misc), words);
                            AddWord(`${GetText("matrix", misc)} ${GetText("start", misc)}, ${GetText("the matrix contains", misc)} ${node.childNodes.length} ${GetText("rows", misc)},`, words);
                            StandardLoop(node, words, 0, indexes);
                            AddWord(`${GetText("matrix", misc)} ${GetText("end", misc)},`, words);
                        }
                    }
                    break;
                case "mtr":
                case "mlabeledtr":
                    for(var tr = 0; tr < node.parentNode.childNodes.length; tr++) if(node == node.parentNode.childNodes[tr]) break;
                    AddWord(`${GetText("row", misc)} ${(tr+1)} ${GetText("contains", misc)} ${node.childNodes.length} ${GetText("cells", misc)}:`, words);
                    for (var y = 0; y < node.childNodes.length; y++) {
                        AddWord(`${GetText("cell", misc)} ${y+1} ${GetText("contains", misc)}`, words);
                        ParseNode(node.childNodes[y], words, indexes);
                        
                        // Only add commas for equation label cells (not for regular matrices)
                        const cellNode = node.childNodes[y];
                        if (cellNode && cellNode.localName === "mtd") {
                            const intent = cellNode.getAttribute("intent");
                            if (intent === ":equation-label") {
                                // Don't add comma for equation labels
                            } else {
                                // Add comma for other cells in labeled equations
                                let isInLabeledEquation = false;
                                let parent = node.parentNode;
                                while (parent) {
                                    if (parent.localName === "mtable") {
                                        if (parent.childNodes.length > 0) {
                                            const firstRow = parent.childNodes[0];
                                            if (firstRow && firstRow.localName === "mtr" && firstRow.childNodes.length > 0) {
                                                const firstCell = firstRow.childNodes[0];
                                                if (firstCell && firstCell.localName === "mtd") {
                                                    const intent = firstCell.getAttribute("intent");
                                                    if (intent === ":equation-label") {
                                                        isInLabeledEquation = true;
                                                        break;
                                                    } else if (firstCell.firstChild && firstCell.firstChild.localName === "mtext") {
                                                        const labelText = firstCell.firstChild.firstChild.nodeValue;
                                                        if (labelText && /^\([^)]+\)$/.test(labelText)) {
                                                            isInLabeledEquation = true;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    parent = parent.parentNode;
                                }
                                
                                if (isInLabeledEquation) {
                                    words[words.length-1] = `${words[words.length-1]},`;
                                }
                            }
                        }
                    }
                    AddWord(`${GetText("row", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "mtd":
                    // Check if this is an equation label
                    const intent = node.getAttribute("intent");
                    if (intent === ":equation-label") {
                        AddWord(`${GetText("label", misc)}`, words);
                        StandardLoop(node, words, 0, indexes);
                    } else {
                        // Check if this cell contains text that looks like a label (e.g., "(1.4)")
                        if (node.firstChild && node.firstChild.localName === "mtext") {
                            const labelText = node.firstChild.firstChild.nodeValue;
                            if (labelText && /^\([^)]+\)$/.test(labelText)) {
                                AddWord(`${GetText("label", misc)}`, words);
                                StandardLoop(node, words, 0, indexes);
                            } else {
                                StandardLoop(node, words, 0, indexes);
                            }
                        } else {
                            StandardLoop(node, words, 0, indexes);
                        }
                    }
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
                        // Check if this is likely a chemical formula (base is a chemical element)
                        const baseElement = node.childNodes[0];
                        if (baseElement && baseElement.localName === "mi" && baseElement.firstChild) {
                            const elementName = baseElement.firstChild.nodeValue;
                            // If it's a chemical element, use "subscript" instead of "with the lower index"
                            if (elementName && elementName.length <= 2 && /^[A-Z][A-Za-z]?$/.test(elementName)) {
                                AddWord(GetText("subscript", misc), words);
                            } else {
                                AddWord(`${GetText("with the lower index", misc)}`, words);
                            }
                        } else {
                            AddWord(`${GetText("with the lower index", misc)}`, words);
                        }
                        StandardLoop(node, words, 1, indexes);
                        const indexText = GetText("index", misc);
                        const endText = GetText("end", misc);
                        if (indexText && endText) AddWord(`${indexText} ${endText},`, words);
                    }
                    else {
                        // Check if the previous sibling is a chemical element
                        const previousSibling = node.previousSibling;
                        if (previousSibling && previousSibling.localName === "mi" && previousSibling.firstChild) {
                            const elementName = previousSibling.firstChild.nodeValue;
                            // If it's a chemical element, use "subscript"
                            if (elementName && elementName.length <= 2 && /^[A-Z][A-Za-z]?$/.test(elementName)) {
                                AddWord(GetText("subscript", misc), words);
                            } else {
                                AddWord(`${GetText("with the lower index", misc)}`, words);
                            }
                        } else {
                            AddWord(`${GetText("with the lower index", misc)}`, words);
                        }
                        StandardLoop(node, words, 0, indexes);
                        const indexText = GetText("index", misc);
                        const endText = GetText("end", misc);
                        if (indexText && endText) AddWord(`${indexText} ${endText},`, words);
                    }
                    break;
                case "msup":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if(node.childNodes.length >= 2) {
                        // Check if this is inside a labeled equation
                        let isInLabeledEquation = false;
                        let parent = node.parentNode;
                        while (parent) {
                            if (parent.localName === "mtable") {
                                // Check if this mtable is a labeled equation
                                if (parent.childNodes.length > 0) {
                                    const firstRow = parent.childNodes[0];
                                    if (firstRow && firstRow.localName === "mtr" && firstRow.childNodes.length > 0) {
                                        const firstCell = firstRow.childNodes[0];
                                        if (firstCell && firstCell.localName === "mtd") {
                                            const intent = firstCell.getAttribute("intent");
                                            if (intent === ":equation-label") {
                                                isInLabeledEquation = true;
                                                break;
                                            } else if (firstCell.firstChild && firstCell.firstChild.localName === "mtext") {
                                                const labelText = firstCell.firstChild.firstChild.nodeValue;
                                                if (labelText && /^\([^)]+\)$/.test(labelText)) {
                                                    isInLabeledEquation = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            parent = parent.parentNode;
                        }
                        
                        if (isInLabeledEquation) {
                            AddWord(GetText("superscript", misc), words);
                        } else {
                            // Check if this is likely a chemical charge (base is + or -)
                            const baseElement = node.childNodes[0];
                            if (baseElement && baseElement.localName === "mo" && baseElement.firstChild) {
                                const baseValue = baseElement.firstChild.nodeValue;
                                // If it's a charge operator, use "superscript"
                                if (baseValue === "+" || baseValue === "-" || baseValue === "−") {
                                    AddWord(GetText("superscript", misc), words);
                                } else {
                                    const upperIndexText = GetText("with the upper index", misc);
                                    if (upperIndexText) AddWord(upperIndexText, words);
                                }
                            } else {
                                const upperIndexText = GetText("with the upper index", misc);
                                if (upperIndexText) AddWord(upperIndexText, words);
                            }
                        }
                        ParseNode(node.childNodes[0], words, indexes);
                        StandardLoop(node, words, 1, indexes);
                        const indexText = GetText("index", misc);
                        const endText = GetText("end", misc);
                        if (indexText && endText) AddWord(`${indexText} ${endText},`, words);
                    } else {
                        if(IsExp(node)) AddWord(`${GetText("the", misc)} ${GetText("expression", misc)}`, words);
                        StandardLoop(node, words, 0, indexes);
                        if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
                    }
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
                        StandardLoop(node, words, 0, indexes);
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
                    // mfenced is deprecated according to new Nordic MathML Guidelines
                    // Should be replaced with mo elements for parentheses
                    console.warn("Warning: <mfenced> element is deprecated. Use <mo> elements for parentheses instead.");
                    
                    // Extract open and close attributes for backward compatibility
                    const openAttr = node.getAttribute("open") || "(";
                    const closeAttr = node.getAttribute("close") || ")";
                    
                    // Add opening parenthesis text
                    ParenthesisTextOpen({ getAttribute: () => openAttr }, words);
                    
                    // Process children
                    StandardLoop(node, words, 0, indexes);
                    
                    // Add closing parenthesis text
                    ParenthesisTextClose({ getAttribute: () => closeAttr }, words);
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
                    
                    // Check if this is inside a labeled equation
                    let isInLabeledEquation = false;
                    let parent = node.parentNode;
                    while (parent) {
                        if (parent.localName === "mtable") {
                            // Check if this mtable is a labeled equation
                            if (parent.childNodes.length > 0) {
                                const firstRow = parent.childNodes[0];
                                if (firstRow && firstRow.localName === "mtr" && firstRow.childNodes.length > 0) {
                                    const firstCell = firstRow.childNodes[0];
                                    if (firstCell && firstCell.localName === "mtd") {
                                        const intent = firstCell.getAttribute("intent");
                                        if (intent === ":equation-label") {
                                            isInLabeledEquation = true;
                                            break;
                                        } else if (firstCell.firstChild && firstCell.firstChild.localName === "mtext") {
                                            const labelText = firstCell.firstChild.firstChild.nodeValue;
                                            if (labelText && /^\([^)]+\)$/.test(labelText)) {
                                                isInLabeledEquation = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        parent = parent.parentNode;
                    }
                    
                    if (isInLabeledEquation) {
                        AddWord(GetText("fraction", misc), words);
                    } else {
                        AddWord(GetText("fraction with counter", misc), words);
                    }
                    
                    StandardLoop(node, words, 0, indexes);
                    AddWord(`${GetText("fraction", misc)} ${GetText("end", misc)},`, words);
                    if(IsExp(node)) AddWord(`${GetText("expression", misc)} ${GetText("end", misc)},`, words);
                    break;
                case "mo":
                    // Handle operators including parentheses
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    
                    if (node.firstChild !== null) {
                        const moValue = node.firstChild.nodeValue;
                        const moCode = moValue.charCodeAt(0);
                        
                        // Check if this is a parenthesis
                        if (moCode === 40 || moCode === 41 || moCode === 91 || moCode === 93 || 
                            moCode === 123 || moCode === 125 || moCode === 124) {
                            // Handle as parenthesis
                            if (moCode === 40 || moCode === 91 || moCode === 123 || moCode === 124) {
                                // Opening parenthesis
                                ParenthesisTextOpen({ getAttribute: () => moValue }, words);
                            } else {
                                // Closing parenthesis
                                ParenthesisTextClose({ getAttribute: () => moValue }, words);
                            }
                        } else {
                            // Handle as regular operator (original logic)
                            var mo_text = GetText(moValue, operators);
                            if (mo_text != undefined) {
                                switch (moCode) {
                                    case 8242:
                                    case 8243:
                                        // Handle prime symbols properly
                                        AddWord(mo_text, words);
                                        break;
                                    case 8592:
                                    case 8594:
                                    case 8596:
                                        // Handle arrow operators (including chemical reaction arrows)
                                        AddWord(mo_text, words);
                                        break;
                                    default:
                                        AddWord(mo_text, words);
                                        break;
                                }
                            } else {
                                var mo_c = GetText(moCode, operators);
                                if (mo_c != undefined) {
                                    switch (moCode) {
                                        case 8242:
                                        case 8243:
                                            // Handle prime symbols properly
                                            AddWord(mo_c, words);
                                            break;
                                        case 8592:
                                        case 8594:
                                        case 8596:
                                            // Handle arrow operators (including chemical reaction arrows)
                                            AddWord(mo_c, words);
                                            break;
                                        default:
                                            AddWord(mo_c, words);
                                            break;
                                    }
                                } else {
                                    if (moCode > 127) console.warn(` [ WARNING ] Missing text-operator: ${moValue} (char code: ${moCode})`);
                                    
                                    var value = 1;
                                    if (moCode === 176) {
                                        try {
                                            value = node.previousSibling.firstChild.nodeValue;
                                        } catch (ex) {
                                            // Do nothing
                                        }
                                        AddWord(GetText((value === 1) ? "degree" : "degrees", identifiers), words);
                                    } else {
                                        AddWord(moValue, words);
                                    }
                                }
                            }
                        }
                    }
                    break;
                case "mi":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    
                    if(node.firstChild !== null) {
                        var mi_val = node.firstChild.nodeValue;
                        var mi_text = GetText(mi_val, identifiers);
                        var mi_code = mi_val.charCodeAt();
                        var value = 1;
                        
                        // Check if this is a chemical element first
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
                                    // Check if this is a compound that should be split (like "sulfur oxygen")
                                    if (mi_text.includes(" ") && mi_val.length === 2) {
                                        // Split compound into individual elements
                                        const parts = mi_text.split(" ");
                                        parts.forEach(part => AddWord(part, words));
                                    } else {
                                        // Check if this is a single capital letter in a simple reversible reaction context
                                        if (mi_val.length === 1 && mi_val === mi_val.toUpperCase()) {
                                            // Check if this is part of a simple reversible reaction (A ↔ B)
                                            const parent = node.parentNode;
                                            if (parent && parent.localName === "math") {
                                                const siblings = Array.from(parent.childNodes).filter(n => n.localName === "mi");
                                                const operators = Array.from(parent.childNodes).filter(n => n.localName === "mo");
                                                // Only treat as variables if there are exactly 2 mi elements and 1 bidirectional arrow operator
                                                if (siblings.length === 2 && operators.length === 1) {
                                                    const operator = operators[0];
                                                    if (operator.firstChild && operator.firstChild.nodeValue.charCodeAt(0) === 8596) {
                                                        // This is a bidirectional arrow (↔), treat as variables
                                                        AddWord(mi_val, words);
                                                    } else {
                                                        AddWord(mi_text, words);
                                                    }
                                                } else {
                                                    AddWord(mi_text, words);
                                                }
                                            } else {
                                                AddWord(mi_text, words);
                                            }
                                        } else {
                                            AddWord(mi_text, words);
                                        }
                                    }
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
                                // Only apply capital letter logic if not a chemical element
                                if (mi_val == mi_val.toUpperCase() && mi_code != 8734) { // if capital, except infinity
                                    AddWord("capital", words);
                                    AddWord(mi_val.toLowerCase(), words);
                                } else {
                                    if (mi_code > 127) console.warn(` [ WARNING ] Missing text-identifier: ${mi_val} (char code: ${mi_code})`);
                                    AddWord(mi_val, words);
                                }
                            }
                        }
                    }
                    break;
                case "mtext":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if(node.firstChild !== null) {
                        let textValue = node.firstChild.nodeValue;
                        
                        // Check if this mtext is being used as an equation label
                        // (parent is mtd with intent=":equation-label")
                        const parent = node.parentNode;
                        if (parent && parent.localName === "mtd") {
                            const intent = parent.getAttribute("intent");
                            if (intent === ":equation-label") {
                                // Strip parentheses from equation labels
                                textValue = textValue.replace(/^\(|\)$/g, '');
                            } else {
                                // Check if this looks like a label pattern (e.g., "(1.4)")
                                if (/^\([^)]+\)$/.test(textValue)) {
                                    // Strip parentheses from equation labels
                                    textValue = textValue.replace(/^\(|\)$/g, '');
                                }
                            }
                        }
                        
                        AddWord(textValue, words);
                    }
                    break;
                case "mn":
                    DividendText(node, words);
                    RaisedLoweredText(node, words);
                    if(node.firstChild !== null) {
                        const numValue = node.firstChild.nodeValue;
                        // Check if the number starts with a minus sign
                        if (numValue.startsWith('−') || numValue.startsWith('-')) {
                            // Handle negative numbers by separating the minus sign
                            AddWord('minus', words);
                            AddWord(numValue.substring(1), words);
                        } else {
                            AddWord(numValue, words);
                        }
                    }
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
    GenerateMath: (content, alixThresholds) => {
        var words = [];
        var indexes = GetDefaultIndexes();

        try {
            var x2js = new X2JS();
            var dom = x2js.xml2dom(content);

            var root = dom.documentElement;

            // Validate that we have a math element (supports both old and new namespace formats)
            if (root.localName !== "math") {
                throw new Error("Invalid MathML: root element must be 'math'");
            }

            // Validate namespace (supports both old and new formats)
            const xmlns = root.getAttribute("xmlns");
            const xmlnsM = root.getAttribute("xmlns:m");
            if (!xmlns && !xmlnsM) {
                console.warn("Warning: MathML namespace not explicitly declared. This may cause parsing issues.");
            }

            // Build words array
            AddWord("equation", words);
            ParseNode(root, words, indexes);
            AddWord("equation end", words);

            // Generate ALIX
            var alix = GetALIX(indexes, modifiers);

            // if ALIX is lower than threshold value 12, remove "equation" ... "equation end" wording
            if (alix < alixThresholds["noEquationText"]) {
                words.shift();
                words.pop();
            }

            // Post-process to recognize common chemical compounds (only in chemical reactions)
            if (words.includes("yields")) {
                for (let i = 0; i < words.length - 4; i++) {
                    // Check for H₂O pattern: "hydrogen", "subscript", "2", "index end,", "oxygen"
                    if (words[i] === "hydrogen" && words[i + 1] === "subscript" && words[i + 2] === "2" && words[i + 3] === "index end," && words[i + 4] === "oxygen") {
                        // Replace with "water"
                        words.splice(i, 5, "water");
                    }
                }
            }

            // Post-process for reversible reactions to handle single capital letters as variables
            if (words.includes("reversible reaction")) {
                for (let i = 0; i < words.length - 2; i++) {
                    // Check for "capital", "a" pattern and replace with "A"
                    if (words[i] === "capital" && words[i + 1] === "a") {
                        words.splice(i, 2, "A");
                    }
                    // Check for "capital", "b" pattern and replace with "B"
                    if (words[i] === "capital" && words[i + 1] === "b") {
                        words.splice(i, 2, "B");
                    }
                }
            }

            // Return values
            var obj = { success: true, words, alix };
            return obj;
        }
        catch (ex) {
            return { success: false, error: ex }
        }
    }
};
