#!/usr/bin/env node
/*jshint esversion: 8 */

const { XMLParser } = require("fast-xml-parser");

/**
 * Validates MathML content according to Nordic MathML Guidelines
 * @param {string} mathML - The MathML content to validate
 * @returns {Object} Validation result with isValid, errors, and warnings arrays
 */
function validateMathML(mathML) {
    const result = {
        isValid: true,
        errors: [],
        warnings: []
    };

    // Check for required input
    if (!mathML || typeof mathML !== 'string' || mathML.trim() === '') {
        result.isValid = false;
        result.errors.push('MathML content is required.');
        return result;
    }

    // Basic XML structure validation
    if (!isValidXMLStructure(mathML)) {
        result.isValid = false;
        result.errors.push('Invalid XML structure. Please check your MathML syntax.');
        return result;
    }

    try {
        // Parse XML to check structure
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        
        const parsed = parser.parse(mathML);
        
        // Check if we have a valid math element
        if (!parsed.math) {
            result.isValid = false;
            result.errors.push('Invalid XML structure. Please check your MathML syntax.');
            return result;
        }
        
        // Validate namespace
        validateNamespace(parsed, result);
        
        // Validate display attribute
        validateDisplayAttribute(parsed, result);
        
        // Validate deprecated attributes
        validateDeprecatedAttributes(parsed, result);
        
        // Validate deprecated elements
        validateDeprecatedElements(parsed, result);
        
    } catch (error) {
        result.isValid = false;
        result.errors.push('Invalid XML structure. Please check your MathML syntax.');
        console.error('XML parsing error:', error.message);
    }

    return result;
}

/**
 * Basic XML structure validation
 * @param {string} xml - XML content to validate
 * @returns {boolean} True if XML structure appears valid
 */
function isValidXMLStructure(xml) {
    // Check for balanced tags
    const openTags = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(xml)) !== null) {
        const tagName = match[1];
        const isClosing = match[0].startsWith('</');
        
        if (isClosing) {
            if (openTags.length === 0 || openTags.pop() !== tagName) {
                return false; // Unmatched closing tag
            }
        } else {
            openTags.push(tagName);
        }
    }
    
    return openTags.length === 0; // All tags should be closed
}

/**
 * Validates MathML namespace declaration
 * @param {Object} parsed - Parsed XML object
 * @param {Object} result - Validation result object
 */
function validateNamespace(parsed, result) {
    if (!parsed.math) {
        result.isValid = false;
        result.errors.push('MathML must include a <math> root element.');
        return;
    }

    const xmlns = parsed.math['@_xmlns'];
    const expectedNamespace = 'http://www.w3.org/1998/Math/MathML';
    
    if (!xmlns || xmlns !== expectedNamespace) {
        result.isValid = false;
        result.errors.push('MathML must include xmlns="http://www.w3.org/1998/Math/MathML" namespace declaration.');
    }
}

/**
 * Validates display attribute values
 * @param {Object} parsed - Parsed XML object
 * @param {Object} result - Validation result object
 */
function validateDisplayAttribute(parsed, result) {
    if (!parsed.math) return;

    const display = parsed.math['@_display'];
    if (display && display !== 'block' && display !== 'inline') {
        result.isValid = false;
        result.errors.push(`Invalid display attribute value "${display}". Must be "block" or "inline".`);
    }
}

/**
 * Validates deprecated attributes and generates warnings
 * @param {Object} parsed - Parsed XML object
 * @param {Object} result - Validation result object
 */
function validateDeprecatedAttributes(parsed, result) {
    if (!parsed.math) return;

    const alttext = parsed.math['@_alttext'];
    const altimg = parsed.math['@_altimg'];

    if (alttext) {
        result.warnings.push('alttext attribute is deprecated. MathML support has improved and this attribute should not be used.');
    }

    if (altimg) {
        result.warnings.push('altimg attribute is deprecated. MathML support has improved and this attribute should not be used.');
    }
}

/**
 * Validates deprecated elements recursively
 * @param {Object} parsed - Parsed XML object
 * @param {Object} result - Validation result object
 */
function validateDeprecatedElements(parsed, result) {
    const deprecatedElements = [
        'mfenced',
        'semantics', 
        'annotation',
        'annotation-xml'
    ];

    // Check for deprecated elements in the parsed structure
    checkForDeprecatedElements(parsed, deprecatedElements, result);
}

/**
 * Recursively checks for deprecated elements in the parsed XML structure
 * @param {Object} obj - Object to check
 * @param {Array} deprecatedElements - Array of deprecated element names
 * @param {Object} result - Validation result object
 */
function checkForDeprecatedElements(obj, deprecatedElements, result) {
    if (!obj || typeof obj !== 'object') return;

    // Check if current object is a deprecated element
    for (const elementName of deprecatedElements) {
        if (obj[elementName]) {
            const errorMessage = getDeprecatedElementErrorMessage(elementName);
            result.isValid = false;
            result.errors.push(errorMessage);
        }
    }

    // Recursively check all properties
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
            checkForDeprecatedElements(obj[key], deprecatedElements, result);
        }
    }
}

/**
 * Returns appropriate error message for deprecated elements
 * @param {string} elementName - Name of the deprecated element
 * @returns {string} Error message
 */
function getDeprecatedElementErrorMessage(elementName) {
    switch (elementName) {
        case 'mfenced':
            return 'Deprecated element <mfenced> is not allowed. Use <mo> elements for parentheses instead.';
        case 'semantics':
        case 'annotation':
        case 'annotation-xml':
            return `Deprecated element <${elementName}> is not allowed unless specifically requested by the Ordering Agency.`;
        default:
            return `Deprecated element <${elementName}> is not allowed.`;
    }
}

/**
 * Validates MathML content and returns detailed validation information
 * @param {string} mathML - The MathML content to validate
 * @returns {Object} Detailed validation result
 */
function validateMathMLDetailed(mathML) {
    const basicResult = validateMathML(mathML);
    
    // Add additional detailed information
    const detailedResult = {
        ...basicResult,
        timestamp: new Date().toISOString(),
        contentLength: mathML ? mathML.length : 0,
        hasNamespace: false,
        hasDisplayAttribute: false,
        deprecatedElementsFound: [],
        deprecatedAttributesFound: []
    };

    if (mathML) {
        // Check for namespace
        detailedResult.hasNamespace = mathML.includes('xmlns="http://www.w3.org/1998/Math/MathML"');
        
        // Check for display attribute
        detailedResult.hasDisplayAttribute = /display\s*=\s*["'](block|inline)["']/.test(mathML);
        
        // Check for deprecated elements
        const deprecatedElements = ['mfenced', 'semantics', 'annotation', 'annotation-xml'];
        detailedResult.deprecatedElementsFound = deprecatedElements.filter(element => 
            mathML.includes(`<${element}`)
        );
        
        // Check for deprecated attributes
        const deprecatedAttributes = ['alttext', 'altimg'];
        detailedResult.deprecatedAttributesFound = deprecatedAttributes.filter(attr => 
            mathML.includes(`${attr}=`)
        );
    }

    return detailedResult;
}

module.exports = {
    validateMathML,
    validateMathMLDetailed
};