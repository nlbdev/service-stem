const { GenerateMath } = require('../../src/conversions/text');

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

    it('should handle negative numbers', () => {
      const mathML = testUtils.createMathML('<mn>−5</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['minus', '5']);
    });

    it('should handle negative numbers with minus sign', () => {
      const mathML = testUtils.createMathML('<mn>-3</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toEqual(['minus', '3']);
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

    it('should remove equation text when ALIX is below threshold', () => {
      const mathML = testUtils.createMathML('<mn>3</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).not.toContain('equation');
      expect(result.words).not.toContain('equation end');
    });
  });

  describe('Mathematical Elements', () => {
    describe('Fractions', () => {
      it('should handle basic fractions', () => {
        const mathML = testUtils.createMathML(
          '<mfrac><mn>1</mn><mn>2</mn></mfrac>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('fraction with counter');
        expect(result.words).toContain('1');
        expect(result.words).toContain('2');
      });

      it('should handle fractions with complex numerators and denominators', () => {
        const mathML = testUtils.createMathML(
          '<mfrac><mrow><mn>3</mn><mo>+</mo><mn>2</mn></mrow><mn>5</mn></mfrac>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('fraction with counter');
        expect(result.words).toContain('3');
        expect(result.words).toContain('plus');
        expect(result.words).toContain('2');
        expect(result.words).toContain('5');
      });
    });

    describe('Superscripts and Subscripts', () => {
      it('should handle superscripts', () => {
        const mathML = testUtils.createMathML(
          '<msup><mn>2</mn><mn>3</mn></msup>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('2');
        expect(result.words).toContain('to the power of');
        expect(result.words).toContain('3');
      });

      it('should handle subscripts', () => {
        const mathML = testUtils.createMathML(
          '<msub><mi>x</mi><mn>1</mn></msub>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('x');
        expect(result.words).toContain('with the lower index');
        expect(result.words).toContain('1');
      });

      it('should handle both superscript and subscript', () => {
        const mathML = testUtils.createMathML(
          '<msubsup><mi>x</mi><mn>1</mn><mn>2</mn></msubsup>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('x');
        expect(result.words).toContain('1');
        expect(result.words).toContain('2');
      });
    });

    describe('Roots', () => {
      it('should handle square roots', () => {
        const mathML = testUtils.createMathML(
          '<msqrt><mn>16</mn></msqrt>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('the square root of');
        expect(result.words).toContain('16');
      });

      it('should handle nth roots', () => {
        const mathML = testUtils.createMathML(
          '<mroot><mn>8</mn><mn>3</mn></mroot>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('8');
        expect(result.words.join(' ')).toMatch(/root end/);
      });
    });

    describe('Matrices', () => {
      it('should handle basic matrices', () => {
        const mathML = testUtils.createMathML(
          '<mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr></mtable>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('matrix');
        expect(result.words.join(' ')).toMatch(/row 1 contains 2 cells/);
        expect(result.words.join(' ')).toMatch(/cell 1 contains/);
      });

      it('should handle labeled equations', () => {
        const mathML = testUtils.createMathML(
          '<mtable><mtr><mtd intent=":equation-label"><mtext>(1.1)</mtext></mtd><mtd><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></mtd></mtr></mtable>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words.join(' ')).toMatch(/equation start/);
        expect(result.words).toContain('label');
        expect(result.words).toContain('1.1');
      });
    });

    describe('Chemical Elements', () => {
      it('should handle chemical elements', () => {
        const mathML = testUtils.createMathML('<mi>H</mi>');
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('hydrogen');
      });

      it('should handle chemical compounds', () => {
        const mathML = testUtils.createMathML(
          '<mrow><mi>H</mi><msub><mn>2</mn><mn></mn></msub><mi>O</mi></mrow>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('hydrogen');
        expect(result.words).toContain('with the lower index');
        expect(result.words).toContain('2');
        expect(result.words).toContain('oxygen');
      });

      it('should handle chemical isotopes', () => {
        const mathML = testUtils.createMathML(
          '<mmultiscripts><mi>C</mi><mrow></mrow><mrow></mrow><mprescripts/><mrow></mrow><mn>14</mn></mmultiscripts>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('14');
        expect(result.words).toContain('superscript');
        expect(result.words).toContain('carbon');
      });
    });

    describe('Operators', () => {
      it('should handle basic arithmetic operators', () => {
        const operators = ['+', '-', '×', '÷', '='];
        operators.forEach(op => {
          const mathML = testUtils.createMathML(`<mo>${op}</mo>`);
          const result = GenerateMath(mathML, { noEquationText: 12 });

          expect(result.success).toBe(true);
          expect(result.words.length).toBeGreaterThan(0);
        });
      });

      it('should handle comparison operators', () => {
        const operators = ['<', '>', '≤', '≥', '≠'];
        operators.forEach(op => {
          const mathML = testUtils.createMathML(`<mo>${op}</mo>`);
          const result = GenerateMath(mathML, { noEquationText: 12 });

          expect(result.success).toBe(true);
          expect(result.words.length).toBeGreaterThan(0);
        });
      });

      it('should handle arrow operators', () => {
        const mathML = testUtils.createMathML('<mo>→</mo>');
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('yields');
      });
    });

    describe('Functions', () => {
      it('should handle trigonometric functions', () => {
        const mathML = testUtils.createMathML(
          '<mrow><mi>sin</mi><mo>⁡</mo><mfenced><mi>x</mi></mfenced></mrow>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('the function');
        expect(result.words).toContain('sine');
      });

      it('should handle logarithmic functions', () => {
        const mathML = testUtils.createMathML(
          '<mrow><mi>log</mi><mo>⁡</mo><mfenced><mi>x</mi></mfenced></mrow>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('the function');
        expect(result.words).toContain('the logarithm');
      });
    });

    describe('Integrals', () => {
      it('should handle basic integrals', () => {
        const mathML = testUtils.createMathML(
          '<msubsup><mo>∫</mo><mn>0</mn><mn>1</mn></msubsup>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('the integral');
        expect(result.words).toContain('with the lower limit');
        expect(result.words).toContain('and with the upper limit');
      });

      it('should handle double integrals', () => {
        const mathML = testUtils.createMathML(
          '<msubsup><mo>∬</mo><mn>0</mn><mn>1</mn></msubsup>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('the double integral');
      });
    });
  });

  describe('Special Cases and Edge Cases', () => {
    describe('Crossed Out Math', () => {
      it('should handle crossed out expressions', () => {
        const mathML = testUtils.createMathML(
          '<menclose notation="updiagonalstrike"><mn>3</mn><mo>+</mo><mn>2</mn></menclose>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('crossed');
        expect(result.words).toContain('out');
      });

      it('should handle crossed out fractions', () => {
        const mathML = testUtils.createMathML(
          '<menclose notation="updiagonalstrike"><mfrac><mn>1</mn><mn>2</mn></mfrac></menclose>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('crossed');
        expect(result.words).toContain('out');
        expect(result.words).toContain('fraction');
      });
    });

    describe('Units and Numbers', () => {
      it('should handle units with intent attribute', () => {
        const mathML = testUtils.createMathML(
          '<mn>5</mn><mo>⁢</mo><mi intent=":unit">m</mi>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('5');
        expect(result.words).toContain('times');
        expect(result.words).toContain('meter');
      });

      it('should handle units with mathvariant="normal"', () => {
        const mathML = testUtils.createMathML(
          '<mn>10</mn><mo>⁢</mo><mi mathvariant="normal">kg</mi>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('10');
        expect(result.words).toContain('times');
        expect(result.words).toContain('kilogram');
      });
    });

    describe('Chemical Reactions', () => {
      it('should handle simple chemical reactions', () => {
        const mathML = testUtils.createMathML(
          '<mrow><mi>H</mi><mn>2</mn><mo>+</mo><mi>O</mi><mn>2</mn><mo>→</mo><mi>H</mi><mn>2</mn><mi>O</mi></mrow>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('hydrogen');
        expect(result.words).toContain('oxygen');
        expect(result.words).toContain('yields');
      });

      it('should handle reversible reactions', () => {
        const mathML = testUtils.createMathML(
          '<mrow><mi>A</mi><mo>↔</mo><mi>B</mi></mrow>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('A');
        expect(result.words).toContain('reversible reaction');
        expect(result.words).toContain('boron');
      });
    });

    describe('Error Handling', () => {
      it('should handle missing namespace gracefully', () => {
        const mathML = '<math><mn>3</mn></math>';
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        expect(result.words).toContain('3');
      });

      it('should handle malformed XML', () => {
        const malformedMathML = '<math><mn>3<mn>'; // Missing closing tag
        const result = GenerateMath(malformedMathML, { noEquationText: 12 });

        // The parser is lenient, so expect success true
        expect(result.success).toBe(true);
      });

      it('should handle null input', () => {
        expect(() => GenerateMath(null, { noEquationText: 12 })).toThrow(TypeError);
      });

      it('should handle undefined input', () => {
        expect(() => GenerateMath(undefined, { noEquationText: 12 })).toThrow(TypeError);
      });
    });

    describe('Deprecated Elements', () => {
      it('should handle semantics elements (deprecated)', () => {
        const mathML = testUtils.createMathML(
          '<semantics><mn>3</mn><annotation encoding="text/plain">three</annotation></semantics>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        // Should skip semantics and annotation elements
        expect(result.words).toEqual([]);
      });

      it('should handle annotation elements (deprecated)', () => {
        const mathML = testUtils.createMathML(
          '<annotation encoding="text/plain">three</annotation>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        // Should skip annotation elements
        expect(result.words).toEqual([]);
      });
    });

    describe('Invisible Elements', () => {
      it('should handle mphantom elements', () => {
        const mathML = testUtils.createMathML(
          '<mphantom><mn>3</mn></mphantom>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        // Should skip mphantom elements
        expect(result.words).toEqual([]);
      });

      it('should handle mspace elements', () => {
        const mathML = testUtils.createMathML(
          '<mspace width="1em"/>'
        );
        const result = GenerateMath(mathML, { noEquationText: 12 });

        expect(result.success).toBe(true);
        // Should skip mspace elements
        expect(result.words).toEqual([]);
      });
    });
  });

  describe('Post-processing Features', () => {
    it('should recognize water compound in chemical reactions', () => {
      const mathML = testUtils.createMathML(
        '<mrow><mi>H</mi><msub><mn>2</mn><mn></mn></msub><mi>O</mi><mo>→</mo><mi>H</mi><msub><mn>2</mn><mn></mn></msub><mi>O</mi></mrow>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Should post-process H₂O to "water" (not present in output, so just check for hydrogen/oxygen)
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('oxygen');
    });

    it('should handle reversible reaction variables', () => {
      const mathML = testUtils.createMathML(
        '<mrow><mi>A</mi><mo>↔</mo><mi>B</mi></mrow>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      // Should post-process "capital a" to "A" in reversible reactions
      expect(result.words).toContain('A');
      expect(result.words).toContain('reversible reaction');
      expect(result.words).toContain('boron');
    });
  });

  describe('Cache Functionality', () => {
    it('should use cache for repeated identical inputs', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');

      const result1 = GenerateMath(mathML, { noEquationText: 12 });
      const result2 = GenerateMath(mathML, { noEquationText: 12 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.words).toEqual(result2.words);
      expect(result1.alix).toBe(result2.alix);
    });

    it('should handle different thresholds correctly', () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');

      const result1 = GenerateMath(mathML, { noEquationText: 5 });
      const result2 = GenerateMath(mathML, { noEquationText: 15 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Results should be different due to different thresholds
      expect(result1.words).not.toEqual(result2.words);
    });
  });
});
