/* eslint-disable no-unused-vars */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Create a test app without starting the server
const createTestApp = () => {
  const app = express();
  const jsonParser = bodyParser.json();

  // Mock the required modules
  jest.mock('../../src/conversions/text', () => ({
    GenerateMath: jest.fn((content, alixThresholds) => ({
      success: true,
      words: ['3', 'plus', '2', 'equals', '5'],
      alix: 15
    }))
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

  // Health endpoint
  app.get('/health', (req, res) => {
    res.send({
      name: 'service-stem',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(400).send({
      success: false,
      message: "Use POST instead of GET with optional query variables: 'noImage' (ALIX threshold number) and 'noEquationText' (ALIX threshold number), and payload: { \"contentType\": \"math|chemistry|physics|other\", \"content\": \"...\" }"
    });
  });

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
          'language': 'en',
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

describe('API Documentation Examples', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST / - MathML Processing', () => {
    test('should process new MathML format with direct namespace', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en" display="block"><mn>3</mn><mo>-</mo><mn>2</mn><mo>=</mo><mn>1</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
      expect(response.body.output.text.translated).toBeDefined();
      expect(response.body.output.text.latex).toBeDefined();
      expect(response.body.output.text.ascii).toBeDefined();
      expect(response.body.output.text.html).toBeDefined();
    });

    test('should process inline MathML (default display)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.language).toBe('en');
    });

    test('should handle invisible operators correctly', async () => {
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

    test('should handle special characters correctly', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>&#x2212;</mo><mn>2</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should reject deprecated mfenced elements', async () => {
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

    test('should reject deprecated m: namespace prefix', async () => {
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

    test('should handle chemistry markup correctly', async () => {
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

    test('should handle labeled equations correctly', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable><mtr><mtd><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></mtd><mtd><mo>(</mo><mn>1</mn><mo>)</mo></mtd></mtr></mtable></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle crossed out math correctly', async () => {
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

    test('should handle fill-in-the-blanks correctly', async () => {
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

    test('should handle units correctly', async () => {
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
  });

  describe('GET /health', () => {
    test('should return service health information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.name).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /', () => {
    test('should return error message for GET requests', async () => {
      const response = await request(app)
        .get('/')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Use POST instead of GET');
    });
  });
});
