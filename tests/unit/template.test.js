/* eslint-disable complexity, max-depth, max-lines, no-unused-vars */

const ejs = require('ejs');
const path = require('path');

describe('Template Updates for New MathML Structure', () => {
  let templatePath;

  beforeAll(() => {
    templatePath = path.resolve('./src/templates/accessibleHtmlWithAlix.ejs');
  });

  describe('Template Structure Validation', () => {
    it('should render block display without alttext/altimg dependencies', async () => {
      const opts = {
        disp: 'block',
        txt: '3 plus 2',
        svg: '<svg>...</svg>',
        alix: 30,
        alixThresholdNoImage: 25,
        language: 'en'
      };

      const result = await ejs.renderFile(templatePath, opts);

      // Should not contain alttext or altimg references
      expect(result).not.toContain('alttext');
      expect(result).not.toContain('altimg');

      // Should contain proper block structure
      expect(result).toContain('<figure class="image"');
      expect(result).toContain('<figcaption>');
      expect(result).toContain('spoken-math');
    });

    it('should render inline display without alttext/altimg dependencies', async () => {
      const opts = {
        disp: 'inline',
        txt: '3 plus 2',
        svg: '<svg>...</svg>',
        alix: 30,
        alixThresholdNoImage: 25,
        language: 'en'
      };

      const result = await ejs.renderFile(templatePath, opts);

      // Should not contain alttext or altimg references
      expect(result).not.toContain('alttext');
      expect(result).not.toContain('altimg');

      // Should contain proper inline structure
      expect(result).toContain('<span class="image"');
      expect(result).toContain('spoken-math');
    });

    it('should render text-only output when alix is below threshold', async () => {
      const opts = {
        disp: 'block',
        txt: '3 plus 2',
        svg: '<svg>...</svg>',
        alix: 20,
        alixThresholdNoImage: 25,
        language: 'en'
      };

      const result = await ejs.renderFile(templatePath, opts);

      // Should not contain SVG when alix is below threshold
      expect(result).not.toContain('<svg>');
      expect(result).toContain('<p>');
      expect(result).toContain('spoken-math');
    });

    it('should handle missing optional parameters gracefully', async () => {
      const opts = {
        disp: 'block',
        txt: '3 plus 2'
        // Missing other parameters
      };

      const result = await ejs.renderFile(templatePath, opts);

      // Should still render without errors
      expect(result).toContain('spoken-math');
      expect(result).toContain('3 plus 2');
    });

    it('should use proper language attribute in xml:lang', async () => {
      const opts = {
        disp: 'block',
        txt: '3 plus 2',
        svg: '<svg>...</svg>',
        alix: 30,
        alixThresholdNoImage: 25,
        language: 'no'
      };

      const result = await ejs.renderFile(templatePath, opts);

      expect(result).toContain('xml:lang="no"');
    });

    it('should handle different display modes correctly', async () => {
      const testCases = [
        { disp: 'block', expectedTag: 'figure' },
        { disp: 'inline', expectedTag: 'span' }
      ];

      for (const testCase of testCases) {
        const opts = {
          disp: testCase.disp,
          txt: 'test',
          svg: '<svg>...</svg>',
          alix: 30,
          alixThresholdNoImage: 25,
          language: 'en'
        };

        const result = await ejs.renderFile(templatePath, opts);
        expect(result).toContain(`<${testCase.expectedTag} class="image"`);
      }
    });
  });

  describe('Template Compatibility with New MathML Guidelines', () => {
    it('should not reference deprecated m: prefix elements', async () => {
      const templateContent = require('fs').readFileSync(templatePath, 'utf8');

      // Template should not contain references to deprecated m: prefix
      expect(templateContent).not.toContain('m:math');
      expect(templateContent).not.toContain('m:');
    });

    it('should not reference deprecated mfenced elements', async () => {
      const templateContent = require('fs').readFileSync(templatePath, 'utf8');

      // Template should not contain references to deprecated mfenced
      expect(templateContent).not.toContain('mfenced');
    });

    it('should not reference deprecated semantics elements', async () => {
      const templateContent = require('fs').readFileSync(templatePath, 'utf8');

      // Template should not contain references to deprecated semantics
      expect(templateContent).not.toContain('semantics');
      expect(templateContent).not.toContain('annotation');
      expect(templateContent).not.toContain('annotation-xml');
    });
  });

  describe('Template Output Validation', () => {
    it('should generate valid HTML structure', async () => {
      const opts = {
        disp: 'block',
        txt: '3 plus 2',
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>3+2</text></svg>',
        alix: 30,
        alixThresholdNoImage: 25,
        language: 'en'
      };

      const result = await ejs.renderFile(templatePath, opts);

      // Should be valid HTML structure
      expect(result).toMatch(/<figure[^>]*>.*<\/figure>/s);
      expect(result).toMatch(/<figcaption[^>]*>.*<\/figcaption>/s);
      expect(result).toContain('spoken-math');
    });

    it('should properly escape text content', async () => {
      const opts = {
        disp: 'inline',
        txt: '<script>alert("xss")</script>',
        svg: '<svg>...</svg>',
        alix: 30,
        alixThresholdNoImage: 25,
        language: 'en'
      };

      const result = await ejs.renderFile(templatePath, opts);

      // Should escape HTML in text content (EJS uses &#34; for quotes)
      expect(result).toContain('&lt;script&gt;alert(&#34;xss&#34;)&lt;/script&gt;');
      expect(result).not.toContain('<script>');
    });
  });
});
