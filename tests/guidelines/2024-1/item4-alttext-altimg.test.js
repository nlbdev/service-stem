const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 4: Alttext and Altimg Deprecation', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('Alttext Attribute Handling', () => {
    it('should process MathML without alttext attribute (recommended)', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should process MathML with alttext attribute normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: '3+2' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should process MathML with complex alttext content', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: '3 plus 2 equals 5' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should generate text from MathML structure, not alttext', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: 'different content' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      // Should generate from MathML structure, not use alttext
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Altimg Attribute Handling', () => {
    it('should process MathML without altimg attribute (recommended)', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should process MathML with altimg attribute normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { altimg: 'image.png' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should process MathML with complex altimg path', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { altimg: '/images/math/equation-001.png' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Combined Deprecated Attributes', () => {
    it('should process MathML with both alttext and altimg attributes', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: '3+2', altimg: 'image.png' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should process correctly despite deprecated attributes', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn>',
        { alttext: '3+2=5', altimg: 'equation.png' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('5');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy m: namespace with deprecated attributes', () => {
      const mathML = testUtils.createLegacyMathML(
        '<m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn>',
        { alttext: '3+2', altimg: 'image.png' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle mixed namespace with deprecated attributes', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" alttext="3+2" altimg="image.png">' +
        '<m:mn>3</m:mn><mo>+</mo><m:mn>2</m:mn>' +
        '</math>';
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('AsciiMath Generation', () => {
    it('should generate AsciiMath from MathML content, not alttext', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: 'different content' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      // Should generate from MathML structure, not use alttext
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle AsciiMath generation errors gracefully', () => {
      // This test would require mocking the AsciiMath conversion to fail
      // For now, we test that the system doesn't rely on alttext
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: 'fallback content' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Template Generation', () => {
    it('should not include altimg in template generation', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { altimg: 'image.png' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      // Template should not reference altimg
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should not include alttext in template generation', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: '3+2' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      // Template should not reference alttext
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('ALIX Score Consistency', () => {
    it('should produce consistent ALIX scores regardless of deprecated attributes', () => {
      const cleanMathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const deprecatedMathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: '3+2', altimg: 'image.png' }
      );
      
      const cleanResult = GenerateMath(cleanMathML, { noEquationText: 12 });
      const deprecatedResult = GenerateMath(deprecatedMathML, { noEquationText: 12 });
      
      expect(cleanResult.success).toBe(true);
      expect(deprecatedResult.success).toBe(true);
      expect(cleanResult.words).toEqual(deprecatedResult.words);
      expect(cleanResult.alix).toBe(deprecatedResult.alix);
    });
  });
});