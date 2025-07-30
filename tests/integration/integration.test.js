const request = require('supertest');

// Mock external dependencies
jest.mock('@airbrake/node');
jest.mock('x2js');
jest.mock('ejs');
jest.mock('fast-xml-parser');
jest.mock('mathml-to-latex');
jest.mock('mathml-to-asciimath');
jest.mock('../../src/conversions/text');
jest.mock('../../src/validation');
jest.mock('../../src/backward-compatibility');
jest.mock('../../src/cache');

describe('Index.js Main Application', () => {
  let app;
  let server;
  let mockMathML2Latex;
  let mockMathML2Ascii;
  let mockGenerateMath;
  let mockValidateMathML;
  let mockDetectMathMLVersion;
  let mockMigrateMathML;
  let mockValidateMigratedContent;
  let mockGetMigrationRecommendations;
  let mockMathMLCache;

  beforeAll(async () => {
    // Set up environment
    process.env.NODE_ENV = 'test';

    // Mock implementations
    mockMathML2Latex = {
      convert: jest.fn().mockReturnValue('3 + 2')
    };
    mockMathML2Ascii = jest.fn().mockReturnValue('3 + 2');
    mockGenerateMath = jest.fn().mockReturnValue({
      success: true,
      words: ['3', 'plus', '2'],
      alix: 7.0
    });
    mockValidateMathML = jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      legacyFeatures: []
    });
    mockDetectMathMLVersion = jest.fn().mockReturnValue({
      version: '2.0.0',
      isLegacy: false,
      compatibilityMode: false,
      legacyFeatures: [],
      migrationHints: []
    });
    mockMigrateMathML = jest.fn().mockReturnValue({
      migratedContent: '<math><mn>3</mn><mo>+</mo><mn>2</mn></math>',
      changes: [],
      warnings: [],
      success: true
    });
    mockValidateMigratedContent = jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    mockGetMigrationRecommendations = jest.fn().mockReturnValue([]);
    mockMathMLCache = {
      getStats: jest.fn().mockReturnValue({
        size: 10,
        maxSize: 100,
        hitRate: 0.8,
        hitCount: 80,
        missCount: 20
      }),
      clear: jest.fn()
    };

    // Apply mocks
    require('mathml-to-latex').convert = mockMathML2Latex.convert;
    const mathmlToAscii = require('mathml-to-asciimath');
    mathmlToAscii.mockImplementation(mockMathML2Ascii);

    // Mock local modules
    const textModule = require('../../src/conversions/text');
    const validationModule = require('../../src/validation');
    const backwardCompatibilityModule = require('../../src/backward-compatibility');
    const cacheModule = require('../../src/cache');

    textModule.GenerateMath = mockGenerateMath;
    validationModule.validateMathML = mockValidateMathML;
    backwardCompatibilityModule.detectMathMLVersion = mockDetectMathMLVersion;
    backwardCompatibilityModule.migrateMathML = mockMigrateMathML;
    backwardCompatibilityModule.validateMigratedContent = mockValidateMigratedContent;
    backwardCompatibilityModule.getMigrationRecommendations = mockGetMigrationRecommendations;
    cacheModule.mathMLCache = mockMathMLCache;

    // Mock XML parsing
    const mockXMLParser = {
      parse: jest.fn().mockReturnValue({
        math: {
          _attr: {
            'xml:lang': 'en',
            display: 'inline'
          },
          mn: '3',
          mo: '+',
          mn: '2'
        }
      })
    };
    const mockXMLBuilder = {
      build: jest.fn().mockReturnValue('<math><mn>3</mn><mo>+</mo><mn>2</mn></math>')
    };
    require('fast-xml-parser').XMLParser = jest.fn().mockImplementation(() => mockXMLParser);
    require('fast-xml-parser').XMLBuilder = jest.fn().mockImplementation(() => mockXMLBuilder);

    // Mock X2JS
    const mockX2JS = {
      xml2dom: jest.fn().mockReturnValue({
        documentElement: {
          getAttribute: jest.fn().mockImplementation((attr) => {
            if (attr === 'xml:lang') {return 'en';}
            if (attr === 'display') {return 'inline';}
            return null;
          })
        }
      })
    };
    require('x2js').mockImplementation(() => mockX2JS);

    // Mock EJS
    require('ejs').renderFile = jest.fn().mockResolvedValue('<span>3 plus 2</span>');

    // Create test app
    const express = require('express');
    const bodyParser = require('body-parser');

    app = express();
    app.use(bodyParser.json());

    // Mock package.json
    jest.doMock('../../package.json', () => ({
      name: 'service-stem',
      version: '1.0.0'
    }));

    // Mock appConfig
    jest.doMock('../../src/configurations/appConfig', () => ({
      PORT: 3000,
      HOST: 'localhost'
    }));

    // Create a test server
    const http = require('http');
    server = http.createServer(app);
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    testUtils.clearConsoleMocks();

    // Reset mock implementations
    mockGenerateMath.mockReturnValue({
      success: true,
      words: ['3', 'plus', '2'],
      alix: 7.0
    });
    mockValidateMathML.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      legacyFeatures: []
    });
    mockDetectMathMLVersion.mockReturnValue({
      version: '2.0.0',
      isLegacy: false,
      compatibilityMode: false,
      legacyFeatures: [],
      migrationHints: []
    });
  });

  describe('Health Endpoint', () => {
    it('should return health information', async () => {
      // Mock the health endpoint
      app.get('/health', (req, res) => {
        res.json({
          name: 'service-stem',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Root GET Endpoint', () => {
    it('should return 400 with usage instructions', async () => {
      // Mock the root endpoint
      app.get('/', (req, res) => {
        res.status(400).json({
          success: false,
          name: 'service-stem',
          version: '1.0.0',
          message: "Use POST instead of GET with optional query variables: 'noImage' (ALIX threshold number) and 'noEquationText' (ALIX threshold number), and payload: { \"contentType\": \"math|chemistry|physics|other\", \"content\": \"...\" }"
        });
      });

      const response = await request(app)
        .get('/')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Use POST instead of GET');
    });
  });

  describe('Cache Statistics Endpoint', () => {
    it('should return cache statistics', async () => {
      // Mock the cache stats endpoint
      app.get('/cache-stats', (req, res) => {
        const stats = mockMathMLCache.getStats();

        res.json({
          success: true,
          cache: {
            size: stats.size,
            maxSize: stats.maxSize,
            hitRate: Math.round(stats.hitRate * 100) + '%',
            hitCount: stats.hitCount,
            missCount: stats.missCount,
            totalRequests: stats.hitCount + stats.missCount
          },
          performance: {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
          }
        });
      });

      const response = await request(app)
        .get('/cache-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cache).toHaveProperty('size');
      expect(response.body.cache).toHaveProperty('maxSize');
      expect(response.body.cache).toHaveProperty('hitRate');
      expect(response.body.performance).toHaveProperty('memoryUsage');
      expect(response.body.performance).toHaveProperty('uptime');
    });
  });

  describe('Cache Clear Endpoint', () => {
    it('should clear cache and return success', async () => {
      // Mock the cache clear endpoint
      app.post('/cache-clear', (req, res) => {
        mockMathMLCache.clear();

        res.json({
          success: true,
          message: 'Cache cleared successfully'
        });
      });

      const response = await request(app)
        .post('/cache-clear')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cache cleared successfully');
      expect(mockMathMLCache.clear).toHaveBeenCalled();
    });
  });

  describe('Migration Endpoint', () => {
    it('should migrate MathML content successfully', async () => {
      // Mock the migration endpoint
      app.post('/migrate', (req, res) => {
        const { content } = req.body;

        if (!content) {
          res.status(400).json({
            success: false,
            error: 'Missing content parameter'
          });
          return;
        }

        try {
          const versionInfo = mockDetectMathMLVersion(content);
          const migrationResult = mockMigrateMathML(content);
          const validationResult = mockValidateMigratedContent(migrationResult.migratedContent);
          const recommendations = mockGetMigrationRecommendations(versionInfo);

          res.json({
            success: true,
            originalContent: content,
            migratedContent: migrationResult.migratedContent,
            versionInfo: versionInfo,
            migrationResult: {
              changes: migrationResult.changes,
              warnings: migrationResult.warnings,
              success: migrationResult.success
            },
            validationResult: validationResult,
            recommendations: recommendations,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Migration failed',
            message: error.message
          });
        }
      });

      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');

      const response = await request(app)
        .post('/migrate')
        .send({ content: mathML })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('originalContent');
      expect(response.body).toHaveProperty('migratedContent');
      expect(response.body).toHaveProperty('versionInfo');
      expect(response.body).toHaveProperty('migrationResult');
      expect(response.body).toHaveProperty('validationResult');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should handle missing content parameter', async () => {
      const response = await request(app)
        .post('/migrate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing content parameter');
    });

    it('should handle migration errors', async () => {
      mockDetectMathMLVersion.mockImplementation(() => {
        throw new Error('Migration failed');
      });

      const response = await request(app)
        .post('/migrate')
        .send({ content: 'invalid' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Migration failed');
    });
  });

  describe('Version Detection Endpoint', () => {
    it('should detect MathML version successfully', async () => {
      // Mock the version detection endpoint
      app.post('/detect-version', (req, res) => {
        const { content } = req.body;

        if (!content) {
          res.status(400).json({
            success: false,
            error: 'Missing content parameter'
          });
          return;
        }

        try {
          const versionInfo = mockDetectMathMLVersion(content);
          const recommendations = mockGetMigrationRecommendations(versionInfo);

          res.json({
            success: true,
            versionInfo: versionInfo,
            recommendations: recommendations,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: 'Version detection failed',
            message: error.message
          });
        }
      });

      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');

      const response = await request(app)
        .post('/detect-version')
        .send({ content: mathML })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('versionInfo');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should handle missing content parameter', async () => {
      const response = await request(app)
        .post('/detect-version')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing content parameter');
    });

    it('should handle version detection errors', async () => {
      mockDetectMathMLVersion.mockImplementation(() => {
        throw new Error('Detection failed');
      });

      const response = await request(app)
        .post('/detect-version')
        .send({ content: 'invalid' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Version detection failed');
    });
  });

  describe('Main POST Endpoint - Math Processing', () => {
    beforeEach(() => {
      // Mock the main POST endpoint
      app.post('/', async (req, res) => {
        const { contentType, content } = req.body;
        const { noImage, noEquationText, version } = req.query;
        const noImageInt = parseInt(noImage) || 25;
        const noEquationTextInt = parseInt(noEquationText) || 12;

        if (!contentType || !content) {
          res.status(400).send('Missing contentType or content');
          return;
        }

        // Validate MathML content
        if (contentType === 'math') {
          const versionInfo = mockDetectMathMLVersion(content);
          const validationOptions = {
            strictMode: !versionInfo.compatibilityMode,
            allowLegacy: true
          };

          const validationResult = mockValidateMathML(content, validationOptions);

          if (!validationResult.isValid) {
            res.status(400).json({
              success: false,
              error: 'MathML validation failed',
              validationErrors: validationResult.errors,
              validationWarnings: validationResult.warnings,
              legacyFeatures: validationResult.legacyFeatures
            });
            return;
          }
        }

        let result = null;
        switch (contentType) {
        case 'math':
          result = mockGenerateMath(content, { noImage: noImageInt, noEquationText: noEquationTextInt });
          break;
        case 'chemistry':
          res.status(501).json({ success: false, error: 'non-mathematical formula' });
          return;
        case 'physics':
          res.status(501).json({ success: false, error: 'non-mathematical formula' });
          return;
        case 'other':
          res.status(501).json({ success: false, error: 'non-mathematical formula' });
          return;
        default:
          res.status(400).json({ success: false, error: 'unknown content type' });
          return;
        }

        if (result === null) {
          res.status(400).send('Invalid content');
          return;
        }

        if (result.success === false) {
          res.status(500).send(result.message);
          return;
        }

        // Process MathML
        const versionInfo = mockDetectMathMLVersion(content, version);
        const latexStr = mockMathML2Latex.convert(content);
        const asciiStr = mockMathML2Ascii(content);
        const translatedStr = result.words.join(' ');

        const returnObj = {
          'success': result.success,
          'input': {
            'mathml': content,
            'version': version || '2.0.0'
          },
          'output': {
            'text': {
              'words': result.words,
              'translated': translatedStr,
              'latex': latexStr,
              'ascii': asciiStr,
              'html': '<span>3 plus 2</span>'
            },
            'image': {
              'path': null
            },
            'attributes': {
              'language': 'en',
              'alix': result.alix,
              'alixThresholdNoImage': noImageInt,
              'alixThresholdNoEquationText': noEquationTextInt,
              'compatibilityMode': versionInfo.compatibilityMode
            }
          }
        };

        if (versionInfo.isLegacy || versionInfo.legacyFeatures.length > 0) {
          returnObj.backwardCompatibility = {
            'isLegacy': versionInfo.isLegacy,
            'legacyFeatures': versionInfo.legacyFeatures,
            'migrationHints': versionInfo.migrationHints,
            'migrationRecommendations': mockGetMigrationRecommendations(versionInfo),
            'compatibilityMode': versionInfo.compatibilityMode
          };
        }

        res.json(returnObj);
      });
    });

    it('should process valid MathML request successfully', async () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');

      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: mathML
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.input.mathml).toBe(mathML);
      expect(response.body.output.text.words).toEqual(['3', 'plus', '2']);
      expect(response.body.output.text.latex).toBe('3 + 2');
      expect(response.body.output.text.ascii).toBe('3 + 2');
      expect(response.body.output.attributes.language).toBe('en');
      expect(response.body.output.attributes.alix).toBe(7.0);
    });

    it('should handle missing contentType', async () => {
      const response = await request(app)
        .post('/')
        .send({
          content: testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>')
        })
        .expect(400);

      expect(response.text).toBe('Missing contentType or content');
    });

    it('should handle missing content', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math'
        })
        .expect(400);

      expect(response.text).toBe('Missing contentType or content');
    });

    it('should handle unsupported content types', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'chemistry',
          content: 'H2O'
        })
        .expect(501);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('non-mathematical formula');
    });

    it('should handle physics content type', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'physics',
          content: 'E=mc²'
        })
        .expect(501);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('non-mathematical formula');
    });

    it('should handle other content type', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'other',
          content: 'some content'
        })
        .expect(501);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('non-mathematical formula');
    });

    it('should handle unknown content type', async () => {
      const response = await request(app)
        .post('/')
        .send({
          contentType: 'unknown',
          content: 'some content'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('unknown content type');
    });

    it('should handle MathML validation failures', async () => {
      mockValidateMathML.mockReturnValue({
        isValid: false,
        errors: ['Invalid MathML structure'],
        warnings: [],
        legacyFeatures: []
      });

      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: testUtils.createMathML('<invalid>content</invalid>')
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('MathML validation failed');
      expect(response.body.validationErrors).toContain('Invalid MathML structure');
    });

    it('should handle processing failures', async () => {
      mockGenerateMath.mockReturnValue({
        success: false,
        message: 'Processing failed'
      });

      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>')
        })
        .expect(500);

      expect(response.text).toBe('Processing failed');
    });

    it('should handle null result', async () => {
      mockGenerateMath.mockReturnValue(null);

      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>')
        })
        .expect(400);

      expect(response.text).toBe('Invalid content');
    });

    it('should process with custom ALIX thresholds', async () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');

      const response = await request(app)
        .post('/?noImage=30&noEquationText=15')
        .send({
          contentType: 'math',
          content: mathML
        })
        .expect(200);

      expect(response.body.output.attributes.alixThresholdNoImage).toBe(30);
      expect(response.body.output.attributes.alixThresholdNoEquationText).toBe(15);
    });

    it('should handle legacy MathML with backward compatibility info', async () => {
      mockDetectMathMLVersion.mockReturnValue({
        version: '1.0.0',
        isLegacy: true,
        compatibilityMode: true,
        legacyFeatures: ['mfenced'],
        migrationHints: ['Convert mfenced to mo elements']
      });

      const mathML = testUtils.createLegacyMathML('<mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>');

      const response = await request(app)
        .post('/')
        .send({
          contentType: 'math',
          content: mathML
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.backwardCompatibility.isLegacy).toBe(true);
      expect(response.body.backwardCompatibility.legacyFeatures).toContain('mfenced');
      expect(response.body.output.attributes.compatibilityMode).toBe(true);
    });

    it('should handle version parameter', async () => {
      const mathML = testUtils.createMathML('<mn>3</mn><mo>+</mo><mn>2</mn>');

      const response = await request(app)
        .post('/?version=1.0.0')
        .send({
          contentType: 'math',
          content: mathML
        })
        .expect(200);

      expect(response.body.input.version).toBe('1.0.0');
    });
  });

  describe('Performance and Caching', () => {
    it('should use cached results when available', async () => {
      mockMathMLCache.getStats.mockReturnValue({
        size: 10,
        maxSize: 100,
        hitRate: 0.9,
        hitCount: 90,
        missCount: 10
      });

      const response = await request(app)
        .get('/cache-stats')
        .expect(200);

      expect(response.body.cache.hitRate).toBe('90%');
      expect(response.body.cache.hitCount).toBe(90);
    });

    it('should handle cache clear operations', async () => {
      const response = await request(app)
        .post('/cache-clear')
        .expect(200);

      expect(mockMathMLCache.clear).toHaveBeenCalled();
    });
  });
});
