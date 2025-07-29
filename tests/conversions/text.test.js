const { GenerateMath } = require('../../conversions/text');

describe('Text Conversion Module', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('GenerateMath', () => {
    it('should process basic MathML correctly', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
      expect(result.alix).toBeGreaterThan(0);
    });

    it('should handle legacy m: namespace format', () => {
      const mathML = testUtils.createLegacyMathML('<m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle display="block" attribute', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn>',
        { display: 'block' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('equation end');
    });

    it('should handle display="inline" attribute', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: 'inline' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).not.toContain('equation');
    });

    it('should handle deprecated attributes without affecting processing', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { alttext: '3+2', altimg: 'image.png' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle invalid MathML gracefully', () => {
      const invalidMathML = '<invalid>content</invalid>';
      const result = GenerateMath(invalidMathML, { noEquationText: 12 });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty MathML', () => {
      const emptyMathML = testUtils.createMathML('');
      const result = GenerateMath(emptyMathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual([]);
    });

    it('should handle mfenced elements (deprecated)', () => {
      const mfencedMathML = testUtils.createMathML(
        '<mfenced open="(" close=")"><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>'
      );
      const result = GenerateMath(mfencedMathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should handle mo elements for parentheses', () => {
      const moMathML = testUtils.createMathML(
        '<mo>(</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>)</mo>'
      );
      const result = GenerateMath(moMathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });
  });

  describe('ALIX Score Calculation', () => {
    it('should calculate ALIX score for simple expressions', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.alix).toBeGreaterThan(0);
      expect(typeof result.alix).toBe('number');
    });

    it('should calculate higher ALIX score for complex expressions', () => {
      const simpleMathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const complexMathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn>'
      );
      
      const simpleResult = GenerateMath(simpleMathML, { noEquationText: 12 });
      const complexResult = GenerateMath(complexMathML, { noEquationText: 12 });
      
      expect(complexResult.alix).toBeGreaterThan(simpleResult.alix);
    });
  });
});