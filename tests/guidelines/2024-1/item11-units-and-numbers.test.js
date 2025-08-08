/* eslint-disable complexity, max-depth, max-lines, no-unused-vars */

const { GenerateMath } = require('../../../src/conversions/text');

describe('Item 11: Units and Numbers', () => {
  describe('Unit Handling', () => {
    it('should handle units with mathvariant="normal" attribute', () => {
      const mathML = testUtils.createMathML(
        '<mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('100');
      expect(result.words).toContain('times');
      expect(result.words).toContain('meter');
    });

    it('should handle units with intent=":unit" attribute', () => {
      const mathML = testUtils.createMathML(
        '<mn>50</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">kg</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('50');
      expect(result.words).toContain('times');
      expect(result.words).toContain('kilogram');
    });

    it('should handle complex units with operators', () => {
      const mathML = testUtils.createMathML(
        '<mn>10</mn><mo>&#x2062;</mo><mrow><mi mathvariant="normal" intent=":unit">m</mi><mo>/</mo><msup><mi mathvariant="normal" intent=":unit">s</mi><mn>2</mn></msup></mrow>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('10');
      expect(result.words).toContain('times');
      expect(result.words).toContain('meter');
      expect(result.words).toContain('second');
    });

    it('should handle units without mathvariant attribute (backward compatibility)', () => {
      const mathML = testUtils.createMathML(
        '<mn>25</mn><mo>&#x2062;</mo><mi>cm</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('25');
      expect(result.words).toContain('times');
      expect(result.words).toContain('centimeter');
    });

    it('should handle degree symbol with proper spacing', () => {
      const mathML = testUtils.createMathML(
        '<mn>90</mn><mo>&#x2062;</mo><mi mathvariant="normal">°</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('90');
      expect(result.words).toContain('times');
      expect(result.words).toContain('degrees');
    });
  });

  describe('Number Handling', () => {
    it('should handle decimal numbers properly', () => {
      const mathML = testUtils.createMathML(
        '<mn>3.14</mn>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('3.14');
    });

    it('should handle negative numbers with proper minus sign', () => {
      const mathML = testUtils.createMathML(
        '<mn>−5.2</mn>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('minus');
      expect(result.words).toContain('5.2');
    });

    it('should handle negative numbers with hyphen minus sign', () => {
      const mathML = testUtils.createMathML(
        '<mn>-3.7</mn>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('minus');
      expect(result.words).toContain('3.7');
    });

    it('should handle large numbers with thousand separators', () => {
      const mathML = testUtils.createMathML(
        '<mn>1,000,000</mn>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('1,000,000');
    });

    it('should handle numbers with units and proper spacing', () => {
      const mathML = testUtils.createMathML(
        '<mn>42.5</mn><mo rspace="0.25em">&#x2062;</mo><mi mathvariant="normal" intent=":unit">km</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('42.5');
      expect(result.words).toContain('times');
      expect(result.words).toContain('kilometer');
    });
  });

  describe('Common Unit Mappings', () => {
    it('should handle meter unit', () => {
      const mathML = testUtils.createMathML(
        '<mn>10</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">m</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('10');
      expect(result.words).toContain('times');
      expect(result.words).toContain('meter');
    });

    it('should handle kilogram unit', () => {
      const mathML = testUtils.createMathML(
        '<mn>5</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">kg</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('5');
      expect(result.words).toContain('times');
      expect(result.words).toContain('kilogram');
    });

    it('should handle second unit', () => {
      const mathML = testUtils.createMathML(
        '<mn>30</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">s</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('30');
      expect(result.words).toContain('times');
      expect(result.words).toContain('second');
    });

    it('should handle ampere unit', () => {
      const mathML = testUtils.createMathML(
        '<mn>2</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">A</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('2');
      expect(result.words).toContain('times');
      expect(result.words).toContain('ampere');
    });

    it('should handle kelvin unit', () => {
      const mathML = testUtils.createMathML(
        '<mn>273</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">K</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('273');
      expect(result.words).toContain('times');
      expect(result.words).toContain('kelvin');
    });

    it('should handle mole unit', () => {
      const mathML = testUtils.createMathML(
        '<mn>1</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">mol</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('1');
      expect(result.words).toContain('times');
      expect(result.words).toContain('mole');
    });

    it('should handle candela unit', () => {
      const mathML = testUtils.createMathML(
        '<mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">cd</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('100');
      expect(result.words).toContain('times');
      expect(result.words).toContain('candela');
    });
  });

  describe('Variable vs Unit Context', () => {
    it('should treat "g" as variable when not in unit context', () => {
      const mathML = testUtils.createMathML('<mi>g</mi><mo>(</mo><mi>x</mi><mo>)</mo>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('g');
      expect(result.words).not.toContain('gram');
    });

    it('should treat "g" as gram only when in unit context', () => {
      const mathML = testUtils.createMathML(
        '<mn>5</mn><mo>&#x2062;</mo><mi mathvariant="normal" intent=":unit">g</mi>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('5');
      expect(result.words).toContain('times');
      expect(result.words).toContain('gram');
    });

    it('should treat "m" as variable when not in unit context', () => {
      const mathML = testUtils.createMathML('<mi>m</mi><mo>=</mo><mn>5</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('m');
      expect(result.words).not.toContain('meter');
    });

    it('should treat "s" as variable when not in unit context', () => {
      const mathML = testUtils.createMathML('<mi>s</mi><mo>=</mo><mi>t</mi><mo>+</mo><mn>1</mn>');
      const result = GenerateMath(mathML, { noEquationText: 12 });

      expect(result.success).toBe(true);
      expect(result.words).toContain('s');
      expect(result.words).not.toContain('second');
    });
  });
});
