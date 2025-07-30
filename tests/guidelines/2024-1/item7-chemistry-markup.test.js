const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 7: Chemistry Markup Support', () => {
  beforeEach(() => {
    testUtils.clearConsoleMocks();
  });

  describe('Chemical Elements', () => {
    it('should handle basic chemical elements', () => {
      const mathML = testUtils.createMathML('<mi>H</mi><mi>O</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('oxygen');
    });

    it('should handle common chemical elements', () => {
      const mathML = testUtils.createMathML('<mi>Na</mi><mi>Cl</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('sodium');
      expect(result.words).toContain('chlorine');
    });

    it('should handle transition metals', () => {
      const mathML = testUtils.createMathML('<mi>Fe</mi><mi>Cu</mi><mi>Ag</mi>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('iron');
      expect(result.words).toContain('copper');
      expect(result.words).toContain('silver');
    });
  });

  describe('Chemical Formulas with Subscripts', () => {
    it('should handle water molecule (H₂O)', () => {
      const mathML = testUtils.createMathML(
        '<msub><mi>H</mi><mn>2</mn></msub><mi>O</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('2');
      expect(result.words).toContain('oxygen');
    });

    it('should handle carbon dioxide (CO₂)', () => {
      const mathML = testUtils.createMathML(
        '<mi>C</mi><msub><mi>O</mi><mn>2</mn></msub>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('carbon');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('2');
    });

    it('should handle sulfuric acid (H₂SO₄)', () => {
      const mathML = testUtils.createMathML(
        '<msub><mi>H</mi><mn>2</mn></msub><mi>S</mi><msub><mi>O</mi><mn>4</mn></msub>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('2');
      expect(result.words).toContain('sulfur');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('4');
    });
  });

  describe('Chemical Isotopes', () => {
    it('should handle carbon-14 isotope', () => {
      const mathML = testUtils.createMathML(
        '<mmultiscripts>' +
          '<mi>C</mi>' +
          '<mrow></mrow>' +
          '<mrow></mrow>' +
          '<mprescripts/>' +
          '<mrow></mrow>' +
          '<mn>14</mn>' +
        '</mmultiscripts>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('14');
      expect(result.words).toContain('superscript');
      expect(result.words).toContain('carbon');
    });

    it('should handle hydrogen-3 (tritium) isotope', () => {
      const mathML = testUtils.createMathML(
        '<mmultiscripts>' +
          '<mi>H</mi>' +
          '<mrow></mrow>' +
          '<mrow></mrow>' +
          '<mprescripts/>' +
          '<mrow></mrow>' +
          '<mn>3</mn>' +
        '</mmultiscripts>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('3');
      expect(result.words).toContain('superscript');
      expect(result.words).toContain('hydrogen');
    });

    it('should handle uranium-235 isotope', () => {
      const mathML = testUtils.createMathML(
        '<mmultiscripts>' +
          '<mi>U</mi>' +
          '<mrow></mrow>' +
          '<mrow></mrow>' +
          '<mprescripts/>' +
          '<mrow></mrow>' +
          '<mn>235</mn>' +
        '</mmultiscripts>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('235');
      expect(result.words).toContain('superscript');
      expect(result.words).toContain('uranium');
    });
  });

  describe('Chemical Reactions', () => {
    it('should handle simple chemical reaction', () => {
      const mathML = testUtils.createMathML(
        '<msub><mi>H</mi><mn>2</mn></msub>' +
        '<mo>+</mo>' +
        '<msub><mi>O</mi><mn>2</mn></msub>' +
        '<mo>&#x2192;</mo>' +
        '<msub><mi>H</mi><mn>2</mn></msub><mi>O</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('2');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('yields');
      expect(result.words).toContain('water');
    });

    it('should handle reversible reaction', () => {
      const mathML = testUtils.createMathML(
        '<mi>A</mi><mo>&#x2194;</mo><mi>B</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('A');
      expect(result.words).toContain('reversible reaction');
      expect(result.words).toContain('B');
    });

    it('should handle complex chemical reaction', () => {
      const mathML = testUtils.createMathML(
        '<mi>CH</mi><msub><mn>4</mn></msub>' +
        '<mo>+</mo>' +
        '<mn>2</mn><msub><mi>O</mi><mn>2</mn></msub>' +
        '<mo>&#x2192;</mo>' +
        '<mi>CO</mi><msub><mn>2</mn></msub>' +
        '<mo>+</mo>' +
        '<mn>2</mn><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('carbon');
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('yields');
    });
  });

  describe('Chemical Formulas with Superscripts', () => {
    it('should handle ions with charge', () => {
      const mathML = testUtils.createMathML(
        '<mi>Na</mi><msup><mo>+</mo><mn>1</mn></msup>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('sodium');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('superscript');
      expect(result.words).toContain('1');
    });

    it('should handle complex ions', () => {
      const mathML = testUtils.createMathML(
        '<mi>SO</mi><msub><mn>4</mn></msub><msup><mo>-</mo><mn>2</mn></msup>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('sulfur');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('4');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('superscript');
      expect(result.words).toContain('2');
    });
  });

  describe('Complex Chemical Expressions', () => {
    it('should handle molecular formulas with multiple elements', () => {
      const mathML = testUtils.createMathML(
        '<mi>Ca</mi><msub><mi>CO</mi><mn>3</mn></msub>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('calcium');
      expect(result.words).toContain('carbon');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('3');
    });

    it('should handle chemical equations with coefficients', () => {
      const mathML = testUtils.createMathML(
        '<mn>2</mn><mi>H</mi><msub><mn>2</mn></msub>' +
        '<mo>+</mo>' +
        '<mi>O</mi><msub><mn>2</mn></msub>' +
        '<mo>&#x2192;</mo>' +
        '<mn>2</mn><mi>H</mi><msub><mn>2</mn></msub><mi>O</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('2');
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('yields');
    });
  });

  describe('Chemical Notation with Special Characters', () => {
    it('should handle chemical formulas with Greek letters', () => {
      const mathML = testUtils.createMathML(
        '<mi>&#x3B1;</mi><mi>Fe</mi><msub><mn>2</mn></msub><mi>O</mi><msub><mn>3</mn></msub>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('alpha');
      expect(result.words).toContain('iron');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('2');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('3');
    });

    it('should handle chemical formulas with special symbols', () => {
      const mathML = testUtils.createMathML(
        '<mi>H</mi><msub><mn>2</mn></msub><mi>SO</mi><msub><mn>4</mn></msub><mo>&#x2212;</mo>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('2');
      expect(result.words).toContain('sulfur');
      expect(result.words).toContain('oxygen');
      expect(result.words).toContain('4');
      expect(result.words).toContain('minus');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy chemical notation', () => {
      const mathML = testUtils.createMathML(
        '<mi>H</mi><mo>2</mo><mi>O</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('2');
      expect(result.words).toContain('oxygen');
    });

    it('should handle mixed old and new chemical notation', () => {
      const mathML = testUtils.createMathML(
        '<mi>Na</mi><mi>Cl</mi><mo>+</mo><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('sodium');
      expect(result.words).toContain('chlorine');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('hydrogen');
      expect(result.words).toContain('subscript');
      expect(result.words).toContain('2');
      expect(result.words).toContain('oxygen');
    });
  });

  describe('ALIX Score Impact', () => {
    it('should calculate appropriate ALIX scores for chemical formulas', () => {
      const simpleFormula = testUtils.createMathML('<mi>H</mi><mi>O</mi>');
      const complexFormula = testUtils.createMathML(
        '<mmultiscripts>' +
          '<mi>U</mi>' +
          '<mrow></mrow>' +
          '<mrow></mrow>' +
          '<mprescripts/>' +
          '<mrow></mrow>' +
          '<mn>235</mn>' +
        '</mmultiscripts>'
      );

      const simpleResult = GenerateMath(simpleFormula, { noEquationText: 12 });
      const complexResult = GenerateMath(complexFormula, { noEquationText: 12 });

      expect(simpleResult.alix).toBeGreaterThan(0);
      expect(complexResult.alix).toBeGreaterThan(0);
      // Complex formulas should have higher ALIX scores
      expect(complexResult.alix).toBeGreaterThan(simpleResult.alix);
      expect(typeof simpleResult.alix).toBe('number');
      expect(typeof complexResult.alix).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed chemical formulas gracefully', () => {
      const mathML = testUtils.createMathML(
        '<msub><mi>H</mi></msub>' // Missing subscript value
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('hydrogen');
    });

    it('should handle unknown chemical elements', () => {
      const mathML = testUtils.createMathML('<mi>Xx</mi>'); // Unknown element
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('Xx'); // Should fall back to raw text
    });
  });
});
