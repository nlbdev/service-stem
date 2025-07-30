const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 10: Fill-in-the-blanks Support', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('Blank Space Symbol Support', () => {
    it('should handle single blank space in mi tag', () => {
      const mathML = testUtils.createMathML('<mi>&#9109;</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('blank space');
    });

    it('should handle blank space in simple equation', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mi>&#9109;</mi><mo>=</mo><mn>5</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('blank space');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('5');
    });

    it('should handle multiple blank spaces in equation', () => {
      const mathML = testUtils.createMathML('<mi>&#9109;</mi><mo>+</mo><mi>&#9109;</mi><mo>=</mo><mn>10</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Should contain "blank space" twice
      const blankSpaceCount = result.words.filter(word => word === 'blank space').length;
      expect(blankSpaceCount).toBeGreaterThanOrEqual(1);
      expect(result.words).toContain('plus');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('10');
    });

    it('should handle blank space in fraction', () => {
      const mathML = testUtils.createMathML('<mfrac><mi>&#9109;</mi><mn>2</mn></mfrac>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('blank space');
      expect(result.words).toContain('fraction with counter');
      expect(result.words).toContain('and denominator');
      expect(result.words).toContain('2');
    });

    it('should handle blank space in superscript', () => {
      const mathML = testUtils.createMathML('<msup><mi>x</mi><mi>&#9109;</mi></msup>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('to the power of');
      expect(result.words).toContain('blank space');
    });

    it('should handle blank space in subscript', () => {
      const mathML = testUtils.createMathML('<msub><mi>x</mi><mi>&#9109;</mi></msub>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('with the lower index');
      expect(result.words).toContain('blank space');
    });

    it('should handle blank space in parentheses', () => {
      const mathML = testUtils.createMathML('<mfenced><mi>&#9109;</mi><mo>+</mo><mn>1</mn></mfenced>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('left parenthesis');
      expect(result.words).toContain('blank space');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('1');
    });

    it('should handle blank space in matrix', () => {
      const mathML = testUtils.createMathML(
        '<mtable><mtr><mtd><mi>&#9109;</mi></mtd><mtd><mn>2</mn></mtd></mtr></mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('matrix');
      expect(result.words).toContain('blank space');
      expect(result.words).toContain('2');
    });

    it('should handle blank space in chemical formula', () => {
      const mathML = testUtils.createMathML('<msub><mi>H</mi><mi>&#9109;</mi></msub>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('blank space');
    });

    it('should handle blank space in function', () => {
      const mathML = testUtils.createMathML('<mi>f</mi><mo>(</mo><mi>&#9109;</mi><mo>)</mo>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('f');
      expect(result.words).toContain('left parenthesis');
      expect(result.words).toContain('blank space');
    });

    it('should handle blank space in complex expression', () => {
      const mathML = testUtils.createMathML(
        '<msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mi>&#9109;</mi><mo>+</mo><mn>1</mn>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('to the power of');
      expect(result.words).toContain('2');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('blank space');
      expect(result.words).toContain('1');
    });

    it('should handle blank space with other special characters', () => {
      const mathML = testUtils.createMathML('<mi>&#9109;</mi><mo>&#x2212;</mo><mn>3</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('blank space');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('3');
    });

    it('should handle blank space in labeled equation', () => {
      const mathML = testUtils.createMathML(
        '<mtable><mtr><mtd intent=":equation-label"><mtext>(1.1)</mtext></mtd>' +
        '<mtd><mi>&#9109;</mi><mo>=</mo><mn>5</mn></mtd></mtr></mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('blank space');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty mi tag gracefully', () => {
      const mathML = testUtils.createMathML('<mi></mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Should not crash, but may not produce meaningful output
    });

    it('should handle mi tag with only whitespace', () => {
      const mathML = testUtils.createMathML('<mi> </mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Should handle whitespace appropriately
    });

    it('should handle nested blank spaces', () => {
      const mathML = testUtils.createMathML(
        '<msup><mi>&#9109;</mi><mi>&#9109;</mi></msup>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('blank space');
      expect(result.words).toContain('to the power of');
    });
  });

  describe('Unicode Character Handling', () => {
    it('should handle the exact Unicode character code 9109', () => {
      const mathML = testUtils.createMathML('<mi>&#9109;</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('blank space');
    });

    it('should handle the character as direct Unicode', () => {
      const mathML = testUtils.createMathML('<mi>⎕</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('blank space');
    });
  });
});
