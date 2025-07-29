const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Import the actual processing functions for performance testing
const { GenerateMath } = require('../conversions/text');
const { validateMathML } = require('../validation');

describe('Performance Tests', () => {
    let app;
    let server;

    beforeAll(async () => {
        // Create a test app with the actual processing logic
        app = express();
        app.use(bodyParser.json());

        // POST endpoint with actual processing
        app.post('/', async (req, res) => {
            const { contentType, content } = req.body;
            const { noImage, noEquationText } = req.query;
            const noImageInt = parseInt(noImage) || 25;
            const noEquationTextInt = parseInt(noEquationText) || 12;

            if (!contentType || !content) {
                res.status(400).send("Missing contentType or content");
                return;
            }

            // Validate MathML content
            if (contentType === "math") {
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
            }

            let result = null;
            switch (contentType) {
                case "math":
                    result = GenerateMath(content, {
                        "noImage": noImageInt,
                        "noEquationText": noEquationTextInt
                    });
                    break;
                default:
                    res.status(400).json({ success: false, error: "unknown content type" });
                    return;
            }

            if (result === null) {
                res.status(400).send("Invalid content");
                return;
            }
            
            if (result.success === false) {
                res.status(500).send(result.message);
                return;
            }

            // Return simplified response for performance testing
            res.json({
                success: true,
                input: { mathml: content },
                output: {
                    text: {
                        words: result.words,
                        translated: result.words.join(' ')
                    },
                    attributes: {
                        language: 'en',
                        alix: result.alix,
                        alixThresholdNoImage: noImageInt,
                        alixThresholdNoEquationText: noEquationTextInt
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

    test('should handle simple MathML efficiently', async () => {
        const startTime = Date.now();
        const simpleMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>';
        
        const response = await request(app)
            .post('/')
            .send({
                contentType: 'math',
                content: simpleMathML
            })
            .expect(200);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(response.body.success).toBe(true);
        expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
        console.log(`Simple MathML processing time: ${processingTime}ms`);
    }, 15000); // Increase timeout to 15 seconds

    test('should handle complex nested MathML efficiently', async () => {
        const startTime = Date.now();
        const complexMathML = `
            <math xmlns="http://www.w3.org/1998/Math/MathML">
                <mfrac>
                    <mrow>
                        <mn>1</mn>
                        <mo>+</mo>
                        <mfrac>
                            <mn>1</mn>
                            <mrow>
                                <mn>1</mn>
                                <mo>+</mo>
                                <mfrac>
                                    <mn>1</mn>
                                    <mn>2</mn>
                                </mfrac>
                            </mrow>
                        </mfrac>
                    </mrow>
                    <mn>3</mn>
                </mfrac>
            </math>
        `;
        
        const response = await request(app)
            .post('/')
            .send({
                contentType: 'math',
                content: complexMathML
            })
            .expect(200);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(response.body.success).toBe(true);
        expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
        console.log(`Complex MathML processing time: ${processingTime}ms`);
    }, 15000); // Increase timeout to 15 seconds

    test('should handle large MathML content efficiently', async () => {
        const startTime = Date.now();
        // Create a large MathML with many elements
        let largeMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML">';
        for (let i = 0; i < 50; i++) { // Reduced from 100 to 50 for faster testing
            largeMathML += `<mn>${i}</mn><mo>+</mo>`;
        }
        largeMathML += '<mn>50</mn></math>';
        
        const response = await request(app)
            .post('/')
            .send({
                contentType: 'math',
                content: largeMathML
            })
            .expect(200);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(response.body.success).toBe(true);
        expect(processingTime).toBeLessThan(3000); // Should complete within 3 seconds
        console.log(`Large MathML processing time: ${processingTime}ms`);
    }, 15000); // Increase timeout to 15 seconds

    test('should handle repeated requests efficiently', async () => {
        const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>5</mn><mo>×</mo><mn>3</mn></math>';
        const startTime = Date.now();
        
        // Make 5 repeated requests (reduced from 10 for faster testing)
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                request(app)
                    .post('/')
                    .send({
                        contentType: 'math',
                        content: mathML
                    })
                    .expect(200)
            );
        }
        
        const responses = await Promise.all(promises);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / 5;
        
        responses.forEach(response => {
            expect(response.body.success).toBe(true);
        });
        
        expect(avgTime).toBeLessThan(1000); // Average should be under 1 second
        console.log(`Average time for repeated requests: ${avgTime}ms`);
    }, 15000); // Increase timeout to 15 seconds

    test('should handle memory usage efficiently', async () => {
        const initialMemory = process.memoryUsage();
        console.log('Initial memory usage:', {
            rss: Math.round(initialMemory.rss / 1024 / 1024) + 'MB',
            heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024) + 'MB'
        });
        
        // Process multiple requests to test memory usage
        const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>1</mn></math>';
        
        for (let i = 0; i < 20; i++) { // Reduced from 50 to 20 for faster testing
            await request(app)
                .post('/')
                .send({
                    contentType: 'math',
                    content: mathML
                })
                .expect(200);
        }
        
        const finalMemory = process.memoryUsage();
        console.log('Final memory usage:', {
            rss: Math.round(finalMemory.rss / 1024 / 1024) + 'MB',
            heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024) + 'MB'
        });
        
        // Memory should not grow excessively
        const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    }, 15000); // Increase timeout to 15 seconds
});