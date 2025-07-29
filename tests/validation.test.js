const { validateMathML } = require('../validation');

describe('MathML Validation', () => {
  describe('Deprecated Elements Validation', () => {
    it('should reject mfenced elements', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        '<mfenced open="(" close=")"><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deprecated element <mfenced> is not allowed. Use <mo> elements for parentheses instead.');
    });

    it('should reject semantics elements', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        '<semantics><mn>3</mn><mo>+</mo><mn>2</mn></semantics>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deprecated element <semantics> is not allowed unless specifically requested by the Ordering Agency.');
    });

    it('should reject annotation elements', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        '<annotation>3+2</annotation>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deprecated element <annotation> is not allowed unless specifically requested by the Ordering Agency.');
    });

    it('should reject annotation-xml elements', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        '<annotation-xml>3+2</annotation-xml>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deprecated element <annotation-xml> is not allowed unless specifically requested by the Ordering Agency.');
    });

    it('should accept valid MathML without deprecated elements', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Display Attribute Validation', () => {
    it('should accept valid display="block" attribute', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept valid display="inline" attribute', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid display attribute values', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="invalid">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid display attribute value "invalid". Must be "block" or "inline".');
    });

    it('should accept MathML without display attribute (defaults to inline)', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Namespace Validation', () => {
    it('should accept MathML with correct namespace', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject MathML without namespace', () => {
      const mathML = '<math><mn>3</mn><mo>+</mo><mn>2</mn></math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MathML must include xmlns="http://www.w3.org/1998/Math/MathML" namespace declaration.');
    });

    it('should reject MathML with incorrect namespace', () => {
      const mathML = '<math xmlns="http://wrong.namespace.com">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MathML must include xmlns="http://www.w3.org/1998/Math/MathML" namespace declaration.');
    });
  });

  describe('Deprecated Attributes Validation', () => {
    it('should warn about alttext attribute usage', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" alttext="3+2">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('alttext attribute is deprecated. MathML support has improved and this attribute should not be used.');
    });

    it('should warn about altimg attribute usage', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" altimg="image.png">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('altimg attribute is deprecated. MathML support has improved and this attribute should not be used.');
    });

    it('should warn about both deprecated attributes', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" alttext="3+2" altimg="image.png">' +
        '<mn>3</mn><mo>+</mo><mn>2</mn>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings).toContain('alttext attribute is deprecated. MathML support has improved and this attribute should not be used.');
      expect(result.warnings).toContain('altimg attribute is deprecated. MathML support has improved and this attribute should not be used.');
    });
  });

  describe('Multiple Validation Issues', () => {
    it('should report multiple validation errors', () => {
      const mathML = '<math display="invalid">' +
        '<mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('MathML must include xmlns="http://www.w3.org/1998/Math/MathML" namespace declaration.');
      expect(result.errors).toContain('Invalid display attribute value "invalid". Must be "block" or "inline".');
      expect(result.errors).toContain('Deprecated element <mfenced> is not allowed. Use <mo> elements for parentheses instead.');
    });

    it('should report both errors and warnings', () => {
      const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML" alttext="3+2">' +
        '<mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>' +
        '</math>';
      
      const result = validateMathML(mathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deprecated element <mfenced> is not allowed. Use <mo> elements for parentheses instead.');
      expect(result.warnings).toContain('alttext attribute is deprecated. MathML support has improved and this attribute should not be used.');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid XML gracefully', () => {
      const invalidMathML = '<math><mn>3<mn>+<mn>2</math>';
      
      const result = validateMathML(invalidMathML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid XML structure. Please check your MathML syntax.');
    });

    it('should handle empty input', () => {
      const result = validateMathML('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MathML content is required.');
    });

    it('should handle null input', () => {
      const result = validateMathML(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MathML content is required.');
    });
  });
});