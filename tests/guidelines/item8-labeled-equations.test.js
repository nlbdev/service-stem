const { GenerateMath } = require('../../conversions/text.js');

describe('Item 8: Labeled Equations Support', () => {
  describe('Basic Labeled Equations', () => {
    it('should handle single labeled equation', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(1.4)</mtext></mtd>' +
            '<mtd><mi>x</mi><mo>+</mo><mi>y</mi></mtd>' +
            '<mtd><mo>=</mo></mtd>' +
            '<mtd><mn>2</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('1.4');
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('y');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('2');
    });

    it('should handle labeled equation with label after expression', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(2.1)</mtext></mtd>' +
            '<mtd><mi>a</mi><mo>+</mo><mi>b</mi><mo>=</mo><mi>c</mi></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('2.1');
      expect(result.words).toContain('a');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('b');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('c');
    });

    it('should handle labeled equation without intent attribute', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd><mtext>(3.5)</mtext></mtd>' +
            '<mtd><mi>x</mi><mo>=</mo><mn>5</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('3.5');
      expect(result.words).toContain('x');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('5');
    });
  });

  describe('Multiple Labeled Equations', () => {
    it('should handle multiple labeled equations in same table', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(1.4)</mtext></mtd>' +
            '<mtd><mi>x</mi><mo>+</mo><mi>y</mi><mo>=</mo><mn>2</mn></mtd>' +
          '</mtr>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(2.7)</mtext></mtd>' +
            '<mtd><mi>x</mi><mo>&#x2212;</mo><mi>y</mi><mo>=</mo><mn>0</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('1.4');
      expect(result.words).toContain('2.7');
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('y');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('2');
      expect(result.words).toContain('minus');
      expect(result.words).toContain('0');
    });

    it('should handle multiple equations with different labels', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(A.1)</mtext></mtd>' +
            '<mtd><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>x</mi><mo>+</mo><mn>1</mn></mtd>' +
          '</mtr>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(B.2)</mtext></mtd>' +
            '<mtd><mi>g</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>x</mi><mo>&#x2212;</mo><mn>1</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('A.1');
      expect(result.words).toContain('B.2');
      expect(result.words).toContain('f');
      expect(result.words).toContain('g');
    });
  });

  describe('Complex Labeled Equations', () => {
    it('should handle labeled equation with fractions', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(4.2)</mtext></mtd>' +
            '<mtd><mfrac><mi>x</mi><mi>y</mi></mfrac><mo>=</mo><mn>3</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('4.2');
      expect(result.words).toContain('fraction');
      expect(result.words).toContain('x');
      expect(result.words).toContain('y');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('3');
    });

    it('should handle labeled equation with subscripts and superscripts', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(5.1)</mtext></mtd>' +
            '<mtd><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('5.1');
      expect(result.words).toContain('capital');
      expect(result.words).toContain('e');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('m');
      expect(result.words).toContain('c');
      expect(result.words).toContain('superscript');
      expect(result.words).toContain('2');
    });

    it('should handle labeled equation with matrices', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(6.1)</mtext></mtd>' +
            '<mtd><mi>A</mi><mo>=</mo><mfenced><mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr></mtable></mfenced></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('6.1');
      expect(result.words).toContain('capital');
      expect(result.words).toContain('a');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('matrix');
    });
  });

  describe('Equation Labels with Different Formats', () => {
    it('should handle numeric equation labels', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(1)</mtext></mtd>' +
            '<mtd><mi>x</mi><mo>=</mo><mn>1</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('1');
    });

    it('should handle alphanumeric equation labels', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(A1)</mtext></mtd>' +
            '<mtd><mi>y</mi><mo>=</mo><mn>2</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('A1');
    });

    it('should handle equation labels with dots', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(1.2.3)</mtext></mtd>' +
            '<mtd><mi>z</mi><mo>=</mo><mn>3</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('1.2.3');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle mtable without labeled equations', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd><mi>x</mi><mo>+</mo><mi>y</mi></mtd>' +
            '<mtd><mo>=</mo></mtd>' +
            '<mtd><mn>2</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('matrix');
      expect(result.words).toContain('x');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('y');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('2');
    });

    it('should handle empty equation label', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext></mtext></mtd>' +
            '<mtd><mi>x</mi><mo>=</mo><mn>1</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('x');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('1');
    });

    it('should handle labeled equation with complex content', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(7.1)</mtext></mtd>' +
            '<mtd><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mfrac><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mrow><mi>x</mi><mo>&#x2212;</mo><mn>1</mn></mrow></mfrac></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('7.1');
      expect(result.words).toContain('f');
      expect(result.words).toContain('x');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('fraction');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy mtable without intent attributes', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd><mtext>(8.1)</mtext></mtd>' +
            '<mtd><mi>a</mi><mo>+</mo><mi>b</mi><mo>=</mo><mi>c</mi></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('8.1');
      expect(result.words).toContain('a');
      expect(result.words).toContain('plus');
      expect(result.words).toContain('b');
      expect(result.words).toContain('equals');
      expect(result.words).toContain('c');
    });

    it('should handle mixed labeled and unlabeled equations', () => {
      const mathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(9.1)</mtext></mtd>' +
            '<mtd><mi>x</mi><mo>=</mo><mn>1</mn></mtd>' +
          '</mtr>' +
          '<mtr>' +
            '<mtd><mi>y</mi><mo>=</mo><mn>2</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      const result = GenerateMath(mathML, { noEquationText: 12 });
      
      expect(result.success).toBe(true);
      expect(result.words).toContain('equation');
      expect(result.words).toContain('label');
      expect(result.words).toContain('9.1');
      expect(result.words).toContain('x');
      expect(result.words).toContain('y');
    });
  });

  describe('ALIX Score Impact', () => {
    it('should calculate appropriate ALIX scores for labeled equations', () => {
      const simpleMathML = testUtils.createMathML('<mi>x</mi><mo>+</mo><mi>y</mi><mo>=</mo><mn>2</mn>');
      const labeledMathML = testUtils.createMathML(
        '<mtable>' +
          '<mtr>' +
            '<mtd intent=":equation-label"><mtext>(1.1)</mtext></mtd>' +
            '<mtd><mi>x</mi><mo>+</mo><mi>y</mi><mo>=</mo><mn>2</mn></mtd>' +
          '</mtr>' +
        '</mtable>'
      );
      
      const simpleResult = GenerateMath(simpleMathML, { noEquationText: 12 });
      const labeledResult = GenerateMath(labeledMathML, { noEquationText: 12 });
      
      expect(simpleResult.alix).toBeGreaterThan(0);
      expect(labeledResult.alix).toBeGreaterThan(0);
      expect(typeof simpleResult.alix).toBe('number');
      expect(typeof labeledResult.alix).toBe('number');
    });
  });
});