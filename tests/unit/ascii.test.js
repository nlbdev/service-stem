const { GenerateAsciiMath } = require('../../conversions/ascii');

describe('ASCII Conversion Module', () => {
  test('should convert basic MathML to ASCII', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('3+2');
  });

  test('should handle fractions', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mn>2</mn></mfrac></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('1/2');
  });

  test('should handle variables', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi><mo>+</mo><mi>y</mi></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('x+y');
  });

  test('should handle subscripts', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>x</mi><mn>1</mn></msub></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('x_1');
  });

  test('should handle superscripts', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mi>x</mi><mn>2</mn></msup></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('x^2');
  });

  test('should handle square roots', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt><mn>4</mn></msqrt></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('sqrt(4)');
  });

  test('should handle parentheses', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mo>(</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>)</mo></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('(3+2)');
  });

  test('should handle minus signs', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>5</mn><mo>-</mo><mn>3</mn></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('5-3');
  });

  test('should handle equals signs', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('3+2=5');
  });

  test('should handle multiplication', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>&times;</mo><mn>4</mn></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('3*4');
  });

  test('should handle division', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>6</mn><mo>&divide;</mo><mn>2</mn></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('6/2');
  });

  test('should handle complex expressions', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('x^2+2x+1');
  });

  test('should handle nested fractions', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mfrac><mn>2</mn><mn>3</mn></mfrac></mfrac></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('1/(2/3)');
  });

  test('should handle mixed subscripts and superscripts', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msubsup><mi>x</mi><mn>1</mn><mn>2</mn></msubsup></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('x_1^2');
  });

  test('should handle square roots with variables', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt><mi>x</mi><mo>+</mo><mn>1</mn></msqrt></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('sqrt(x+1)');
  });

  test('should handle empty MathML gracefully', async () => {
    const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML"></math>';
    
    const result = await GenerateAsciiMath(mathml);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toBe('');
  });
}); 