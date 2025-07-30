#!/usr/bin/env node
/*jshint esversion: 8 */

/**
 * Backward Compatibility Module
 * Handles version detection and migration strategies for existing MathML content
 */

/**
 * Detects the version of MathML content based on its structure
 * @param {string} mathML - The MathML content to analyze
 * @returns {Object} Version information and compatibility details
 */
function detectMathMLVersion(mathML) {
    const result = {
        version: '2.0.0',
        isLegacy: false,
        legacyFeatures: [],
        migrationHints: [],
        compatibilityMode: false
    };

    if (!mathML || typeof mathML !== 'string') {
        return result;
    }

    // Check for legacy m: namespace
    if (mathML.includes('xmlns:m=') || mathML.includes('<m:') || mathML.includes('</m:')) {
        result.isLegacy = true;
        result.legacyFeatures.push('m: namespace prefix');
        result.migrationHints.push('Replace m: namespace with direct xmlns declaration');
    }

    // Check for deprecated elements
    const deprecatedElements = [
        { element: 'mfenced', hint: 'Replace <mfenced> with <mo> elements for parentheses' },
        { element: 'semantics', hint: 'Remove <semantics> wrapper unless specifically required' },
        { element: 'annotation', hint: 'Remove <annotation> elements unless specifically required' },
        { element: 'annotation-xml', hint: 'Remove <annotation-xml> elements unless specifically required' }
    ];

    deprecatedElements.forEach(({ element, hint }) => {
        if (mathML.includes(`<${element}`)) {
            result.legacyFeatures.push(`${element} element`);
            result.migrationHints.push(hint);
        }
    });

    // Check for deprecated attributes
    const deprecatedAttributes = [
        { attr: 'alttext', hint: 'Remove alttext attribute as MathML support has improved' },
        { attr: 'altimg', hint: 'Remove altimg attribute as MathML support has improved' }
    ];

    deprecatedAttributes.forEach(({ attr, hint }) => {
        if (mathML.includes(`${attr}=`)) {
            result.legacyFeatures.push(`${attr} attribute`);
            result.migrationHints.push(hint);
        }
    });

    // Check for old invisible operator codes
    const oldInvisibleOperators = [
        { code: '&#8290;', hint: 'Replace with &#x2062; for invisible multiplication' },
        { code: '&#8289;', hint: 'Replace with &#x2061; for invisible function application' },
        { code: '&#8292;', hint: 'Replace with &#x2064; for invisible plus' },
        { code: '&#8291;', hint: 'Replace with &#x2063; for invisible comma' }
    ];

    oldInvisibleOperators.forEach(({ code, hint }) => {
        if (mathML.includes(code)) {
            result.legacyFeatures.push(`old invisible operator ${code}`);
            result.migrationHints.push(hint);
        }
    });

    // Determine if compatibility mode should be enabled
    if (result.isLegacy || result.legacyFeatures.length > 0) {
        result.compatibilityMode = true;
    }

    return result;
}

/**
 * Migrates legacy MathML content to the new format
 * @param {string} mathML - The legacy MathML content
 * @returns {Object} Migration result with new content and changes made
 */
function migrateMathML(mathML) {
    const result = {
        originalContent: mathML,
        migratedContent: mathML,
        changes: [],
        warnings: [],
        success: true
    };

    if (!mathML || typeof mathML !== 'string') {
        result.success = false;
        result.warnings.push('Invalid MathML content provided for migration');
        return result;
    }

    let migratedContent = mathML;

    // Migrate m: namespace to direct xmlns
    if (migratedContent.includes('xmlns:m=')) {
        migratedContent = migratedContent.replace(
            /xmlns:m="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/g,
            'xmlns="http://www.w3.org/1998/Math/MathML"'
        );
        result.changes.push('Converted m: namespace to direct xmlns declaration');
    }

    // Remove m: prefixes from tags
    if (migratedContent.includes('<m:') || migratedContent.includes('</m:')) {
        migratedContent = migratedContent.replace(/<\/?m:/g, '<');
        result.changes.push('Removed m: prefixes from MathML tags');
    }

    // Convert mfenced to mo elements
    const mfencedRegex = /<mfenced([^>]*)>(.*?)<\/mfenced>/gs;
    migratedContent = migratedContent.replace(mfencedRegex, (match, attributes, content) => {
        const openMatch = attributes.match(/open="([^"]*)"/);
        const closeMatch = attributes.match(/close="([^"]*)"/);
        const open = openMatch ? openMatch[1] : "(";
        const close = closeMatch ? closeMatch[1] : ")";
        result.changes.push(`Converted <mfenced> to <mo> elements with ${open} and ${close}`);
        return `<mo>${open}</mo>${content}<mo>${close}</mo>`;
    });

    // Remove semantics wrapper (keeping inner content)
    const semanticsRegex = /<semantics[^>]*>(.*?)<\/semantics>/gs;
    migratedContent = migratedContent.replace(semanticsRegex, (match, innerContent) => {
        // Remove annotation elements from inner content
        const cleanedContent = innerContent
            .replace(/<annotation[^>]*>.*?<\/annotation>/gs, '')
            .replace(/<annotation-xml[^>]*>.*?<\/annotation-xml>/gs, '');
        result.changes.push('Removed <semantics> wrapper and annotation elements');
        return cleanedContent;
    });

    // Remove deprecated attributes
    migratedContent = migratedContent.replace(/alttext="[^"]*"/g, '');
    migratedContent = migratedContent.replace(/altimg="[^"]*"/g, '');
    if (mathML.includes('alttext=') || mathML.includes('altimg=')) {
        result.changes.push('Removed deprecated alttext and altimg attributes');
    }

    // Update invisible operator codes
    const operatorMappings = [
        { old: '&#8290;', new: '&#x2062;', desc: 'invisible multiplication' },
        { old: '&#8289;', new: '&#x2061;', desc: 'invisible function application' },
        { old: '&#8292;', new: '&#x2064;', desc: 'invisible plus' },
        { old: '&#8291;', new: '&#x2063;', desc: 'invisible comma' }
    ];

    operatorMappings.forEach(({ old, new: newCode, desc }) => {
        if (migratedContent.includes(old)) {
            migratedContent = migratedContent.replace(new RegExp(old, 'g'), newCode);
            result.changes.push(`Updated ${desc} operator code from ${old} to ${newCode}`);
        }
    });

    result.migratedContent = migratedContent;
    return result;
}

/**
 * Validates migrated content to ensure it meets new guidelines
 * @param {string} migratedContent - The migrated MathML content
 * @returns {Object} Validation result for migrated content
 */
function validateMigratedContent(migratedContent) {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        remainingLegacyFeatures: []
    };

    if (!migratedContent || typeof migratedContent !== 'string') {
        result.isValid = false;
        result.errors.push('Invalid migrated content provided');
        return result;
    }

    // Check for remaining legacy features
    const legacyPatterns = [
        { pattern: /<m:/, desc: 'm: namespace prefix' },
        { pattern: /<\/m:/, desc: 'm: namespace closing tag' },
        { pattern: /<mfenced/, desc: 'mfenced element' },
        { pattern: /<semantics/, desc: 'semantics element' },
        { pattern: /<annotation/, desc: 'annotation element' },
        { pattern: /alttext=/, desc: 'alttext attribute' },
        { pattern: /altimg=/, desc: 'altimg attribute' },
        { pattern: /&#829[0-3];/, desc: 'old invisible operator codes' }
    ];

    legacyPatterns.forEach(({ pattern, desc }) => {
        if (pattern.test(migratedContent)) {
            result.remainingLegacyFeatures.push(desc);
            result.warnings.push(`Remaining legacy feature detected: ${desc}`);
        }
    });

    // Check for required namespace
    if (!migratedContent.includes('xmlns="http://www.w3.org/1998/Math/MathML"')) {
        result.errors.push('Missing required MathML namespace declaration');
        result.isValid = false;
    }

    // Check for valid display attribute values
    const displayMatch = migratedContent.match(/display\s*=\s*["']([^"']*)["']/);
    if (displayMatch && !['block', 'inline'].includes(displayMatch[1])) {
        result.errors.push(`Invalid display attribute value: ${displayMatch[1]}. Must be "block" or "inline"`);
        result.isValid = false;
    }

    return result;
}

/**
 * Provides migration recommendations based on detected legacy features
 * @param {Object} versionInfo - Version detection result
 * @returns {Array} Array of migration recommendations
 */
function getMigrationRecommendations(versionInfo) {
    const recommendations = [];

    if (versionInfo.isLegacy) {
        recommendations.push({
            priority: 'high',
            category: 'namespace',
            description: 'Update namespace declaration to use direct xmlns format',
            example: {
                from: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML">',
                to: '<math xmlns="http://www.w3.org/1998/Math/MathML">'
            }
        });
    }

    if (versionInfo.legacyFeatures.includes('mfenced element')) {
        recommendations.push({
            priority: 'high',
            category: 'elements',
            description: 'Replace mfenced elements with mo elements for parentheses',
            example: {
                from: '<mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>',
                to: '<mo>(</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>)</mo>'
            }
        });
    }

    if (versionInfo.legacyFeatures.includes('semantics element')) {
        recommendations.push({
            priority: 'medium',
            category: 'elements',
            description: 'Remove semantics wrapper unless specifically required by ordering agency',
            example: {
                from: '<semantics><mn>3</mn><mo>+</mo><mn>2</mn></semantics>',
                to: '<mn>3</mn><mo>+</mo><mn>2</mn>'
            }
        });
    }

    if (versionInfo.legacyFeatures.some(f => f.includes('alttext') || f.includes('altimg'))) {
        recommendations.push({
            priority: 'medium',
            category: 'attributes',
            description: 'Remove deprecated alttext and altimg attributes as MathML support has improved',
            example: {
                from: '<math alttext="3+2" altimg="image.png">',
                to: '<math>'
            }
        });
    }

    return recommendations;
}

module.exports = {
    detectMathMLVersion,
    migrateMathML,
    validateMigratedContent,
    getMigrationRecommendations
};