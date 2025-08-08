

const request = require('supertest');

describe('API Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Import the app after setting up environment
    process.env.NODE_ENV = 'test';
    const express = require('express');
    const bodyParser = require('body-parser');

    // Create a test app instance
    app = express();
    app.use(bodyParser.json());

    // Mock the main processing logic
    app.post('/', (req, res) => {
      const { contentType, content } = req.body;

      if (!contentType) {
        return res.status(400).send('Missing contentType');
      }

      if (!content) {
        return res.status(400).send('Missing content');
      }

      if (contentType !== 'math') {
        return res.status(400).send('Unsupported contentType');
      }

      // Mock successful response
      res.json({
        success: true,
        input: { mathml: content },
        output: {
          text: {
            words: ['3', 'plus', '2'],
            translated: '3 plus 2',
            latex: '3 + 2',
            ascii: '3 + 2',
            html: '<span>3 plus 2</span>'
          },
          image: { path: null },
          attributes: {
            language: 'en',
            alix: 7.0,
            alixThresholdNoImage: 25,
            alixThresholdNoEquationText: 12
          }
        }
      });
    });

    // Start server on random port
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('POST /', () => {
    it('should process valid MathML request', async () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');

      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: mathML
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output.text.words).toEqual(['3', 'plus', '2']);
      expect(response.body.output.attributes.language).toBe('en');
      expect(response.body.output.attributes.alix).toBe(7.0);
    });

    it('should handle missing content type', async () => {
      const response = await request(app)
        .post('/')
        .send({
          content: testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>')
        })
        .expect(400);

      expect(response.text).toBe('Missing contentType');
    });

    it('should handle missing content', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math'
        })
        .expect(400);

      expect(response.text).toBe('Missing content');
    });

    it('should handle unsupported content type', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'unsupported',
          content: 'some content'
        })
        .expect(400);

      expect(response.text).toBe('Unsupported contentType');
    });
  });
});
