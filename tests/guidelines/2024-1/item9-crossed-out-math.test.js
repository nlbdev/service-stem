const { GenerateMath } = require('../../../conversions/text');

describe('Item 9: Crossed Out Math Support', () => {
  describe('Basic Crossed Out Math', () => {
    it('should handle basic crossed out expression', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="updiagonalstrike">' +
          '<mi>x</mi><mo>+</mo><mn>1</mn>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('1');
    });

    it('should handle crossed out fraction', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="updiagonalstrike">' +
          '<mfrac>' +
            '<mn>1</mn>' +
            '<mn>2</mn>' +
          '</mfrac>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('fraction');
      expect(result.words).toContain('1');
      expect(result.words).toContain('2');
    });
  });

  describe('Different Strike Notations', () => {
    it('should handle updiagonalstrike notation', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="updiagonalstrike">' +
          '<mi>a</mi><mo>+</mo><mi>b</mi>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('a');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('b');
    });

    it('should handle downdiagonalstrike notation', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="downdiagonalstrike">' +
          '<mi>x</mi><mo>-</mo><mi>y</mi>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('x');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('y');
    });

    it('should handle horizontalstrike notation', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="horizontalstrike">' +
          '<mn>5</mn><mo>+</mo><mn>3</mn>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('5');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('3');
    });

    it('should handle verticalstrike notation', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="verticalstrike">' +
          '<mi>z</mi><mo>=</mo><mn>0</mn>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('z');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('0');
    });
  });

  describe('Complex Crossed Out Expressions', () => {
    it('should handle crossed out polynomial', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="updiagonalstrike">' +
          '<mrow>' +
            '<mo>(</mo>' +
            '<mi>x</mi><mo>+</mo><mn>1</mn>' +
            '<mo>)</mo>' +
          '</mrow>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('left');
      expect(result.words).toContain('parenthesis');
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('1');
      expect(result.words).toContain('right');
      expect(result.words).toContain('parenthesis');
    });

    it('should handle crossed out fraction with complex numerator', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="updiagonalstrike">' +
          '<mfrac>' +
            '<mrow>' +
              '<mo>(</mo>' +
              '<msup><mi>x</mi><mn>2</mn></msup>' +
              '<mo>-</mo>' +
              '<mn>2</mn><mi>x</mi>' +
              '<mo>+</mo>' +
              '<mn>3</mn>' +
              '<mo>)</mo>' +
            '</mrow>' +
            '<mrow>' +
              '<mi>x</mi><mo>+</mo><mn>1</mn>' +
            '</mrow>' +
          '</mfrac>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('fraction');
      expect(result.words).toContain('x');
      expect(result.words).toContain('squared');
    });
  });

  describe('Multiple Crossed Out Elements', () => {
    it('should handle multiple crossed out elements in expression', () => {
      const mathML = testUtils.createMathML(
        '<mrow>' +
          '<mn>2</mn><mo>+</mo>' +
          '<menclose notation="updiagonalstrike">' +
            '<mn>3</mn>' +
          '</menclose>' +
          '<mo>+</mo>' +
          '<menclose notation="updiagonalstrike">' +
            '<mn>4</mn>' +
          '</menclose>' +
          '<mo>=</mo><mn>2</mn>' +
        '</mrow>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('2');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('3');
      expect(result.words).toContain('4');
      expect(result.words).toContain('equals');
    });
  });

  describe('Crossed Out Math in Fractions', () => {
    it('should handle crossed out terms in fraction numerator', () => {
      const mathML = testUtils.createMathML(
        '<mfrac>' +
          '<mrow>' +
            '<mn>1</mn><mo>+</mo>' +
            '<menclose notation="updiagonalstrike">' +
              '<mn>2</mn>' +
            '</menclose>' +
          '</mrow>' +
          '<mn>3</mn>' +
        '</mfrac>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('fraction');
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('1');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('2');
      expect(result.words).toContain('3');
    });

    it('should handle crossed out terms in fraction denominator', () => {
      const mathML = testUtils.createMathML(
        '<mfrac>' +
          '<mn>1</mn>' +
          '<mrow>' +
            '<mn>2</mn><mo>+</mo>' +
            '<menclose notation="updiagonalstrike">' +
              '<mn>3</mn>' +
            '</menclose>' +
          '</mrow>' +
        '</mfrac>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('fraction');
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('1');
      expect(result.words).toContain('2');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('3');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle menclose without notation attribute', () => {
      const mathML = testUtils.createMathML(
        '<menclose>' +
          '<mi>x</mi><mo>+</mo><mn>1</mn>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('1');
    });

    it('should handle empty menclose element', () => {
      const mathML = testUtils.createMathML('<menclose notation="updiagonalstrike"></menclose>');
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
    });

    it('should handle unknown notation attribute', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="unknown">' +
          '<mi>a</mi><mo>+</mo><mi>b</mi>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('a');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('b');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy menclose usage', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="updiagonalstrike">' +
          '<mi>x</mi>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
      expect(result.words).toContain('x');
    });
  });

  describe('ALIX Score Impact', () => {
    it('should calculate appropriate ALIX scores for crossed out math', () => {
      const mathML = testUtils.createMathML(
        '<menclose notation="updiagonalstrike">' +
          '<mi>x</mi><mo>+</mo><mn>1</mn>' +
        '</menclose>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.alix).toBeGreaterThan(0);
      expect(result.words).toContain('crossed');
      expect(result.words).toContain('out');
    });
  });
});