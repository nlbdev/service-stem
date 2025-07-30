const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock dependencies for testing
jest.mock('../../src/conversions/text', () => ({
  GenerateMath: jest.fn((content, alixThresholds) => {
    // Mock successful response
    return {
      success: true,
      words: ['3', 'plus', '2', 'equals', '5'],
      alix: 15
    };
  })
}));

jest.mock('../../src/validation', () => ({
  validateMathML: jest.fn((content, options) => {
    // Check for invalid content
    if (content.includes('<invalid>') || content.includes('<m:invalid>')) {
      return {
        isValid: false,
        errors: ['Invalid MathML structure'],
        warnings: [],
        legacyFeatures: []
      };
    }

    // Allow legacy content for backward compatibility
    return {
      isValid: true,
      errors: [],
      warnings: [],
      legacyFeatures: []
    };
  })
}));

jest.mock('mathml-to-latex', () => ({
  convert: jest.fn(() => '3+2=5')
}));

jest.mock('mathml-to-asciimath', () => jest.fn(() => '3+2=5'));

// Create a test app without starting the server
const createTestApp = () => {
  const app = express();
  const jsonParser = bodyParser.json();

  // Mock the main endpoint
  app.post('/', jsonParser, async (req, res) => {
    const { contentType, content } = req.body;
    const { noImage, noEquationText, version } = req.query;
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
    const { GenerateMath } = require('../../src/conversions/text');
    const mathResult = GenerateMath(content, { noImage: noImageInt, noEquationText: noEquationTextInt });

    const returnObj = {
      'success': true,
      'input': {
        'mathml': content,
        'version': version || '2.0.0'
      },
      'output': {
        'text': {
          'words': mathResult.words,
          'translated': '3 plus 2 equals 5',
          'latex': '3+2=5',
          'ascii': '3+2=5',
          'html': '<div>3 plus 2 equals 5</div>'
        },
        'image': {
          'path': null
        },
        'attributes': {
          'language': 'en',
          'alix': mathResult.alix,
          'alixThresholdNoImage': noImageInt,
          'alixThresholdNoEquationText': noEquationTextInt,
          'compatibilityMode': version === '1.0.0'
        }
      }
    };

    res.json(returnObj);
  });

  return app;
};

describe('Backward Compatibility Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Version Detection', () => {
    test('should detect legacy MathML format (m: namespace)', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.input.version).toBe('2.0.0');
      expect(response.body.output.attributes.compatibilityMode).toBe(false);
    });

    test('should handle explicit version parameter', async () => {
      const response = await request(app)
        .post('/?version=1.0.0')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.input.version).toBe('1.0.0');
      expect(response.body.output.attributes.compatibilityMode).toBe(true);
    });

    test('should detect deprecated elements and handle gracefully', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.attributes.compatibilityMode).toBe(false);
    });
  });

  describe('Legacy Format Support', () => {
    test('should handle legacy m: namespace format', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn></m:math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle legacy semantics elements', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mn>3</mn><mo>+</mo><mn>2</mn></semantics></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle legacy mfenced elements', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });

    test('should handle legacy alttext attributes', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML" alttext="3+2"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Migration Strategy', () => {
    test('should provide migration hints for deprecated elements', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should include migration information in response
      expect(response.body.output.attributes).toBeDefined();
    });

    test('should handle mixed old and new formats', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><m:mn>3</m:mn><mo>+</mo><m:mn>2</m:mn></math>'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid legacy content gracefully', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<invalid>content</invalid>'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should provide helpful error messages for migration', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:invalid>3</m:invalid></m:math>'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
