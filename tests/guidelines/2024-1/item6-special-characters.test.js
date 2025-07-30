const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 6: Special Character Handling', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('Minus Sign vs Hyphen', () => {
    it('should handle proper minus sign (U+2212)', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>&#x2212;</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('2');
    });

    it('should handle hyphen (U+002D) as minus', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>-</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('2');
    });

    it('should handle negative numbers with proper minus sign', () => {
      const mathML = testUtils.createMathML('<mn>&#x2212;3</mn><mo>+</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('minus');
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
    });
  });

  describe('Prime vs Apostrophe', () => {
    it('should handle prime (U+2032)', () => {
      const mathML = testUtils.createMathML('<mi>x</mi><mo>&#x2032;</mo>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('prime');
    });

    it('should handle double prime (U+2033)', () => {
      const mathML = testUtils.createMathML('<mi>x</mi><mo>&#x2033;</mo>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('double prime');
    });

    it('should handle apostrophe (U+0027) as apostrophe', () => {
      const mathML = testUtils.createMathML('<mi>x</mi><mo>&#x27;</mo><mi>y</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('apostrophe');
      expect(result.words).toContain('y');
    });
  });

  describe('Derivative Symbol', () => {
    it('should handle derivative symbol (U+2146)', () => {
      const mathML = testUtils.createMathML('<mo>&#x2146;</mo><mi>x</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('derivative');
      expect(result.words).toContain('x');
    });

    it('should handle derivative in expressions', () => {
      const mathML = testUtils.createMathML('<mo>&#x2146;</mo><mi>x</mi><mo>=</mo><mn>2</mn><mi>x</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('derivative');
      expect(result.words).toContain('x');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('2');
    });
  });

  describe('Invisible Plus (U+2064)', () => {
    it('should handle invisible plus operator', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>&#x2064;</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toEqual(['3', 'plus', '2']);
    });

    it('should handle invisible plus in expressions', () => {
      const mathML = testUtils.createMathML('<mi>x</mi><mo>&#x2064;</mo><mi>y</mi><mo>&#x2064;</mo><mi>z</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('y');
      expect(result.words).toContain('z');
    });
  });

  describe('Invisible Comma (U+2063)', () => {
    it('should handle invisible comma operator', () => {
      const mathML = testUtils.createMathML('<mi>x</mi><mo>&#x2063;</mo><mi>y</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('comma');
      expect(result.words).toContain('y');
    });

    it('should handle invisible comma in lists', () => {
      const mathML = testUtils.createMathML('<mi>a</mi><mo>&#x2063;</mo><mi>b</mi><mo>&#x2063;</mo><mi>c</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('a');
      expect(result.words).toContain('comma');
      expect(result.words).toContain('b');
      expect(result.words).toContain('c');
    });
  });

  describe('Greek Letters vs Latin Letters', () => {
    it('should handle Greek gamma (U+03B3) vs Latin y', () => {
      const mathML = testUtils.createMathML('<mi>&#x3B3;</mi><mo>+</mo><mi>y</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('gamma');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('y');
    });

    it('should handle Greek rho (U+03C1) vs Latin p', () => {
      const mathML = testUtils.createMathML('<mi>&#x3C1;</mi><mo>=</mo><mi>p</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('rho');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('p');
    });

    it('should handle Greek omega (U+03C9) vs Latin w', () => {
      const mathML = testUtils.createMathML('<mi>&#x3C9;</mi><mo>+</mo><mi>w</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('omega');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('w');
    });

    it('should handle Greek chi (U+03C7) vs Latin x', () => {
      const mathML = testUtils.createMathML('<mi>&#x3C7;</mi><mo>=</mo><mi>x</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('chi');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('x');
    });
  });

  describe('Micro Symbol vs Greek Mu', () => {
    it('should handle micro symbol (U+00B5)', () => {
      const mathML = testUtils.createMathML('<mi>&#x00B5;</mi><mi>m</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('micro');
      expect(result.words).toContain('meter');
    });

    it('should handle Greek mu (U+03BC)', () => {
      const mathML = testUtils.createMathML('<mi>&#x3BC;</mi><mo>=</mo><mn>0</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('mu');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('0');
    });
  });

  describe('Element of Symbol vs Epsilon', () => {
    it('should handle element of symbol (U+2208)', () => {
      const mathML = testUtils.createMathML('<mi>x</mi><mo>&#x2208;</mo><mi>A</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('element of');
      expect(result.words).toContain('ampere');
    });

    it('should handle epsilon (U+03B5)', () => {
      const mathML = testUtils.createMathML('<mi>&#x3B5;</mi><mo>&gt;</mo><mn>0</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('epsilon');
      expect(result.words).toContain('is more than');
      expect(result.words).toContain('0');
    });
  });

  describe('Complex Expressions with Special Characters', () => {
    it('should handle mixed special characters in expressions', () => {
      const mathML = testUtils.createMathML(
        '<mi>f</mi><mo>&#x2032;</mo><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mo>&#x2146;</mo><mi>x</mi><mo>&#x2212;</mo><mn>2</mn>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('f');
      expect(result.words).toContain('prime');
      expect(result.words).toContain('x');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('derivative');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('2');
    });

    it('should handle Greek letters in mathematical expressions', () => {
      const mathML = testUtils.createMathML(
        '<mi>&#x3B1;</mi><mo>+</mo><mi>&#x3B2;</mi><mo>=</mo><mi>&#x3B3;</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('alpha');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('beta');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('gamma');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy character representations', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>-</mo><mn>2</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('2');
    });

    it('should handle mixed old and new character representations', () => {
      const mathML = testUtils.createMathML(
        '<mn>3</mn><mo>-</mo><mn>2</mn><mo>=</mo><mn>&#x2212;1</mn>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('2');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('1');
    });
  });

  describe('ALIX Score Impact', () => {
    it('should calculate appropriate ALIX scores for special characters', () => {
      const simpleMathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const specialCharMathML = testUtils.createMathML('<mi>&#x3B1;</mi><mo>&#x2212;</mo><mi>&#x3B2;</mi>');
      
      const simpleResult = GenerateMath(simpleMathML, { noEquationText: 12 });
      const specialResult = GenerateMath(specialCharMathML, { noEquationText: 12 });
      
      expect(simpleResult.alix).toBeGreaterThan(0);
      expect(specialResult.alix).toBeGreaterThan(0);
      // Both should have valid ALIX scores
      expect(typeof simpleResult.alix).toBe('number');
      expect(typeof specialResult.alix).toBe('number');
    });
  });
}); 