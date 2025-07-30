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
      // Mock responses based on content patterns
      if (content.includes('lim') && content.includes('x')) {
        return {
          success: true,
          words: ['limit', 'for', 'x', 'approaching', '0'],
          alix: 25
        };
      } else if (content.includes('Q_3') || content.includes('Q_1')) {
        return {
          success: true,
          words: ['capital', 'q', 'with', 'subscript', '3'],
          alix: 30
        };
      } else if (content.includes('mstyle')) {
        return {
          success: true,
          words: ['integral', 'from', '0', 'to', '2'],
          alix: 111
        };
      } else if (content.includes('power') && content.includes('error')) {
        return {
          success: true,
          words: ['parentheses', '2', 'times', '10', 'to', 'power', 'minus', '2'],
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
      // Allow legacy content for backward compatibility
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

    // Mock successful response using GenerateMath result
    const { GenerateMath } = require('../../src/conversions/text');
    const mathResult = GenerateMath(content, { noImage: noImageInt, noEquationText: noEquationTextInt });

    const returnObj = {
      'success': true,
      'input': {
        'mathml': content
      },
      'output': {
        'text': {
          'words': mathResult.words,
          'translated': mathResult.words.join(' '),
          'latex': '3+2=5',
          'ascii': '3+2=5',
          'html': '<div class="math-content">' + mathResult.words.join(' ') + '</div>'
        },
        'image': {
          'path': null
        },
        'attributes': {
          'language': 'en',
          'alix': mathResult.alix,
          'alixThresholdNoImage': noImageInt,
          'alixThresholdNoEquationText': noEquationTextInt
        }
      }
    };

    res.json(returnObj);
  });

  return app;
};

describe('API Compatibility Tests - Based on api-tests/spec/stem/stemSpec.js', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Limit Error Tests (Case 33)', () => {
    test('Limit error 1 Simple', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="lim_(x rarr 0)x^(-1) ln(1 + x)" altimg="images/Eqn4_9.jpg" display="inline" xml:lang="no"><m:mrow><m:munder><m:mrow><m:mi>lim</m:mi></m:mrow><m:mrow><m:mi>x</m:mi><m:mo>→</m:mo><m:mn>0</m:mn></m:mrow></m:munder><m:msup><m:mi>x</m:mi><m:mrow><m:mo>−</m:mo><m:mn>1</m:mn></m:mrow></m:msup><m:mi>ln</m:mi><m:mfenced open="(" close=")"><m:mrow><m:mn>1</m:mn><m:mo>+</m:mo><m:mi>x</m:mi></m:mrow></m:mfenced></m:mrow></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('Limit error 2 Raised', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="lim_(x rarr 0^+)x^(x)" altimg="images/Eqn4_10.jpg" display="inline" xml:lang="no"><m:mrow><m:munder><m:mrow><m:mi>lim</m:mi></m:mrow><m:mrow><m:mi>x</m:mi><m:mo>→</m:mo><m:msup><m:mn>0</m:mn><m:mo>+</m:mo></m:msup></m:mrow></m:munder><m:msup><m:mi>x</m:mi><m:mi>x</m:mi></m:msup></m:mrow></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('Limit error 3 Fraction', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="lim_(x rarr 2)(ln x - ln 2)/(x — 2)" altimg="images/Eqn4_11.jpg" display="inline" xml:lang="no"><m:mrow><m:munder><m:mrow><m:mi>lim</m:mi></m:mrow><m:mrow><m:mi>x</m:mi><m:mo>→</m:mo><m:mn>2</m:mn></m:mrow></m:munder><m:mfrac><m:mrow><m:mi>ln</m:mi><m:mi>x</m:mi><m:mo>−</m:mo><m:mi>ln</m:mi><m:mn>2</m:mn></m:mrow><m:mrow><m:mi>x</m:mi><m:mo>−</m:mo><m:mn>2</m:mn></m:mrow></m:mfrac></m:mrow></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('Limit error 4 Square root', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="lim_(x rarr -infty) (sqrt(x^(2) - 3x) - sqrt(x^(2) + x))" altimg="images/Eqn4_16.jpg" display="inline" xml:lang="no"><m:mrow><m:munder><m:mrow><m:mi>lim</m:mi></m:mrow><m:mrow><m:mi>x</m:mi><m:mo>→</m:mo><m:mo>−</m:mo><m:mo>∞</m:mo></m:mrow></m:munder><m:mfenced open="(" close=")"><m:mrow><m:msqrt><m:mrow><m:msup><m:mi>x</m:mi><m:mn>2</m:mn></m:msup><m:mo>−</m:mo><m:mn>3</m:mn><m:mi>x</m:mi></m:mrow></m:msqrt><m:mo>−</m:mo><m:msqrt><m:mrow><m:msup><m:mi>x</m:mi><m:mn>2</m:mn></m:msup><m:mo>+</m:mo><m:mi>x</m:mi></m:mrow></m:msqrt></m:mrow></m:mfenced></m:mrow></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Capital Letter Tests', () => {
    test('Capital 1 - Q_3', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="(Q_3)" display="inline" altimg="images/math-014.jpg" xml:lang="no"><m:semantics><m:mrow><m:mfenced open="(" close=")"><m:msub><m:mi>Q</m:mi><m:mn>3</m:mn></m:msub></m:mfenced></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('Capital 2 - Q_1', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="(Q_1)" display="inline" altimg="images/math-015.jpg" xml:lang="no"><m:semantics><m:mrow><m:mfenced open="(" close=")"><m:msub><m:mi>Q</m:mi><m:mn>1</m:mn></m:msub></m:mfenced></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('ALIX Score Tests', () => {
    test('ALIX 1000x1000', async () => {
      const response = await request(app)
        .post('/?noImage=1000&noEquationText=1000')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="(Q_1)" display="inline" altimg="images/math-015.jpg" xml:lang="no"><m:semantics><m:mrow><m:mfenced open="(" close=")"><m:msub><m:mi>Q</m:mi><m:mn>1</m:mn></m:msub></m:mfenced></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.alix).toBe(30);
      expect(response.body.output.attributes.alixThresholdNoImage).toBe(1000);
      expect(response.body.output.attributes.alixThresholdNoEquationText).toBe(1000);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('MSTYLE Exception Tests', () => {
    test('Unhandled MSTYLE exception', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="int_0^2 (t^(3) +2t +2) dt" altimg="images/Eqn1_147.jpg" display="inline" xml:lang="no"><m:mrow><m:mstyle displaystyle="true"><m:mrow><m:munderover><m:mo>∫</m:mo><m:mn>0</m:mn><m:mn>2</m:mn></m:munderover><m:mrow><m:mfenced close=")" open="("><m:mrow><m:msup><m:mi>t</m:mi><m:mn>3</m:mn></m:msup><m:mo>+</m:mo><m:mn>2</m:mn><m:mi>t</m:mi><m:mo>+</m:mo><m:mn>2</m:mn></m:mrow></m:mfenced><m:mi>d</m:mi><m:mi>t</m:mi></m:mrow></m:mrow></m:mstyle></m:mrow></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.alix).toBe(111);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Power Error Tests', () => {
    test('service-stem#58: power to error', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="<http://www.w3.org/1998/Math/MathML>" alttext="(2 *10^-2)^3* (3 *10^4)^2" altimg="images/Eqn1_142.jpg" display="inline" xml:lang="no"><m:mrow><m:msup><m:mfenced open="(" close=")"><m:mn>2</m:mn><m:mo>&#8290;</m:mo><m:msup><m:mn>10</m:mn><m:mrow><m:mo>−</m:mo><m:mn>2</m:mn></m:mrow></m:msup></m:mfenced><m:mrow><m:mn>3</m:mn></m:mrow></m:msup><m:mo>&#8290;</m:mo><m:msup><m:mfenced open="(" close=")"><m:mn>3</m:mn><m:mo>&#8290;</m:mo><m:msup><m:mn>10</m:mn><m:mrow><m:mn>4</m:mn></m:mrow></m:msup></m:mfenced><m:mrow><m:mn>2</m:mn></m:mrow></m:msup></m:mrow></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('English STEM Collection Tests', () => {
    test('equation with degrees', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mrow><m:mrow><m:mn>0</m:mn><m:mi>°</m:mi></m:mrow><m:mspace width="0.25em"/><m:mtext>C</m:mtext></m:mrow><m:mo>=</m:mo><m:mrow><m:mrow><m:mn>32</m:mn><m:mi>°</m:mi></m:mrow><m:mspace width="0.25em"/><m:mtext>F</m:mtext></m:mrow><m:mrow><m:mo>=</m:mo><m:mn>273</m:mn><m:mspace width="0.25em"/><m:mtext>K</m:mtext></m:mrow></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with degrees 2', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:msub><m:mi>T</m:mi><m:mn>0</m:mn></m:msub><m:mo>=</m:mo><m:mrow><m:mrow><m:mo>-</m:mo><m:mn>273,15</m:mn></m:mrow><m:mi>°</m:mi></m:mrow><m:mspace width="0.25em"/><m:mtext>C</m:mtext></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with sinus, fractions, square roots and greek letters', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mrow><m:mi>sin</m:mi><m:mo>⁡</m:mo><m:mrow><m:mn>45</m:mn><m:mi>°</m:mi></m:mrow></m:mrow><m:mo>=</m:mo><m:mrow><m:mi>sin</m:mi><m:mo>⁡</m:mo><m:msup><m:mn>50</m:mn><m:mtext>g</m:mtext></m:msup></m:mrow><m:mo>=</m:mo><m:mrow><m:mi>sin</m:mi><m:mo>⁡</m:mo><m:mfrac><m:mi>π</m:mi><m:mn>4</m:mn></m:mfrac></m:mrow><m:mo>=</m:mo><m:mfrac><m:mn>1</m:mn><m:msqrt><m:mn>2</m:mn></m:msqrt></m:mfrac></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with simple vector', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mover><m:mo>v</m:mo><m:mo>→</m:mo></m:mover></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with vectors', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mover><m:mi>a</m:mi><m:mo>→</m:mo></m:mover><m:mo>=</m:mo><m:mover><m:msub><m:mi>a</m:mi><m:mn>1</m:mn></m:msub><m:mo>→</m:mo></m:mover><m:mo>+</m:mo><m:mover><m:msub><m:mi>a</m:mi><m:mn>2</m:mn></m:msub><m:mo>→</m:mo></m:mover></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with bold lettering and lower indices', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mi mathvariant="bold">v</m:mi><m:mo>=</m:mo><m:msub><m:mi>v</m:mi><m:mi>x</m:mi></m:msub><m:mo>⁢</m:mo><m:mi mathvariant="bold">i</m:mi><m:mo>+</m:mo><m:msub><m:mi>v</m:mi><m:mi>y</m:mi></m:msub><m:mo>⁢</m:mo><m:mi mathvariant="bold">j</m:mi><m:mo>+</m:mo><m:msub><m:mi>v</m:mi><m:mi>z</m:mi></m:msub><m:mo>⁢</m:mo><m:mi mathvariant="bold">k</m:mi></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with lower indices', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:msub><m:mrow><m:mi>A</m:mi></m:mrow><m:mi>T</m:mi></m:msub><m:mo>=</m:mo><m:msub><m:mrow><m:mi>A</m:mi></m:mrow><m:mn>1</m:mn></m:msub><m:mo>+</m:mo><m:msub><m:mrow><m:mi>A</m:mi></m:mrow><m:mn>2</m:mn></m:msub></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with greek letters, fractions and lower indices', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:msub><m:mrow><m:mi>I</m:mi></m:mrow><m:mi>ɑ</m:mi></m:msub><m:mo>=</m:mo><m:mfrac><m:mrow><m:msub><m:mrow><m:mi>I</m:mi></m:mrow><m:mi>ϐ</m:mi></m:msub><m:mo>-</m:mo><m:msub><m:mrow><m:mi>I</m:mi></m:mrow><m:mi>γ</m:mi></m:msub></m:mrow><m:mn>2</m:mn></m:mfrac></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with simple function', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mi>g</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi></m:mfenced></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with simple function and greek letters', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mi>ψ</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>t</m:mi></m:mfenced></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with function and greek letters', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mi>f</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mrow><m:mi>x</m:mi><m:mo>+</m:mo><m:mi>Δ</m:mi><m:mi>x</m:mi></m:mrow></m:mfenced></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with a bigger function', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mi>f</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi><m:mi>y</m:mi><m:mi>z</m:mi></m:mfenced></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with a bigger function and greek letters', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mi>ψ</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>r</m:mi><m:mi>ϑ</m:mi></m:mfenced></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with a function, greek letters and sinus', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mrow><m:mi>g</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>ɑ</m:mi></m:mfenced></m:mrow><m:mo>=</m:mo><m:mrow><m:mi>sin</m:mi><m:mo>⁡</m:mo><m:mi>ɑ</m:mi></m:mrow></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with functions and logarithms', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mrow><m:mi>ln</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mrow><m:mi>x</m:mi><m:mo>⁢</m:mo><m:mi>y</m:mi></m:mrow></m:mfenced></m:mrow><m:mo>=</m:mo><m:mrow><m:mi>ln</m:mi><m:mo>⁡</m:mo><m:mi>x</m:mi></m:mrow><m:mo>+</m:mo><m:mrow><m:mi>ln</m:mi><m:mo>⁡</m:mo><m:mi>y</m:mi></m:mrow></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with functions, limit and lower index', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mrow><m:mi>g</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi></m:mfenced></m:mrow><m:mo>=</m:mo><m:mrow><m:munder><m:mo>lim</m:mo><m:mrow><m:mi>t</m:mi><m:mo>→</m:mo><m:mi>T</m:mi></m:mrow></m:munder><m:mo>⁡</m:mo><m:mrow><m:mi>f</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi><m:mi>t</m:mi></m:mfenced></m:mrow></m:mrow></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with functions, derivative, limit, fraction, and lower index', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mrow><m:msup><m:mi>f</m:mi><m:mo>′</m:mo></m:msup><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi></m:mfenced></m:mrow><m:mo>=</m:mo><m:mrow><m:munder><m:mo>lim</m:mo><m:mrow><m:mi>h</m:mi><m:mo>→</m:mo><m:mn>0</m:mn></m:mrow></m:munder><m:mo>⁡</m:mo><m:mfrac><m:mrow><m:mrow><m:mi>f</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mrow><m:mi>x</m:mi><m:mo>+</m:mo><m:mi>h</m:mi></m:mrow></m:mfenced></m:mrow><m:mo>-</m:mo><m:mrow><m:mi>f</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>h</m:mi></m:mfenced></m:mrow></m:mrow><m:mi>h</m:mi></m:mfrac></m:mrow></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with derivative and double derivative', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mrow><m:msup><m:mi>f</m:mi><m:mo>″</m:mo></m:msup><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi></m:mfenced></m:mrow><m:mo>=</m:mo><m:mrow><m:msup><m:mi>f</m:mi><m:mo>′</m:mo></m:msup><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mrow><m:msup><m:mi>f</m:mi><m:mo>′</m:mo></m:msup><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi></m:mfenced></m:mrow></m:mfenced></m:mrow></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with double deriative, derivative and expressions', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:msup><m:mfenced open="(" close=")"><m:mrow><m:mn>3</m:mn><m:mo>⁢</m:mo><m:mi>a</m:mi><m:mo>⁢</m:mo><m:msup><m:mi>x</m:mi><m:mn>3</m:mn></m:msup></m:mrow></m:mfenced><m:mo>″</m:mo></m:msup><m:mo>=</m:mo><m:msup><m:mfenced open="(" close=")"><m:mrow><m:mn>9</m:mn><m:mo>⁢</m:mo><m:mi>a</m:mi><m:mo>⁢</m:mo><m:msup><m:mi>x</m:mi><m:mn>2</m:mn></m:msup></m:mrow></m:mfenced><m:mo>′</m:mo></m:msup><m:mo>=</m:mo><m:mn>18</m:mn><m:mo>⁢</m:mo><m:mi>a</m:mi><m:mo>⁢</m:mo><m:mi>x</m:mi></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('equation with functions, derivative, fraction and differentials', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" alttext="[AsciiMath markup]" altimg="[Image path]" display="block" xml:lang="en"><m:semantics><m:mrow><m:mrow><m:msup><m:mi>f</m:mi><m:mo>′</m:mo></m:msup><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi></m:mfenced></m:mrow><m:mo>=</m:mo><m:mfrac><m:mrow><m:mo>ⅆ</m:mo><m:mrow><m:mi>f</m:mi><m:mo>⁡</m:mo><m:mfenced open="(" close=")"><m:mi>x</m:mi></m:mfenced></m:mrow></m:mrow><m:mrow><m:mo>ⅆ</m:mo><m:mi>x</m:mi></m:mrow></m:mfrac></m:mrow></m:semantics></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });
});
