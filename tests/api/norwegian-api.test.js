/* eslint-disable max-lines */

const fs = require('fs');
const path = require('path');

describe('Norwegian Translation Integration Tests', () => {
  let noTranslations, nbTranslations, nnTranslations, enTranslations;
  let textIdentifiers, textMisc, textOperators, textRoots;

  beforeAll(() => {
    // Load translation files
    const translationsDir = path.join(__dirname, '..', '..', 'src', 'translations');
    noTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'no.json'), 'utf8'));
    nbTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'nb.json'), 'utf8'));
    nnTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'nn.json'), 'utf8'));
    enTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'en.json'), 'utf8'));

    // Load data files
    const dataDir = path.join(__dirname, '..', '..', 'src', 'conversions', 'data');
    textIdentifiers = JSON.parse(fs.readFileSync(path.join(dataDir, 'text-identifiers.json'), 'utf8'));
    textMisc = JSON.parse(fs.readFileSync(path.join(dataDir, 'text-misc.json'), 'utf8'));
    textOperators = JSON.parse(fs.readFileSync(path.join(dataDir, 'text-operators.json'), 'utf8'));
    textRoots = JSON.parse(fs.readFileSync(path.join(dataDir, 'text-roots.json'), 'utf8'));
  });

  describe('Data File Coverage', () => {
    test('should have complete coverage of text-identifiers.json values', () => {
      const noSearchTerms = new Set(noTranslations.map(t => t.search));
      const nbSearchTerms = new Set(nbTranslations.map(t => t.search));
      const nnSearchTerms = new Set(nnTranslations.map(t => t.search));

      // Extract all values from text-identifiers.json
      const identifierValues = new Set();

      // Add string values
      textIdentifiers.strings.forEach(item => {
        identifierValues.add(item.value);
      });

      // Add char values
      textIdentifiers.chars.forEach(item => {
        identifierValues.add(item.value);
      });

      // Check which values are missing from Norwegian files
      const missingFromNo = [...identifierValues].filter(value => !noSearchTerms.has(value));
      const missingFromNb = [...identifierValues].filter(value => !nbSearchTerms.has(value));
      const missingFromNn = [...identifierValues].filter(value => !nnSearchTerms.has(value));

      // All identifier values should be present in Norwegian files
      expect(missingFromNo).toHaveLength(0);
      expect(missingFromNb).toHaveLength(0);
      expect(missingFromNn).toHaveLength(0);
    });

    test('should have complete coverage of text-misc.json values', () => {
      const noSearchTerms = new Set(noTranslations.map(t => t.search));
      const nbSearchTerms = new Set(nbTranslations.map(t => t.search));
      const nnSearchTerms = new Set(nnTranslations.map(t => t.search));

      // Extract all values from text-misc.json
      const miscValues = new Set();

      // Add string values
      textMisc.strings.forEach(item => {
        miscValues.add(item.value);
      });

      // Add char values
      textMisc.chars.forEach(item => {
        miscValues.add(item.value);
      });

      // Check which values are missing from Norwegian files
      const missingFromNo = [...miscValues].filter(value => !noSearchTerms.has(value));
      const missingFromNb = [...miscValues].filter(value => !nbSearchTerms.has(value));
      const missingFromNn = [...miscValues].filter(value => !nnSearchTerms.has(value));

      // All misc values should be present in Norwegian files
      expect(missingFromNo).toHaveLength(0);
      expect(missingFromNb).toHaveLength(0);
      expect(missingFromNn).toHaveLength(0);
    });

    test('should have complete coverage of text-operators.json values', () => {
      const noSearchTerms = new Set(noTranslations.map(t => t.search));
      const nbSearchTerms = new Set(nbTranslations.map(t => t.search));
      const nnSearchTerms = new Set(nnTranslations.map(t => t.search));

      // Extract all values from text-operators.json
      const operatorValues = new Set();

      // Add string values
      textOperators.strings.forEach(item => {
        operatorValues.add(item.value);
      });

      // Add char values
      textOperators.chars.forEach(item => {
        operatorValues.add(item.value);
      });

      // Add unicode values
      textOperators.unicode.forEach(item => {
        operatorValues.add(item.value);
      });

      // Check which values are missing from Norwegian files
      const missingFromNo = [...operatorValues].filter(value => !noSearchTerms.has(value));
      const missingFromNb = [...operatorValues].filter(value => !nbSearchTerms.has(value));
      const missingFromNn = [...operatorValues].filter(value => !nnSearchTerms.has(value));

      // All operator values should be present in Norwegian files
      expect(missingFromNo).toHaveLength(0);
      expect(missingFromNb).toHaveLength(0);
      expect(missingFromNn).toHaveLength(0);
    });

    test('should have complete coverage of text-roots.json values', () => {
      const noSearchTerms = new Set(noTranslations.map(t => t.search));
      const nbSearchTerms = new Set(nbTranslations.map(t => t.search));
      const nnSearchTerms = new Set(nnTranslations.map(t => t.search));

      // Extract all values from text-roots.json
      const rootValues = new Set();

      // Add values (text-roots.json has a different structure)
      textRoots.forEach(item => {
        rootValues.add(item.value);
      });

      // Check which values are missing from Norwegian files
      const missingFromNo = [...rootValues].filter(value => !noSearchTerms.has(value));
      const missingFromNb = [...rootValues].filter(value => !nbSearchTerms.has(value));
      const missingFromNn = [...rootValues].filter(value => !nnSearchTerms.has(value));

      // All root values should be present in Norwegian files
      expect(missingFromNo).toHaveLength(0);
      expect(missingFromNb).toHaveLength(0);
      expect(missingFromNn).toHaveLength(0);
    });

    test('should have complete coverage of all data file values combined', () => {
      const noSearchTerms = new Set(noTranslations.map(t => t.search));
      const nbSearchTerms = new Set(nbTranslations.map(t => t.search));
      const nnSearchTerms = new Set(nnTranslations.map(t => t.search));

      // Extract all values from all data files
      const allDataValues = new Set();

      // Add text-identifiers values
      textIdentifiers.strings.forEach(item => allDataValues.add(item.value));
      textIdentifiers.chars.forEach(item => allDataValues.add(item.value));

      // Add text-misc values
      textMisc.strings.forEach(item => allDataValues.add(item.value));
      textMisc.chars.forEach(item => allDataValues.add(item.value));

      // Add text-operators values
      textOperators.strings.forEach(item => allDataValues.add(item.value));
      textOperators.chars.forEach(item => allDataValues.add(item.value));
      textOperators.unicode.forEach(item => allDataValues.add(item.value));

      // Add text-roots values
      textRoots.forEach(item => allDataValues.add(item.value));

      // Check which values are missing from Norwegian files
      const missingFromNo = [...allDataValues].filter(value => !noSearchTerms.has(value));
      const missingFromNb = [...allDataValues].filter(value => !nbSearchTerms.has(value));
      const missingFromNn = [...allDataValues].filter(value => !nnSearchTerms.has(value));

      // All data values should be present in Norwegian files
      expect(missingFromNo).toHaveLength(0);
      expect(missingFromNb).toHaveLength(0);
      expect(missingFromNn).toHaveLength(0);
    });
  });

  describe('Translation Synchronization with English', () => {
    test('should have all English translation keys in Norwegian files', () => {
      const enSearchTerms = new Set(enTranslations.map(t => t.search));
      const noSearchTerms = new Set(noTranslations.map(t => t.search));
      const nbSearchTerms = new Set(nbTranslations.map(t => t.search));
      const nnSearchTerms = new Set(nnTranslations.map(t => t.search));

      // Check which English keys are missing from Norwegian files
      const missingFromNo = [...enSearchTerms].filter(term => !noSearchTerms.has(term));
      const missingFromNb = [...enSearchTerms].filter(term => !nbSearchTerms.has(term));
      const missingFromNn = [...enSearchTerms].filter(term => !nnSearchTerms.has(term));

      // All English keys should be present in Norwegian files
      expect(missingFromNo).toHaveLength(0);
      expect(missingFromNb).toHaveLength(0);
      expect(missingFromNn).toHaveLength(0);
    });

    test('should have appropriate Norwegian translations for English keys', () => {
      const noTranslationsMap = {};
      const nbTranslationsMap = {};
      const nnTranslationsMap = {};

      noTranslations.forEach(t => { noTranslationsMap[t.search] = t.replace; });
      nbTranslations.forEach(t => { nbTranslationsMap[t.search] = t.replace; });
      nnTranslations.forEach(t => { nnTranslationsMap[t.search] = t.replace; });

      // Test specific English keys that should have Norwegian translations
      const testCases = [
        {
          englishKey: 'expression end derivative',
          expectedNo: 'uttrykk slutt, derivert',
          expectedNb: 'uttrykk slutt, derivert',
          expectedNn: 'uttrykk slutt, derivert'
        },
        {
          englishKey: 'expression end double derivative',
          expectedNo: 'uttrykk slutt, dobbelderivert',
          expectedNb: 'uttrykk slutt, dobbelderivert',
          expectedNn: 'uttrykk slutt, dobbelderivert'
        },
        {
          englishKey: 'left parenthesis matrix start,',
          expectedNo: 'matrise start,',
          expectedNb: 'matrise start,',
          expectedNn: 'matrise start,'
        },
        {
          englishKey: 'matrix end right parenthesis',
          expectedNo: 'matrise slutt,',
          expectedNb: 'matrise slutt,',
          expectedNn: 'matrise slutt,'
        },
        {
          englishKey: 'capital degrees',
          expectedNo: 'grader',
          expectedNb: 'grader',
          expectedNn: 'grader'
        },
        {
          englishKey: 'capital degrees C',
          expectedNo: 'grader celcius',
          expectedNb: 'grader celcius',
          expectedNn: 'grader celcius'
        },
        {
          englishKey: 'capital degrees F',
          expectedNo: 'grader fahrenheit',
          expectedNb: 'grader fahrenheit',
          expectedNn: 'grader fahrenheit'
        },
        {
          englishKey: 'large degrees C',
          expectedNo: 'grader celcius',
          expectedNb: 'grader celcius',
          expectedNn: 'grader celcius'
        },
        {
          englishKey: 'large degrees F',
          expectedNo: 'grader fahrenheit',
          expectedNb: 'grader fahrenheit',
          expectedNn: 'grader fahrenheit'
        },
        {
          englishKey: 'large degrees',
          expectedNo: 'grader',
          expectedNb: 'grader',
          expectedNn: 'grader'
        },
        {
          englishKey: 'to the power of to the power of',
          expectedNo: 'opphøyd i',
          expectedNb: 'opphøyd i',
          expectedNn: 'opphøgt i'
        },
        {
          englishKey: 'to the power of 2',
          expectedNo: 'i annen',
          expectedNb: 'i annen',
          expectedNn: 'i annan'
        },
        {
          englishKey: 'of a set of values',
          expectedNo: 'av et verdisett',
          expectedNb: 'av et verdisett',
          expectedNn: 'av eit verdisett'
        },
        {
          englishKey: 'of a set of values, of a set of values,',
          expectedNo: 'av et verdisett',
          expectedNb: 'av et verdisett',
          expectedNn: 'av eit verdisett'
        },
        {
          englishKey: 'equals',
          expectedNo: 'er lik,',
          expectedNb: 'er lik,',
          expectedNn: 'er lik,'
        },
        {
          englishKey: 'end,',
          expectedNo: 'slutt,',
          expectedNb: 'slutt,',
          expectedNn: 'slutt,'
        },
        {
          englishKey: 'end',
          expectedNo: 'slutt',
          expectedNb: 'slutt',
          expectedNn: 'slutt'
        },
        {
          englishKey: 'start ',
          expectedNo: 'start, ',
          expectedNb: 'start, ',
          expectedNn: 'start, '
        },
        {
          englishKey: 'dot operator',
          expectedNo: 'ganger',
          expectedNb: 'ganger',
          expectedNn: 'gonger'
        },
        {
          englishKey: 'undefined',
          expectedNo: '',
          expectedNb: '',
          expectedNn: ''
        }
      ];

      testCases.forEach(testCase => {
        expect(noTranslationsMap[testCase.englishKey]).toBe(testCase.expectedNo);
        expect(nbTranslationsMap[testCase.englishKey]).toBe(testCase.expectedNb);
        expect(nnTranslationsMap[testCase.englishKey]).toBe(testCase.expectedNn);
      });
    });
  });

  describe('Translation Application', () => {
    test('should apply Bokmål translations correctly', () => {
      const translations = {};
      noTranslations.forEach(t => {
        translations[t.search] = t.replace;
      });

      // Test a complex mathematical expression
      let text = 'equation the function f of x plus y equals the square root of z equation end';

      // Apply translations in order (longer phrases first)
      const sortedTranslations = noTranslations.sort((a, b) => b.search.length - a.search.length);

      sortedTranslations.forEach(t => {
        text = text.replace(new RegExp(t.search, 'g'), t.replace);
      });

      expect(text).toContain('ligning');
      expect(text).toContain('funksjonen');
      expect(text).toContain('kvadratroten');
      expect(text).toContain('er lik');
    });

    test('should apply Nynorsk translations correctly', () => {
      const translations = {};
      nnTranslations.forEach(t => {
        translations[t.search] = t.replace;
      });

      // Test a complex mathematical expression
      let text = 'equation the function f of x times y equals the natural logarithm of z equation end';

      // Apply translations in order (longer phrases first)
      const sortedTranslations = nnTranslations.sort((a, b) => b.search.length - a.search.length);

      sortedTranslations.forEach(t => {
        text = text.replace(new RegExp(t.search, 'g'), t.replace);
      });

      expect(text).toContain('ligning');
      expect(text).toContain('funksjonen');
      expect(text).toContain('gonger'); // Nynorsk for "times"
      expect(text).toContain('den naturlege logaritmen'); // Nynorsk for "the natural logarithm"
    });

    test('should handle Greek letters correctly', () => {
      const translations = {};
      noTranslations.forEach(t => {
        translations[t.search] = t.replace;
      });

      let text = 'equation alpha plus beta equals gamma equation end';

      const sortedTranslations = noTranslations.sort((a, b) => b.search.length - a.search.length);

      sortedTranslations.forEach(t => {
        text = text.replace(new RegExp(t.search, 'g'), t.replace);
      });

      expect(text).toContain('alfa');
      expect(text).toContain('beta');
      expect(text).toContain('gamma');
    });

    test('should handle mathematical operators correctly', () => {
      const translations = {};
      noTranslations.forEach(t => {
        translations[t.search] = t.replace;
      });

      let text = 'equation x plus y minus z times w divided by v equals u equation end';

      const sortedTranslations = noTranslations.sort((a, b) => b.search.length - a.search.length);

      // Use the same translation logic as the actual application (with word boundaries)
      sortedTranslations.forEach(t => {
        const regexString = `\\b(${t.search})\\b`;
        const re = new RegExp(regexString, 'g');
        text = text.replace(re, t.replace);
      });

      expect(text).toContain('pluss');
      expect(text).toContain('minus');
      expect(text).toContain('ganger');
      expect(text).toContain('delt på');
      expect(text).toContain('er lik');
    });
  });

  describe('Translation Consistency', () => {
    test('should maintain consistent terminology across Bokmål variants', () => {
      const noSearchTerms = new Set(noTranslations.map(t => t.search));
      const nbSearchTerms = new Set(nbTranslations.map(t => t.search));

      // Check that both Bokmål variants have the same core terms
      const coreTerms = ['equation', 'function', 'derivative', 'integral', 'fraction', 'square root'];

      coreTerms.forEach(term => {
        expect(noSearchTerms.has(term)).toBe(true);
        expect(nbSearchTerms.has(term)).toBe(true);
      });
    });

    test('should have appropriate Nynorsk differences', () => {
      const noTranslationsMap = {};
      const nnTranslationsMap = {};

      noTranslations.forEach(t => { noTranslationsMap[t.search] = t.replace; });
      nnTranslations.forEach(t => { nnTranslationsMap[t.search] = t.replace; });

      // Check specific Nynorsk differences
      expect(nnTranslationsMap['times']).toBe('gonger');
      expect(noTranslationsMap['times']).toBe('ganger');

      expect(nnTranslationsMap['to the power of']).toBe('opphøgt i');
      expect(noTranslationsMap['to the power of']).toBe('opphøyd i');

      expect(nnTranslationsMap['the natural logarithm']).toBe('den naturlege logaritmen til');
      expect(noTranslationsMap['the natural logarithm']).toBe('den naturlige logaritmen til');
    });
  });

  describe('Translation Quality', () => {
    test('should handle edge cases correctly', () => {
      const translations = {};
      noTranslations.forEach(t => {
        translations[t.search] = t.replace;
      });

      // Test edge cases
      expect(translations['undefined']).toBe('');
      expect(translations['end,']).toBe('slutt,');
      expect(translations['end']).toBe('slutt');
    });

    test('should not have conflicting translations', () => {
      const noTranslationsMap = {};
      const nbTranslationsMap = {};
      const nnTranslationsMap = {};

      noTranslations.forEach(t => { noTranslationsMap[t.search] = t.replace; });
      nbTranslations.forEach(t => { nbTranslationsMap[t.search] = t.replace; });
      nnTranslations.forEach(t => { nnTranslationsMap[t.search] = t.replace; });

      // Check that translations are consistent within each language
      const commonTerms = ['equation', 'function', 'derivative', 'fraction', 'square root'];

      commonTerms.forEach(term => {
        if (noTranslationsMap[term] && nbTranslationsMap[term]) {
          expect(noTranslationsMap[term]).toBe(nbTranslationsMap[term]);
        }
      });
    });

    test('should have comprehensive coverage', () => {
      const allSearchTerms = new Set([
        ...noTranslations.map(t => t.search),
        ...nbTranslations.map(t => t.search),
        ...nnTranslations.map(t => t.search)
      ]);

      // Essential mathematical terms that should be covered
      const essentialTerms = [
        'equation', 'function', 'derivative', 'integral', 'fraction',
        'square root', 'to the power of', 'equals', 'plus', 'minus',
        'times', 'divided by', 'limit', 'vector', 'matrix',
        'alpha', 'beta', 'gamma', 'delta', 'theta', 'pi'
      ];

      const missingTerms = essentialTerms.filter(term => !allSearchTerms.has(term));
      expect(missingTerms).toHaveLength(0);
    });
  });

  describe('Real-world Examples', () => {
    test('should handle complex mathematical expressions', () => {
      const translations = {};
      noTranslations.forEach(t => {
        translations[t.search] = t.replace;
      });

      // Simulate a complex mathematical expression
      let text = 'equation the derivative of the function f of x equals the limit with the lower index h approaches 0 of fraction with counter the function f of x plus h minus the function f of x and denominator h fraction end equation end';

      const sortedTranslations = noTranslations.sort((a, b) => b.search.length - a.search.length);

      sortedTranslations.forEach(t => {
        text = text.replace(new RegExp(t.search, 'g'), t.replace);
      });

      // Check that key terms are translated
      expect(text).toContain('ligning');
      expect(text).toContain('den deriverte');
      expect(text).toContain('funksjonen');
      expect(text).toContain('grense');
      expect(text).toContain('brøk');
      expect(text).toContain('teller');
      expect(text).toContain('nevner');
    });

    test('should handle physics formulas', () => {
      const translations = {};
      noTranslations.forEach(t => {
        translations[t.search] = t.replace;
      });

      let text = 'equation capital degrees C equals 273 kelvin equation end';

      const sortedTranslations = noTranslations.sort((a, b) => b.search.length - a.search.length);

      sortedTranslations.forEach(t => {
        text = text.replace(new RegExp(t.search, 'g'), t.replace);
      });

      expect(text).toContain('grader celcius');
      expect(text).toContain('kelvin');
      expect(text).toContain('er lik');
    });
  });
});
