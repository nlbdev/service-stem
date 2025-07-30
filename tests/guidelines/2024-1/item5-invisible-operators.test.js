const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 5: Invisible Operators Updates', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('Invisible Multiplication (U+2062)', () => {
    it('should handle invisible multiplication between numbers and variables', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>&#x2062;</mo><mi>x</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('times');
      expect(result.words).toContain('x');
    });

    it('should handle invisible multiplication between variables', () => {
      const mathML = testUtils.createMathML('<mi>x</mi><mo>&#x2062;</mo><mi>y</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('times');
      expect(result.words).toContain('y');
    });

    it('should handle invisible multiplication in complex expressions', () => {
      const mathML = testUtils.createMathML('<mn>2</mn><mo>&#x2062;</mo><mi>x</mi><mo>+</mo><mn>3</mn><mo>&#x2062;</mo><mi>y</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('2');
      expect(result.words).toContain('times');
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('3');
      expect(result.words).toContain('y');
    });
  });

  describe('Invisible Function Application (U+2061)', () => {
    it('should handle invisible function application', () => {
      const mathML = testUtils.createMathML('<mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('f');
      expect(result.words).toContain('of');
      expect(result.words).toContain('x');
    });

    it('should handle invisible function application with complex arguments', () => {
      const mathML = testUtils.createMathML('<mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>+</mo><mi>y</mi><mo>)</mo>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('f');
      expect(result.words).toContain('of');
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('y');
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

  describe('Mixed Invisible Operators', () => {
    it('should handle complex expressions with multiple invisible operators', () => {
      const mathML = testUtils.createMathML(
        '<mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mn>2</mn><mo>&#x2062;</mo><mi>x</mi><mo>&#x2064;</mo><mn>1</mn><mo>)</mo>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('f');
      expect(result.words).toContain('of');
      expect(result.words).toContain('2');
      expect(result.words).toContain('times');
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('1');
    });

    it('should handle invisible operators in function composition', () => {
      const mathML = testUtils.createMathML('<mi>f</mi><mo>&#x2061;</mo><mi>g</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('f');
      expect(result.words).toContain('of');
      expect(result.words).toContain('g');
      expect(result.words).toContain('x');
    });
  });

  describe('Units with Invisible Multiplication', () => {
    it('should handle numbers with units using invisible multiplication', () => {
      const mathML = testUtils.createMathML(
        '<mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('100');
      expect(result.words).toContain('times');
      expect(result.words).toContain('meter');
    });

    it('should handle complex units with invisible multiplication', () => {
      const mathML = testUtils.createMathML(
        '<mn>10</mn><mo>&#x2062;</mo><mrow><mi mathvariant="normal">m</mi><mo>/</mo><msup><mi mathvariant="normal">s</mi><mn>2</mn></msup></mrow>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('10');
      expect(result.words).toContain('times');
      expect(result.words).toContain('meter');
      expect(result.words).toContain('second');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy ring operator (U+2218) for backward compatibility', () => {
      const mathML = testUtils.createMathML('<mi>f</mi><mo>&#x2218;</mo><mi>g</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('f');
      expect(result.words).toContain('ring operator');
      expect(result.words).toContain('g');
    });

    it('should handle mixed old and new invisible operators', () => {
      const mathML = testUtils.createMathML(
        '<mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>&#x2218;</mo><mi>y</mi><mo>)</mo>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('f');
      expect(result.words).toContain('of');
      expect(result.words).toContain('x');
      expect(result.words).toContain('ring operator');
      expect(result.words).toContain('y');
    });
  });

  describe('ALIX Score Impact', () => {
    it('should calculate appropriate ALIX scores for invisible operators', () => {
      const simpleMathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');
      const invisibleOpMathML = testUtils.createMathML('<mn>3</mn><mo>&#x2062;</mo><mi>x</mi>');
      
      const simpleResult = GenerateMath(simpleMathML, { noEquationText: 12 });
      const invisibleResult = GenerateMath(invisibleOpMathML, { noEquationText: 12 });
      
      expect(simpleResult.alix).toBeGreaterThan(0);
      expect(invisibleResult.alix).toBeGreaterThan(0);
      // Both should have valid ALIX scores
      expect(typeof simpleResult.alix).toBe('number');
      expect(typeof invisibleResult.alix).toBe('number');
    });
  });

  describe('Unicode Character Handling', () => {
    it('should handle different Unicode representations of invisible times', () => {
      const mathML1 = testUtils.createMathML('<mn>3</mn><mo>&#x2062;</mo><mi>x</mi>');
      const mathML2 = testUtils.createMathML('<mn>3</mn><mo>&#x2219;</mo><mi>x</mi>');
      
      const result1 = GenerateMath(mathML1, { noEquationText: 12 });
      const result2 = GenerateMath(mathML2, { noEquationText: 12 });
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Both should produce similar results
      expect(result1.words).toContain('3');
      expect(result1.words).toContain('times');
      expect(result1.words).toContain('x');
      expect(result2.words).toContain('3');
      expect(result2.words).toContain('bullet operator');
      expect(result2.words).toContain('x');
    });
  });
});