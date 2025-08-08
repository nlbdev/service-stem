#!/usr/bin/env node
/* eslint-disable complexity, max-lines, no-console */

const { XMLParser } = require('fast-xml-parser');

/**
 * Validates MathML content according to Nordic MathML Guidelines
 * @param {string} mathML - The MathML content to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid, errors, and warnings arrays
 */
function validateMathML(mathML, options = {}) {
  const { strictMode = true, allowLegacy = true } = options;

  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    legacyFeatures: []
  };

  // Check for required input
  if (!mathML || typeof mathML !== 'string' || mathML.trim() === '') {
    result.isValid = false;
    result.errors.push('MathML content is required.');
    return result;
  }

  // Check for legacy namespace first before XML structure validation
  const hasLegacyNamespace = mathML.includes('xmlns:m="http://www.w3.org/1998/Math/MathML"') ||
                              (mathML.includes('<m:math') && mathML.includes('xmlns:m='));

  if (hasLegacyNamespace && !allowLegacy) {
    result.isValid = false;
    result.errors.push('Legacy m: namespace is not allowed in strict mode. Use xmlns="http://www.w3.org/1998/Math/MathML" instead.');
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
      attributeNamePrefix: '@_',
      ignoreNameSpace: false,
      processEntities: false
    });

    const parsed = parser.parse(mathML);

    // Check if we have a valid math element
    if (!parsed.math && !parsed['m:math']) {
      result.isValid = false;
      result.errors.push('Invalid XML structure. Please check your MathML syntax.');
      return result;
    }

    // Validate namespace with backward compatibility
    validateNamespace(parsed, result, allowLegacy, mathML);

    // Validate display attribute
    validateDisplayAttribute(parsed, result);

    // Validate deprecated attributes
    validateDeprecatedAttributes(parsed, result, strictMode);

    // Validate deprecated elements
    validateDeprecatedElements(parsed, result, strictMode);

  } catch (error) {
    // If XML parsing fails, try to validate namespace from raw content
    console.warn('XML parsing failed, attempting raw content validation:', error.message);

    // Check if it's a legacy namespace issue
    if (allowLegacy && hasLegacyNamespace) {
      result.legacyFeatures.push('m: namespace prefix');
      result.warnings.push('Legacy m: namespace detected. Consider migrating to direct xmlns declaration.');
      // Try to validate other aspects from raw content
      validateRawContent(mathML, result, strictMode);
      // If there are no errors after raw validation, mark as valid
      if (result.errors.length === 0) {
        result.isValid = true;
      }
    } else if (!allowLegacy && hasLegacyNamespace) {
      result.isValid = false;
      result.errors.push('Legacy m: namespace is not allowed in strict mode. Use xmlns="http://www.w3.org/1998/Math/MathML" instead.');
      return result;
    } else {
      result.isValid = false;
      result.errors.push('Invalid XML structure. Please check your MathML syntax.');
      return result;
    }
  }

  return result;
}

/**
 * Basic XML structure validation
 * @param {string} xml - XML content to validate
 * @returns {boolean} True if XML structure appears valid
 */
function isValidXMLStructure(xml) {
  // Check for balanced tags, including namespaced tags
  const openTags = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*:?[a-zA-Z0-9]*)[^>]*>/g;
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
 * Validates MathML namespace declaration with backward compatibility support
 * @param {Object} parsed - Parsed XML object
 * @param {Object} result - Validation result object
 * @param {boolean} allowLegacy - Whether to allow legacy m: namespace
 * @param {string} originalMathML - Original MathML content for additional checks
 */
function validateNamespace(parsed, result, allowLegacy = true, originalMathML = '') {
  // Check for both math and m:math elements
  const mathElement = parsed.math || parsed['m:math'];

  if (!mathElement) {
    result.isValid = false;
    result.errors.push('MathML must include a <math> root element.');
    return;
  }

  const xmlns = mathElement['@_xmlns'];
  const xmlnsM = mathElement['@_xmlns:m'];
  const expectedNamespace = 'http://www.w3.org/1998/Math/MathML';

  // Check if this is a legacy m:math element
  const isLegacyMath = parsed['m:math'] !== undefined;

  // Check for new format (preferred)
  if (xmlns === expectedNamespace && !isLegacyMath) {
    // New format is correct
    return;
  }

  // Check for legacy format
  const hasLegacyNamespace = xmlnsM === expectedNamespace || isLegacyMath ||
                              originalMathML.includes('xmlns:m="http://www.w3.org/1998/Math/MathML"') ||
                              (originalMathML.includes('<m:math') && originalMathML.includes('xmlns:m='));

  if (allowLegacy && hasLegacyNamespace) {
    result.legacyFeatures.push('m: namespace prefix');
    result.warnings.push('Legacy m: namespace detected. Consider migrating to direct xmlns declaration.');
    return;
  }

  // Check for incorrect namespace
  if (xmlns && xmlns !== expectedNamespace) {
    result.isValid = false;
    result.errors.push('MathML must include xmlns="http://www.w3.org/1998/Math/MathML" namespace declaration.');
    return;
  }

  // No valid namespace found
  if (!xmlns && !hasLegacyNamespace) {
    result.isValid = false;
    result.errors.push('MathML must include xmlns="http://www.w3.org/1998/Math/MathML" namespace declaration.');
  } else if (!allowLegacy && hasLegacyNamespace) {
    result.isValid = false;
    result.errors.push('Legacy m: namespace is not allowed in strict mode. Use xmlns="http://www.w3.org/1998/Math/MathML" instead.');
  }
}

/**
 * Validates display attribute values
 * @param {Object} parsed - Parsed XML object
 * @param {Object} result - Validation result object
 */
function validateDisplayAttribute(parsed, result) {
  const mathElement = parsed.math || parsed['m:math'];
  if (!mathElement) {return;}

  const display = mathElement['@_display'];
  if (display && display !== 'block' && display !== 'inline') {
    result.isValid = false;
    result.errors.push(`Invalid display attribute value "${display}". Must be "block" or "inline".`);
  }
}

/**
 * Validates deprecated attributes and generates warnings
 * @param {Object} parsed - Parsed XML object
 * @param {Object} result - Validation result object
 * @param {boolean} strictMode - Whether to treat deprecated attributes as errors
 */
function validateDeprecatedAttributes(parsed, result, strictMode = true) {
  const mathElement = parsed.math || parsed['m:math'];
  if (!mathElement) {return;}

  const alttext = mathElement['@_alttext'];
  const altimg = mathElement['@_altimg'];

  if (alttext) {
    result.legacyFeatures.push('alttext attribute');
    if (strictMode) {
      result.isValid = false;
      result.errors.push('alttext attribute is deprecated. MathML support has improved and this attribute should not be used.');
    } else {
      result.warnings.push('alttext attribute is deprecated. MathML support has improved and this attribute should not be used.');
    }
  }

  if (altimg) {
    result.legacyFeatures.push('altimg attribute');
    if (strictMode) {
      result.isValid = false;
      result.errors.push('altimg attribute is deprecated. MathML support has improved and this attribute should not be used.');
    } else {
      result.warnings.push('altimg attribute is deprecated. MathML support has improved and this attribute should not be used.');
    }
  }
}

/**
 * Validates deprecated elements recursively
 * @param {Object} parsed - Parsed XML object
 * @param {Object} result - Validation result object
 * @param {boolean} strictMode - Whether to treat deprecated elements as errors
 */
function validateDeprecatedElements(parsed, result, strictMode = true) {
  const deprecatedElements = [
    'mfenced',
    'semantics',
    'annotation',
    'annotation-xml'
  ];

  // Check for deprecated elements in the parsed structure
  checkForDeprecatedElements(parsed, deprecatedElements, result, strictMode);
}

/**
 * Recursively checks for deprecated elements in the parsed XML structure
 * @param {Object} obj - Object to check
 * @param {Array} deprecatedElements - Array of deprecated element names
 * @param {Object} result - Validation result object
 * @param {boolean} strictMode - Whether to treat deprecated elements as errors
 */
function checkForDeprecatedElements(obj, deprecatedElements, result, strictMode = true) {
  if (!obj || typeof obj !== 'object') {return;}

  // Check if current object is a deprecated element
  for (const elementName of deprecatedElements) {
    if (obj[elementName]) {
      result.legacyFeatures.push(`${elementName} element`);
      const errorMessage = getDeprecatedElementErrorMessage(elementName);

      if (strictMode) {
        result.isValid = false;
        result.errors.push(errorMessage);
      } else {
        result.warnings.push(errorMessage);
      }
    }
  }

  // Recursively check all object properties
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object') {
      checkForDeprecatedElements(obj[key], deprecatedElements, result, strictMode);
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
 * Validates MathML content from raw XML when parsing fails
 * @param {string} mathML - Raw MathML content
 * @param {Object} result - Validation result object
 * @param {boolean} strictMode - Whether to treat deprecated elements as errors
 */
function validateRawContent(mathML, result, strictMode = true) {
  // Check for deprecated elements
  const deprecatedElements = ['mfenced', 'semantics', 'annotation', 'annotation-xml'];

  deprecatedElements.forEach(element => {
    if (mathML.includes(`<${element}`)) {
      result.legacyFeatures.push(`${element} element`);
      const errorMessage = getDeprecatedElementErrorMessage(element);

      if (strictMode) {
        result.isValid = false;
        result.errors.push(errorMessage);
      } else {
        result.warnings.push(errorMessage);
      }
    }
  });

  // Check for deprecated attributes
  if (mathML.includes('alttext=')) {
    result.legacyFeatures.push('alttext attribute');
    if (strictMode) {
      result.isValid = false;
      result.errors.push('alttext attribute is deprecated. MathML support has improved and this attribute should not be used.');
    } else {
      result.warnings.push('alttext attribute is deprecated. MathML support has improved and this attribute should not be used.');
    }
  }

  if (mathML.includes('altimg=')) {
    result.legacyFeatures.push('altimg attribute');
    if (strictMode) {
      result.isValid = false;
      result.errors.push('altimg attribute is deprecated. MathML support has improved and this attribute should not be used.');
    } else {
      result.warnings.push('altimg attribute is deprecated. MathML support has improved and this attribute should not be used.');
    }
  }

  // Check for display attribute
  const displayMatch = mathML.match(/display\s*=\s*["']([^"']*)["']/);
  if (displayMatch && !['block', 'inline'].includes(displayMatch[1])) {
    result.isValid = false;
    result.errors.push(`Invalid display attribute value "${displayMatch[1]}". Must be "block" or "inline".`);
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
