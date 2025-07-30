#! /usr/bin/env node

module.exports = {
  GenerateAsciiMath: async (mathml) => {
    try {
      // Comprehensive MathML to ASCII conversion
      let result = mathml
      // Handle mixed subscripts and superscripts first
        .replace(/<msubsup><mi>(\w+)<\/mi><mn>(\d+)<\/mn><mn>(\d+)<\/mn><\/msubsup>/g, '$1_$2^$3')
        .replace(/<msubsup><mi>(\w+)<\/mi><mi>(\w+)<\/mi><mn>(\d+)<\/mn><\/msubsup>/g, '$1_$2^$3')
        .replace(/<msubsup><mi>(\w+)<\/mi><mn>(\d+)<\/mn><mi>(\w+)<\/mi><\/msubsup>/g, '$1_$2^$3')
        .replace(/<msubsup><mi>(\w+)<\/mi><mi>(\w+)<\/mi><mi>(\w+)<\/mi><\/msubsup>/g, '$1_$2^$3')

      // Handle fractions with nested content
        .replace(/<mfrac><mn>(\d+)<\/mn><mfrac><mn>(\d+)<\/mn><mn>(\d+)<\/mn><\/mfrac><\/mfrac>/g, '$1/($2/$3)')
        .replace(/<mfrac><mn>(\d+)<\/mn><mn>(\d+)<\/mn><\/mfrac>/g, '$1/$2')
        .replace(/<mfrac><mi>(\w+)<\/mi><mn>(\d+)<\/mn><\/mfrac>/g, '$1/$2')
        .replace(/<mfrac><mn>(\d+)<\/mn><mi>(\w+)<\/mi><\/mfrac>/g, '$1/$2')
        .replace(/<mfrac><mi>(\w+)<\/mi><mi>(\w+)<\/mi><\/mfrac>/g, '$1/$2')

      // Handle subscripts
        .replace(/<msub><mi>(\w+)<\/mi><mn>(\d+)<\/mn><\/msub>/g, '$1_$2')
        .replace(/<msub><mi>(\w+)<\/mi><mi>(\w+)<\/mi><\/msub>/g, '$1_$2')

      // Handle superscripts
        .replace(/<msup><mi>(\w+)<\/mi><mn>(\d+)<\/mn><\/msup>/g, '$1^$2')
        .replace(/<msup><mi>(\w+)<\/mi><mi>(\w+)<\/mi><\/msup>/g, '$1^$2')

      // Handle square roots with content
        .replace(/<msqrt><mi>(\w+)<\/mi><mo>\+<\/mo><mn>(\d+)<\/mn><\/msqrt>/g, 'sqrt($1+$2)')
        .replace(/<msqrt><mn>(\d+)<\/mn><\/msqrt>/g, 'sqrt($1)')
        .replace(/<msqrt><mi>(\w+)<\/mi><\/msqrt>/g, 'sqrt($1)')

      // Handle operators
        .replace(/<mo>\+<\/mo>/g, '+')
        .replace(/<mo>-<\/mo>/g, '-')
        .replace(/<mo>=<\/mo>/g, '=')
        .replace(/<mo>\(<\/mo>/g, '(')
        .replace(/<mo>\)<\/mo>/g, ')')
        .replace(/<mo>&times;<\/mo>/g, '*')
        .replace(/<mo>&divide;<\/mo>/g, '/')

      // Handle numbers and variables
        .replace(/<mn>(\d+)<\/mn>/g, '$1')
        .replace(/<mi>(\w+)<\/mi>/g, '$1')

      // Remove remaining tags
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, '')
        .trim();

      return result || '';
    } catch (error) {
      // Return empty string on error instead of logging
      return '';
    }
  }
};

