/* eslint-disable complexity, max-depth, max-lines, no-unused-vars */

const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 3: Display Attribute Handling', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('Default Display Behavior', () => {
    it('should process MathML without display attribute normally', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should process MathML with display="inline" normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: 'inline' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should process MathML with display="block" normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn>',
        { display: 'block' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Display attribute affects rendering, not text generation
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('5');
    });
  });

  describe('Display Attribute Processing', () => {
    it('should process display="block" value normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: 'block' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Display attribute affects rendering, not text generation
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should process display="inline" value normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: 'inline' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle invalid display values gracefully', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: 'invalid' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Should still process the MathML content
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle empty display value gracefully', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: '' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Displaystyle Attribute', () => {
    it('should handle displaystyle="true" normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { displaystyle: 'true' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle displaystyle="false" normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { displaystyle: 'false' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle invalid displaystyle values gracefully', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { displaystyle: 'invalid' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Complex Display Scenarios', () => {
    it('should handle display="block" with complex expressions normally', () => {
      const mathML = testUtils.createMathML(
        '<mfrac><mn>3</mn><mn>2</mn></mfrac><mo>+</mo><mn>1</mn>',
        { display: 'block' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Display attribute affects rendering, not text generation
      expect(result.words).toContain('3');
      expect(result.words).toContain('2');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('1');
    });

    it('should handle display="inline" with complex expressions normally', () => {
      const mathML = testUtils.createMathML(
        '<mfrac><mn>3</mn><mn>2</mn></mfrac><mo>+</mo><mn>1</mn>',
        { display: 'inline' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('2');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('1');
    });

    it('should handle both display and displaystyle attributes normally', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: 'block', displaystyle: 'true' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Display attributes affect rendering, not text generation
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy m: namespace with display attributes normally', () => {
      const mathML = testUtils.createLegacyMathML(
        '<m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn>',
        { display: 'block' }
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle mixed namespace with display attributes normally', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' +
        '<m:mn>3</m:mn><mo>+</mo><m:mn>2</m:mn>' +
        '</math>';
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('ALIX Score Impact', () => {
    it('should calculate ALIX scores for different display modes', () => {
      const inlineMathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: 'inline' }
      );
      const blockMathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>',
        { display: 'block' }
      );

      const inlineResult = GenerateMath(inlineMathML, { noEquationText: 12 });
      const blockResult = GenerateMath(blockMathML, { noEquationText: 12 });

      expect(inlineResult.alix).toBeGreaterThan(0);
      expect(blockResult.alix).toBeGreaterThan(0);
      // Both should have valid ALIX scores
      expect(typeof inlineResult.alix).toBe('number');
      expect(typeof blockResult.alix).toBe('number');
    });
  });
});
