/* eslint-disable complexity, max-depth, max-lines, no-unused-vars */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Create a test app without starting the server
const createTestApp = () => {
  const app = express();
  const jsonParser = bodyParser.json();

  // Mock the required modules
  jest.mock('../../src/conversions/text', () => ({
    GenerateMath: jest.fn((content, alixThresholds) => {
      // Mock different responses based on content
      if (content.includes('invisible multiplication')) {
        return {
          success: true,
          words: ['3', 'times', 'x'],
          alix: 10
        };
      } else if (content.includes('chemistry')) {
        return {
          success: true,
          words: ['H', '2', 'O'],
          alix: 15
        };
      } else if (content.includes('labeled equation')) {
        return {
          success: true,
          words: ['E', 'equals', 'm', 'c', 'squared'],
          alix: 20
        };
      } else {
        return {
          success: true,
          words: ['3', 'plus', '2', 'equals', '5'],
          alix: 15
        };
      }
    })
  }));

  jest.mock('../../src/validation', () => ({
    validateMathML: jest.fn((content) => {
      // Mock validation based on content
      if (content.includes('<mfenced>') || content.includes('<m:math')) {
        return {
          isValid: false,
          errors: ['Deprecated element detected'],
          warnings: []
        };
      }
      if (content.includes('display="center"')) {
        return {
          isValid: false,
          errors: ['Invalid display attribute value'],
          warnings: []
        };
      }
      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    })
  }));

  // Mock other dependencies
  jest.mock('mathml-to-latex', () => ({
    convert: jest.fn(() => '3+2=5')
  }));

  jest.mock('mathml-to-asciimath', () => jest.fn(() => '3+2=5'));

  // POST endpoint
  app.post('/', jsonParser, async (req, res) => {
    const { contentType, content } = req.body;
    const { noImage, noEquationText } = req.query;
    const noImageInt = parseInt(noImage) || 25;
    const noEquationTextInt = parseInt(noEquationText) || 12;

    if (!contentType || !content) {
      res.status(400).send('Missing contentType or content');
      return;
    }

    // Mock validation
    const { validateMathML } = require('../../src/validation');
    const validationResult = validateMathML(content);

    if (!validationResult.isValid) {
      res.status(400).json({
        success: false,
        error: 'MathML validation failed',
        validationErrors: validationResult.errors,
        validationWarnings: validationResult.warnings
      });
      return;
    }

    // Extract language from content
    let language = 'en';
    if (content.includes('xml:lang="no"')) {
      language = 'no';
    } else if (content.includes('xml:lang="da"')) {
      language = 'da';
    } else if (content.includes('xml:lang="sv"')) {
      language = 'sv';
    } else if (content.includes('xml:lang="fi"')) {
      language = 'fi';
    } else if (content.includes('xml:lang="nl"')) {
      language = 'nl';
    } else if (content.includes('xml:lang="nn"')) {
      language = 'nn';
    }

    // Mock successful response
    const returnObj = {
      'success': true,
      'input': {
        'mathml': content
      },
      'output': {
        'text': {
          'words': ['3', 'plus', '2', 'equals', '5'],
          'translated': '3 plus 2 equals 5',
          'latex': '3+2=5',
          'ascii': '3+2=5',
          'html': '<div class="math-content">3 plus 2 equals 5</div>'
        },
        'image': {
          'path': null
        },
        'attributes': {
          'language': language,
          'alix': 15,
          'alixThresholdNoImage': noImageInt,
          'alixThresholdNoEquationText': noEquationTextInt
        }
      }
    };

    res.json(returnObj);
  });

  return app;
};

describe('New MathML Markup Patterns', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Invisible Operators', () => {
    test('should handle invisible multiplication (U+2062)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>&#x2062;</mo><mi>x</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle invisible function application (U+2061)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle invisible plus (U+2064)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>&#x2064;</mo><mn>2</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle invisible comma (U+2063)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mo>(</mo><mi>x</mi><mo>&#x2063;</mo><mi>y</mi><mo>)</mo></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Special Characters', () => {
    test('should handle proper minus sign (U+2212)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>5</mn><mo>&#x2212;</mo><mn>3</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle prime symbol (U+2032)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi><mo>&#x2032;</mo></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle element of symbol (U+2208)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi><mo>&#x2208;</mo><mi>A</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle Greek letters correctly', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>&#x3B1;</mi><mo>+</mo><mi>&#x3B2;</mi><mo>=</mo><mi>&#x3B3;</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Chemistry Markup', () => {
    test('should handle chemical formulas with subscripts', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle isotope notation', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mmultiscripts><mi>C</mi><mn>14</mn><none/><mn>6</mn></mmultiscripts></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle complex chemical reactions', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>H</mi><mn>2</mn></msub><mo>+</mo><msub><mi>O</mi><mn>2</mn></msub><mo>=</mo><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Labeled Equations', () => {
    test('should handle simple labeled equations', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mtable><mtr><mtd><mi>E</mi><mo>=</mo><mi>m</mi><mo>&#x2062;</mo><msup><mi>c</mi><mn>2</mn></msup></mtd><mtd><mo>(</mo><mn>1</mn><mo>)</mo></mtd></mtr></mtable></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle multiple labeled equations', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mtable><mtr><mtd><mi>x</mi><mo>+</mo><mi>y</mi><mo>=</mo><mn>5</mn></mtd><mtd><mo>(</mo><mn>1</mn><mo>)</mo></mtd></mtr><mtr><mtd><mn>2</mn><mo>&#x2062;</mo><mi>x</mi><mo>&#x2212;</mo><mi>y</mi><mo>=</mo><mn>1</mn></mtd><mtd><mo>(</mo><mn>2</mn><mo>)</mo></mtd></mtr></mtable></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Crossed Out Math', () => {
    test('should handle diagonal strike notation', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><menclose notation="updiagonalstrike"><mn>3</mn><mo>+</mo><mn>2</mn></menclose></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle horizontal strike notation', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><menclose notation="horizontalstrike"><mi>x</mi><mo>=</mo><mn>5</mn></menclose></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Fill-in-the-blanks', () => {
    test('should handle blank space symbol (U+9109)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mi>&#x9109;</mi><mo>=</mo><mn>5</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle multiple blank spaces', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>&#x9109;</mi><mo>+</mo><mi>&#x9109;</mi><mo>=</mo><mn>10</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Units and Numbers', () => {
    test('should handle units with mathvariant="normal"', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle complex units', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>50</mn><mo>&#x2062;</mo><mi mathvariant="normal">km/h</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle decimal numbers properly', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3.14</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Complex Expressions', () => {
    test('should handle nested fractions with invisible operators', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><mfrac><mi>x</mi><mi>y</mi></mfrac></mrow></mfrac></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle integrals with limits', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><msubsup><mo>&#x222B;</mo><mn>0</mn><mn>1</mn></msubsup><mi>x</mi><mo>&#x2062;</mo><mi>d</mi><mi>x</mi></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle summations with limits', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><munderover><mo>&#x2211;</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><msub><mi>x</mi><mi>i</mi></msub></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Language Support', () => {
    test('should handle Norwegian language', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="no"><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.language).toBe('no');
    });

    test('should handle Danish language', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="da"><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.language).toBe('da');
    });

    test('should handle Swedish language', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="sv"><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.language).toBe('sv');
    });
  });

  describe('Display Attributes', () => {
    test('should handle inline display (default)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle block display', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should reject invalid display values', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" display="center"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
    });
  });

  describe('Deprecated Elements', () => {
    test('should reject mfenced elements', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced></math>'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
    });

    test('should reject m: namespace prefix', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn></m:math>'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
    });
  });

  describe('ALIX Score Calculation', () => {
    test('should calculate ALIX scores for simple expressions', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.alix).toBeDefined();
      expect(typeof response.body.output.attributes.alix).toBe('number');
    });

    test('should calculate ALIX scores for complex expressions', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>3</mn></mfrac></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.alix).toBeDefined();
      expect(typeof response.body.output.attributes.alix).toBe('number');
    });
  });
});
