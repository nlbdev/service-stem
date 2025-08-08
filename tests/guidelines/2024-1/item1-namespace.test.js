

const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 1: Namespace and Semantics Handling', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('Namespace Support', () => {
    it('should handle new direct xmlns namespace format', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle legacy m: namespace format for backward compatibility', () => {
      const mathML = testUtils.createLegacyMathML('<m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle invalid root element gracefully', () => {
      const invalidMathML = '<invalid xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn></invalid>';
      const result = GenerateMath(invalidMathML, { noEquationText: 12 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should process MathML without explicit namespace declaration', () => {
      const mathML = '<math><mn>3</mn><mo>+</mo><mn>2</mn></math>';
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Semantics Element Handling', () => {
    it('should skip deprecated semantics elements entirely', () => {
      const mathML = testUtils.createMathML(
        '<semantics><mn>3</mn><mo>+</mo><mn>2</mn></semantics>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Semantics elements are skipped entirely, so no content is processed
      expect(result.words).toEqual([]);
    });

    it('should skip deprecated annotation elements entirely', () => {
      const mathML = testUtils.createMathML(
        '<semantics><mn>3</mn><mo>+</mo><mn>2</mn><annotation>3+2</annotation></semantics>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Semantics elements are skipped entirely, so no content is processed
      expect(result.words).toEqual([]);
    });

    it('should skip deprecated annotation-xml elements entirely', () => {
      const mathML = testUtils.createMathML(
        '<semantics><mn>3</mn><mo>+</mo><mn>2</mn><annotation-xml>3+2</annotation-xml></semantics>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Semantics elements are skipped entirely, so no content is processed
      expect(result.words).toEqual([]);
    });

    it('should skip complex semantics with multiple annotations entirely', () => {
      const mathML = testUtils.createMathML(
        '<semantics>' +
          '<mn>3</mn><mo>+</mo><mn>2</mn>' +
          '<annotation>3+2</annotation>' +
          '<annotation-xml>3+2</annotation-xml>' +
        '</semantics>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Semantics elements are skipped entirely, so no content is processed
      expect(result.words).toEqual([]);
    });
  });

  describe('Language Attribute Handling', () => {
    it('should extract xml:lang attribute', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { 'xml:lang': 'no' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should extract lang attribute', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { lang: 'sv' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should default to en when no language specified', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Backward Compatibility', () => {
    it('should skip old content with m: namespace and semantics entirely', () => {
      const oldMathML = testUtils.createLegacyMathML(
        '<m:semantics>' +
          '<m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn>' +
          '<m:annotation>3+2</m:annotation>' +
        '</m:semantics>'
      );
      const result = GenerateMath(oldMathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Semantics elements are skipped entirely, so no content is processed
      expect(result.words).toEqual([]);
    });

    it('should handle mixed namespace formats', () => {
      const mixedMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        '<m:mn>3</m:mn><mo>+</mo><m:mn>2</m:mn>' +
        '</math>';
      const result = GenerateMath(mixedMathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });
});
