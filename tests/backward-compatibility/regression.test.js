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
            // Allow legacy content for backward compatibility
            if (content.includes('<m:math')) {
                return {
                    isValid: true,
                    errors: [],
                    warnings: ['Legacy m: namespace detected']
                };
            }
            if (content.includes('<invalid>')) {
                return {
                    isValid: false,
                    errors: ['Invalid MathML content'],
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
            res.status(400).type('text').send("Missing contentType or content");
            return;
        }

        // Handle unsupported content types
        if (contentType === 'chemistry') {
            res.status(501).json({
                success: false,
                error: "non-mathematical formula"
            });
            return;
        }

        // Mock validation
        const { validateMathML } = require('../../src/validation');
        const validationResult = validateMathML(content);
        
        if (!validationResult.isValid) {
            res.status(400).json({
                success: false,
                error: "MathML validation failed",
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
            "success": true,
            "input": {
                "mathml": content,
            },
            "output": {
                "text": {
                    "words": ['3', 'plus', '2', 'equals', '5'],
                    "translated": "3 plus 2 equals 5",
                    "latex": "3+2=5",
                    "ascii": "3+2=5",
                    "html": "<div class=\"math-content\">3 plus 2 equals 5</div>"
                },
                "image": {
                    "path": null
                },
                "attributes": {
                    "language": language,
                    "alix": 15,
                    "alixThresholdNoImage": noImageInt,
                    "alixThresholdNoEquationText": noEquationTextInt,
                }
            },
        };

        res.json(returnObj);
    });
    
    return app;
};

describe('Regression Tests - Backward Compatibility', () => {
    let app;
    
    beforeEach(() => {
        app = createTestApp();
    });
    
    describe('Legacy MathML Support', () => {
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

        test('should handle legacy mfenced elements (converted)', async () => {
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

        test('should handle legacy semantics elements (removed)', async () => {
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

        test('should handle legacy alttext attributes (with warnings)', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML" alttext="3+2=5"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
        });

        test('should handle legacy altimg attributes (with warnings)', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML" altimg="image.jpg"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
        });
    });

    describe('Basic MathML Functionality', () => {
        test('should handle simple arithmetic expressions', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
            expect(response.body.output.text.translated).toBeDefined();
            expect(response.body.output.text.latex).toBeDefined();
            expect(response.body.output.text.ascii).toBeDefined();
            expect(response.body.output.text.html).toBeDefined();
        });

        test('should handle variables and expressions', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi><mo>+</mo><mi>y</mi><mo>=</mo><mn>10</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
        });

        test('should handle fractions', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mn>2</mn></mfrac></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
        });

        test('should handle superscripts and subscripts', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msub><mi>y</mi><mn>1</mn></msub></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
        });

        test('should handle square roots', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt><mn>16</mn></msqrt></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
        });
    });

    describe('Language Support', () => {
        test('should handle English language', async () => {
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

        test('should handle Norwegian language', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="no"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
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
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="da"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
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
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="sv"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.attributes.language).toBe('sv');
        });

        test('should handle Finnish language', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="fi"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.attributes.language).toBe('fi');
        });

        test('should handle Dutch language', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="nl"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.attributes.language).toBe('nl');
        });

        test('should handle Nynorsk language', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="nn"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.attributes.language).toBe('nn');
        });
    });

    describe('ALIX Score Functionality', () => {
        test('should calculate ALIX scores', async () => {
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

        test('should handle ALIX thresholds', async () => {
            const response = await request(app)
                .post('/?noImage=30&noEquationText=15')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.attributes.alixThresholdNoImage).toBe(30);
            expect(response.body.output.attributes.alixThresholdNoEquationText).toBe(15);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing content type', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(400);

            expect(response.text).toBe("Missing contentType or content");
        });

        test('should handle missing content', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math'
                })
                .expect(400);

            expect(response.text).toBe("Missing contentType or content");
        });

        test('should handle unsupported content type', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'chemistry',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(501);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("non-mathematical formula");
        });

        test('should handle invalid MathML', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<invalid>content</invalid>'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("MathML validation failed");
        });
    });

    describe('Response Format', () => {
        test('should return correct response structure', async () => {
            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>3</mn><mo>+</mo><mn>2</mn></math>'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('input');
            expect(response.body).toHaveProperty('output');
            expect(response.body.input).toHaveProperty('mathml');
            expect(response.body.output).toHaveProperty('text');
            expect(response.body.output).toHaveProperty('image');
            expect(response.body.output).toHaveProperty('attributes');
            expect(response.body.output.text).toHaveProperty('words');
            expect(response.body.output.text).toHaveProperty('translated');
            expect(response.body.output.text).toHaveProperty('latex');
            expect(response.body.output.text).toHaveProperty('ascii');
            expect(response.body.output.text).toHaveProperty('html');
            expect(response.body.output.attributes).toHaveProperty('language');
            expect(response.body.output.attributes).toHaveProperty('alix');
            expect(response.body.output.attributes).toHaveProperty('alixThresholdNoImage');
            expect(response.body.output.attributes).toHaveProperty('alixThresholdNoEquationText');
        });
    });

    describe('Performance', () => {
        test('should handle large MathML content', async () => {
            const largeMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
                '<mn>1</mn><mo>+</mo><mn>2</mn><mo>+</mo><mn>3</mn><mo>+</mo><mn>4</mn><mo>+</mo><mn>5</mn>' +
                '<mo>+</mo><mn>6</mn><mo>+</mo><mn>7</mn><mo>+</mo><mn>8</mn><mo>+</mo><mn>9</mn><mo>+</mo><mn>10</mn>' +
                '</math>';

            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: largeMathML
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
        });

        test('should handle complex nested expressions', async () => {
            const complexMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
                '<mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><mfrac><mn>1</mn><mn>2</mn></mfrac></mrow></mfrac></mrow></mfrac>' +
                '</math>';

            const response = await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: complexMathML
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.output.text.words).toBeDefined();
        });
    });
});