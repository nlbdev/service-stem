const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 2: mfenced Deprecation Handling', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('mfenced Element Processing', () => {
    it('should handle deprecated mfenced elements with default parentheses', () => {
      const mathML = testUtils.createMathML(
        '<mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should handle mfenced with custom open/close attributes', () => {
      const mathML = testUtils.createMathML(
        '<mfenced open="[" close="]"><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should handle mfenced with curly braces', () => {
      const mathML = testUtils.createMathML(
        '<mfenced open="{" close="}"><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should handle mfenced with vertical bars', () => {
      const mathML = testUtils.createMathML(
        '<mfenced open="|" close="|"><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should process mfenced elements normally', () => {
      const mathML = testUtils.createMathML(
        '<mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });
  });

  describe('mo Element Parentheses Handling', () => {
    it('should handle mo elements with opening parenthesis', () => {
      const mathML = testUtils.createMathML(
        '<mo>(</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>)</mo>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should handle mo elements with square brackets', () => {
      const mathML = testUtils.createMathML(
        '<mo>[</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>]</mo>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should handle mo elements with curly braces', () => {
      const mathML = testUtils.createMathML(
        '<mo>{</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>}</mo>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should handle mo elements with vertical bars', () => {
      const mathML = testUtils.createMathML(
        '<mo>|</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>|</mo>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });

    it('should handle regular operators (non-parentheses)', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>+</mo><mn>2</mn>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });
  });

  describe('Backward Compatibility', () => {
    it('should process mfenced and equivalent mo elements', () => {
      const mfencedMathML = testUtils.createMathML(
        '<mfenced open="(" close=")"><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>'
      );
      const moMathML = testUtils.createMathML(
        '<mo>(</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>)</mo>'
      );
      
      const mfencedResult = GenerateMath(mfencedMathML, { noEquationText: 12 });
      const moResult = GenerateMath(moMathML, { noEquationText: 12 });
      
      expect(mfencedResult.success).toBe(true);
      expect(moResult.success).toBe(true);
      // Both should contain the same core content
      expect(mfencedResult.words).toContain('3');
      expect(mfencedResult.words).toContain('plus');
      expect(mfencedResult.words).toContain('2');
      expect(moResult.words).toContain('3');
      expect(moResult.words).toContain('plus');
      expect(moResult.words).toContain('2');
    });

    it('should handle legacy m: namespace with mfenced', () => {
      const mathML = testUtils.createLegacyMathML(
        '<m:mfenced open="(" close=")"><m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn></m:mfenced>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });
  });

  describe('Complex Expressions', () => {
    it('should handle nested mfenced elements', () => {
      const mathML = testUtils.createMathML(
        '<mfenced open="(" close=")">' +
          '<mn>3</mn><mo>+</mo>' +
          '<mfenced open="[" close="]"><mn>2</mn><mo>×</mo><mn>4</mn></mfenced>' +
        '</mfenced>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
      expect(result.words).toContain('4');
    });

    it('should handle mixed mfenced and mo elements', () => {
      const mathML = testUtils.createMathML(
        '<mfenced open="(" close=")"><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>' +
        '<mo>+</mo>' +
        '<mo>(</mo><mn>4</mn><mo>×</mo><mn>5</mn><mo>)</mo>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
      expect(result.words).toContain('4');
      expect(result.words).toContain('5');
    });
  });
});