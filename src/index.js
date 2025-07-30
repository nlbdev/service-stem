/* eslint-disable complexity, max-depth, max-lines, no-console, no-unused-vars */

require('dotenv').config();
const Airbrake = require('@airbrake/node');

new Airbrake.Notifier({
  projectId: 257349,
  projectKey: '9331de259df466d79c1d0e786be78051',
  environment: process.env.NODE_ENV || 'development'
});

(() => {
  'use strict';

  const Pack = require('./package.json');
  const X2JS = require('x2js');
  const ejs = require('ejs');
  const Resolve = require('path').resolve;
  const { XMLParser, XMLBuilder } = require('fast-xml-parser');

  const MathML2Latex = require('mathml-to-latex');
  const MathML2Ascii = require('mathml-to-asciimath');

  const { PORT, HOST } = require('./configurations/appConfig');
  const { GenerateMath } = require('./conversions/text');
  const { validateMathML } = require('./validation');
  const {
    detectMathMLVersion,
    migrateMathML,
    validateMigratedContent,
    getMigrationRecommendations
  } = require('./backward-compatibility');

  // Create reusable parser instances for better performance
  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    ignoreNameSpace: false
  });
  const xmlBuilder = new XMLBuilder();
  const x2js = new X2JS();

  // Pre-compile regex patterns for better performance
  const SEMANTICS_REGEX = /<semantics[^>]*>.*?<\/semantics>/gs;
  const ANNOTATION_REGEX = /<annotation[^>]*>.*?<\/annotation>/gs;
  const ANNOTATION_XML_REGEX = /<annotation-xml[^>]*>.*?<\/annotation-xml>/gs;
  const MFENCED_REGEX = /<mfenced([^>]*)>(.*?)<\/mfenced>/gs;
  const OLD_NAMESPACE_REGEX = /<m:/g;
  const OLD_NAMESPACE_CLOSE_REGEX = /<\/m:/g;

  /**
     * Optimized MathML processing function with backward compatibility support
     * @param {string} content - Raw MathML content
     * @param {string} version - Optional version parameter for compatibility mode
     * @returns {Object} Processed MathML and extracted attributes
     */
  const processMathML = (content, version = null) => {
    // Detect MathML version and compatibility requirements
    const versionInfo = detectMathMLVersion(content);
    const compatibilityMode = version === '1.0.0' || versionInfo.compatibilityMode;

    // Parse XML once and reuse
    const xmlDom = x2js.xml2dom(content);
    const XMLObject = xmlParser.parse(content);
    const XMLContent = xmlBuilder.build(XMLObject);

    // Extract attributes efficiently
    const rootElement = xmlDom.documentElement;
    const languageStr = rootElement.getAttribute('xml:lang') ||
                           rootElement.getAttribute('lang') || 'en';

    let displayStr = rootElement.getAttribute('display');
    if (displayStr && displayStr !== 'block' && displayStr !== 'inline') {
      console.warn(`Warning: Invalid display attribute value "${displayStr}". Must be "block" or "inline". Using default "inline".`);
      displayStr = 'inline';
    } else if (!displayStr) {
      displayStr = 'inline';
    }

    const displaystyleAttr = rootElement.getAttribute('displaystyle');
    if (displaystyleAttr && displaystyleAttr !== 'true' && displaystyleAttr !== 'false') {
      console.warn(`Warning: Invalid displaystyle attribute value "${displaystyleAttr}". Must be "true" or "false".`);
    }

    const altimgStr = rootElement.getAttribute('altimg') || '';
    const alttextStr = rootElement.getAttribute('alttext') || '';

    // Warn about deprecated attributes
    if (altimgStr) {
      console.warn("Warning: 'altimg' attribute is deprecated according to Nordic MathML Guidelines. MathML support has improved and this attribute should not be used.");
    }
    if (alttextStr) {
      console.warn("Warning: 'alttext' attribute is deprecated according to Nordic MathML Guidelines. MathML support has improved and this attribute should not be used.");
    }

    // Process MathML content efficiently
    let processedXMLContent = XMLContent;

    // Remove deprecated semantics and annotation elements
    processedXMLContent = processedXMLContent.replace(SEMANTICS_REGEX, (match) => {
      const innerMatch = match.replace(/<semantics[^>]*>(.*?)<\/semantics>/s, '$1');
      return innerMatch.replace(ANNOTATION_REGEX, '').replace(ANNOTATION_XML_REGEX, '');
    });

    // Convert deprecated mfenced elements to mo elements
    processedXMLContent = processedXMLContent.replace(MFENCED_REGEX, (match, attributes, content) => {
      const openMatch = attributes.match(/open="([^"]*)"/);
      const closeMatch = attributes.match(/close="([^"]*)"/);
      const open = openMatch ? openMatch[1] : '(';
      const close = closeMatch ? closeMatch[1] : ')';
      return `<mo>${open}</mo>${content}<mo>${close}</mo>`;
    });

    return {
      processedXMLContent,
      languageStr,
      displayStr,
      displaystyleAttr,
      altimgStr,
      alttextStr,
      versionInfo,
      compatibilityMode
    };
  };

  /**
     * Transforms MathML to AsciiMath
     * @param {{mathml: string;success: boolean;language: string;words: any[];ascii: string;display: string;imagepath: string;alix: number;}} mathObj Math Object
     * @returns {String} AsciiMath
     */
  const GenerateAsciiMath = (mathml) => {
    try {
      return MathML2Ascii(mathml);
    }
    catch(err) {
      // According to new guidelines, alttext should not be used as MathML support has improved
      // Instead, try to generate a basic fallback from the MathML content
      console.warn('Warning: Failed to convert MathML to AsciiMath. Generating basic fallback.');
      return 'MathML content'; // Basic fallback instead of using deprecated alttext
    }
  };

  /**
     * Transforms MathML to Accessible HTML with ALIX
     * @param {{language: String;disp: String;txt: String;svg: String;alix: Number;alixThresholdNoImage: Number;}} opts options
     * @returns {Promise<String>} Accessible HTML with ALIX
     */
  const GenerateHtmlFromTemplate = async (opts) => {
    var filename = Resolve('./templates/accessibleHtmlWithAlix.ejs');

    // Validate opts
    if (opts === undefined) {
      opts = {};
    }
    if (opts.language === undefined) {
      opts.language = 'no';
    }
    if (opts.disp === undefined) {
      opts.disp = 'block';
    }
    if (opts.txt === undefined) {
      opts.txt = '';
    }
    if (opts.svg === undefined) {
      opts.svg = '';
    }
    if (opts.alix === undefined) {
      opts.alix = 0;
    }
    if (opts.alixThresholdNoImage === undefined) {
      opts.alixThresholdNoImage = 25;
    }

    // Render template
    return ejs.renderFile(filename, opts).then(res => {
      return res;
    });
  };

  /**
     * Translates the text array from English to a specified language
     * @param {Array<String>} inputText The English text as array
     * @param {String} lang The language to translate to
     * @returns {String} The translated text
     */
  const TranslateText = (inputText, lang) => {
    var text = inputText.join(' ');
    if (lang !== null) {
      try {
        var newText = text;
        const postProcess = require(`./translations/${lang}.json`);

        postProcess.forEach(p => {
          var regexString = `\\b(${p.search})\\b`;
          var re = new RegExp(regexString, 'g');
          newText = newText.replace(re, p.replace);
        });

        // Fixes punctuation errors
        const punctuations = require('./translations/all.json');
        punctuations.forEach(s => {
          newText = newText.split(s.search).join(s.replace);
        });
        return newText;
      }
      catch (ex) {
        // File not found, just return the text
      }
    }
    return text;
  };

  const express = require('express');
  const app = express();
  const bodyParser = require('body-parser');

  // create application/json parser
  const jsonParser = bodyParser.json();

  app.set('view engine', 'ejs');
  app.set('view options', { layout: true });

  // On all requests, log the it
  app.use((request, response, next) => {
    console.info(`${new Date().toISOString()}\tA request from ${request.ip} (${request.method.toUpperCase()} ${request.url}) ended with ${response.statusCode}`);
    next();
  });

  // Define routes
  app.get('/health', jsonParser, (req, res) => {
    res.send({
      name: Pack.name,
      version: Pack.version,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/', jsonParser, (req, res) => {
    res.status(400).send({
      success: false,
      name: Pack.name,
      version: Pack.version,
      message: "Use POST instead of GET with optional query variables: 'noImage' (ALIX threshold number) and 'noEquationText' (ALIX threshold number), and payload: { \"contentType\": \"math|chemistry|physics|other\", \"content\": \"...\" }"
    });
  });

  // Cache statistics endpoint for performance monitoring
  app.get('/cache-stats', (req, res) => {
    const { mathMLCache } = require('./src/cache');
    const stats = mathMLCache.getStats();

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

  // Clear cache endpoint for maintenance
  app.post('/cache-clear', (req, res) => {
    const { mathMLCache } = require('./src/cache');
    mathMLCache.clear();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  });

  // Migration assistance endpoint
  app.post('/migrate', jsonParser, (req, res) => {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Missing content parameter'
      });
      return;
    }

    try {
      // Detect version and get migration info
      const versionInfo = detectMathMLVersion(content);
      const migrationResult = migrateMathML(content);
      const validationResult = validateMigratedContent(migrationResult.migratedContent);
      const recommendations = getMigrationRecommendations(versionInfo);

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
      console.error('Migration error:', error);
      res.status(500).json({
        success: false,
        error: 'Migration failed',
        message: error.message
      });
    }
  });

  // Version detection endpoint
  app.post('/detect-version', jsonParser, (req, res) => {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Missing content parameter'
      });
      return;
    }

    try {
      const versionInfo = detectMathMLVersion(content);
      const recommendations = getMigrationRecommendations(versionInfo);

      res.json({
        success: true,
        versionInfo: versionInfo,
        recommendations: recommendations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Version detection error:', error);
      res.status(500).json({
        success: false,
        error: 'Version detection failed',
        message: error.message
      });
    }
  });

  // POST / payload: { "contentType": "math|chemistry|physics|other", "content": "..." }
  app.post('/', jsonParser, async (req, res) => {
    const { contentType, content } = req.body;
    const { noImage, noEquationText, version } = req.query;
    const noImageInt = parseInt(noImage) || 25;
    const noEquationTextInt = parseInt(noEquationText) || 12;

    const alixThresholds = {
      'noImage': noImageInt,
      'noEquationText': noEquationTextInt
    };
    if (!contentType || !content) {
      res.status(400).send('Missing contentType or content');
      return;
    }

    // Validate MathML content according to Nordic MathML Guidelines
    if (contentType === 'math') {
      // Detect version first to determine validation mode
      const versionInfo = detectMathMLVersion(content);
      const validationOptions = {
        strictMode: !versionInfo.compatibilityMode,
        allowLegacy: true
      };

      const validationResult = validateMathML(content, validationOptions);

      // Log validation warnings
      if (validationResult.warnings.length > 0) {
        validationResult.warnings.forEach(warning => {
          console.warn(`Validation Warning: ${warning}`);
        });
      }

      // Return validation errors if any
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
      result = GenerateMath(content, alixThresholds);
      break;
    case 'chemistry':
      res.status(501).json({ success: false, error: 'non-mathematical formula' });
      break;
    case 'physics':
      res.status(501).json({ success: false, error: 'non-mathematical formula' });
      break;
    case 'other':
      res.status(501).json({ success: false, error: 'non-mathematical formula' });
      break;
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

    // IF we got here, all is well
    const {
      processedXMLContent,
      languageStr,
      displayStr,
      displaystyleAttr,
      altimgStr,
      alttextStr,
      versionInfo,
      compatibilityMode
    } = processMathML(content, version);

    const latexStr = MathML2Latex.convert(processedXMLContent.replace(OLD_NAMESPACE_REGEX, '<').replace(OLD_NAMESPACE_CLOSE_REGEX, '</'));
    const asciiStr = GenerateAsciiMath(processedXMLContent);
    const translatedStr = TranslateText(result.words, languageStr);

    // Get migration recommendations if legacy features are detected
    const migrationRecommendations = getMigrationRecommendations(versionInfo);

    var returnObj = {
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
          'html': await GenerateHtmlFromTemplate({
            language: languageStr,
            disp: displayStr,
            displaystyle: displaystyleAttr,
            txt: translatedStr,
            svg: null,
            alix: result.alix,
            alixThresholdNoImage: alixThresholds.noImage
          })
        },
        'image': {
          'path': null
        },
        'attributes': {
          'language': languageStr,
          'alix': result.alix,
          'alixThresholdNoImage': alixThresholds.noImage,
          'alixThresholdNoEquationText': alixThresholds.noEquationText,
          'compatibilityMode': compatibilityMode
        }
      }
    };

    // Add backward compatibility information if legacy features are detected
    if (versionInfo.isLegacy || versionInfo.legacyFeatures.length > 0) {
      returnObj.backwardCompatibility = {
        'isLegacy': versionInfo.isLegacy,
        'legacyFeatures': versionInfo.legacyFeatures,
        'migrationHints': versionInfo.migrationHints,
        'migrationRecommendations': migrationRecommendations,
        'compatibilityMode': compatibilityMode
      };
    }

    res.json(returnObj);
  });

  // Start the server
  app.listen(PORT, () => {
    console.info(`${new Date().toISOString()}\t${Pack.name} running on ${HOST}:${PORT}`);
  });
})();
