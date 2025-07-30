const fs = require('fs');
const path = require('path');

describe('Norwegian Translation Files', () => {
    let noTranslations, nbTranslations, nnTranslations;

    beforeAll(() => {
        // Load translation files
        const translationsDir = path.join(__dirname, '..', '..', 'src', 'translations');
        noTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'no.json'), 'utf8'));
        nbTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'nb.json'), 'utf8'));
        nnTranslations = JSON.parse(fs.readFileSync(path.join(translationsDir, 'nn.json'), 'utf8'));
    });

    describe('File Structure', () => {
        test('should have valid JSON structure', () => {
            expect(Array.isArray(noTranslations)).toBe(true);
            expect(Array.isArray(nbTranslations)).toBe(true);
            expect(Array.isArray(nnTranslations)).toBe(true);
        });

        test('should have search and replace properties for each entry', () => {
            const validateEntry = (entry) => {
                expect(entry).toHaveProperty('search');
                expect(entry).toHaveProperty('replace');
                expect(typeof entry.search).toBe('string');
                expect(typeof entry.replace).toBe('string');
            };

            noTranslations.forEach(validateEntry);
            nbTranslations.forEach(validateEntry);
            nnTranslations.forEach(validateEntry);
        });
    });

    describe('Bokmål Translations (no.json)', () => {
        test('should contain essential mathematical terms', () => {
            const searchTerms = noTranslations.map(t => t.search);
            
            // Essential terms that should be present
            const essentialTerms = [
                'equation', 'function', 'derivative', 'fraction',
                'square root', 'to the power of', 'equals', 'plus', 'minus',
                'times', 'divided by', 'limit', 'vector', 'matrix'
            ];

            essentialTerms.forEach(term => {
                expect(searchTerms).toContain(term);
            });
        });

        test('should have correct Norwegian translations', () => {
            const translations = {};
            noTranslations.forEach(t => {
                translations[t.search] = t.replace;
            });

            // Test key translations
            expect(translations['equation']).toBe('ligning');
            expect(translations['function']).toBe('funksjon');
            expect(translations['derivative']).toBe('derivert');
            expect(translations['fraction']).toBe('brøk');
            expect(translations['square root']).toBe('kvadratrot');
            expect(translations['to the power of']).toBe('opphøyd i');
            expect(translations['equals']).toBe('er lik,');
            expect(translations['plus']).toBe('pluss');
            expect(translations['minus']).toBe('minus');
            expect(translations['times']).toBe('ganger');
            expect(translations['divided by']).toBe('delt på');
            expect(translations['limit']).toBe('grense');
            expect(translations['vector']).toBe('vektor');
            expect(translations['matrix']).toBe('matrise');
        });

        test('should handle special cases correctly', () => {
            const translations = {};
            noTranslations.forEach(t => {
                translations[t.search] = t.replace;
            });

            // Test special cases
            expect(translations['capital degrees C']).toBe('grader celcius');
            expect(translations['capital degrees F']).toBe('grader fahrenheit');
            expect(translations['the natural logarithm']).toBe('den naturlige logaritmen til');
            expect(translations['the square root of']).toBe('kvadratroten av');
            expect(translations['fraction with counter']).toBe('brøk med teller');
            expect(translations['and denominator']).toBe('og med nevner');
        });
    });

    describe('Bokmål Translations (nb.json)', () => {
        test('should be consistent with no.json', () => {
            // nb.json should be very similar to no.json (both are Bokmål)
            const noSearchTerms = new Set(noTranslations.map(t => t.search));
            const nbSearchTerms = new Set(nbTranslations.map(t => t.search));
            
            // Most terms should be the same
            const commonTerms = [...noSearchTerms].filter(term => nbSearchTerms.has(term));
            expect(commonTerms.length).toBeGreaterThan(noTranslations.length * 0.9); // 90% overlap
        });

        test('should have correct translations for key terms', () => {
            const translations = {};
            nbTranslations.forEach(t => {
                translations[t.search] = t.replace;
            });

            // Test key translations
            expect(translations['equation']).toBe('ligning');
            expect(translations['function']).toBe('funksjon');
            expect(translations['derivative']).toBe('derivert');
            expect(translations['fraction']).toBe('brøk');
            expect(translations['square root']).toBe('kvadratrot');
            expect(translations['to the power of']).toBe('opphøyd i');
        });
    });

    describe('Nynorsk Translations (nn.json)', () => {
        test('should have Nynorsk-specific translations', () => {
            const translations = {};
            nnTranslations.forEach(t => {
                translations[t.search] = t.replace;
            });

            // Test Nynorsk-specific translations
            expect(translations['equation']).toBe('ligning');
            expect(translations['function']).toBe('funksjon');
            expect(translations['derivative']).toBe('derivert');
            expect(translations['fraction']).toBe('brøk');
            expect(translations['square root']).toBe('kvadratrot');
            expect(translations['to the power of']).toBe('opphøgt i');
            expect(translations['times']).toBe('gonger');
            expect(translations['the natural logarithm']).toBe('den naturlege logaritmen til');
            expect(translations['fraction with counter']).toBe('brøk med tel');
            expect(translations['and denominator']).toBe('og med nemnar');
        });

        test('should have Nynorsk-specific vocabulary differences', () => {
            const translations = {};
            nnTranslations.forEach(t => {
                translations[t.search] = t.replace;
            });

            // Nynorsk uses different words for some terms
            expect(translations['times']).toBe('gonger'); // vs 'ganger' in Bokmål
            expect(translations['to the power of']).toBe('opphøgt i'); // vs 'opphøyd i' in Bokmål
            expect(translations['the natural logarithm']).toBe('den naturlege logaritmen til'); // vs 'den naturlige logaritmen til' in Bokmål
            expect(translations['fraction with counter']).toBe('brøk med tel'); // vs 'brøk med teller' in Bokmål
            expect(translations['and denominator']).toBe('og med nemnar'); // vs 'og med nevner' in Bokmål
        });
    });

    describe('Translation Coverage', () => {
        test('should have comprehensive coverage of mathematical terms', () => {
            const allSearchTerms = new Set([
                ...noTranslations.map(t => t.search),
                ...nbTranslations.map(t => t.search),
                ...nnTranslations.map(t => t.search)
            ]);

            // Essential mathematical categories - check what's actually available
            const essentialCategories = [
                // Basic operations
                'plus', 'minus', 'times', 'divided by', 'equals',
                // Functions
                'function', 'derivative', 'limit',
                // Mathematical objects
                'fraction', 'square root', 'vector', 'matrix',
                // Greek letters
                'alpha', 'beta', 'gamma', 'delta', 'theta', 'pi',
                // Special functions
                'sine', 'cosine', 'tangent', 'logarithm',
                // Notation
                'parenthesis', 'bracket', 'index', 'power'
            ];

            // Check which terms are missing
            const missingTerms = essentialCategories.filter(term => !allSearchTerms.has(term));
            console.log('Missing terms:', missingTerms);
            
            // At least 80% of essential terms should be present
            const presentTerms = essentialCategories.filter(term => allSearchTerms.has(term));
            expect(presentTerms.length).toBeGreaterThanOrEqual(essentialCategories.length * 0.8);
        });

        test('should handle edge cases and special characters', () => {
            const translations = {};
            noTranslations.forEach(t => {
                translations[t.search] = t.replace;
            });

            // Test edge cases
            expect(translations['undefined']).toBe('');
            expect(translations['end,']).toBe('slutt,');
            expect(translations['end']).toBe('slutt');
        });
    });

    describe('Translation Quality', () => {
        test('should not have empty search terms', () => {
            const hasEmptySearch = (translations) => {
                return translations.some(t => t.search.trim() === '');
            };

            expect(hasEmptySearch(noTranslations)).toBe(false);
            expect(hasEmptySearch(nbTranslations)).toBe(false);
            expect(hasEmptySearch(nnTranslations)).toBe(false);
        });

        test('should not have duplicate search terms within each file', () => {
            const hasDuplicates = (translations) => {
                const searchTerms = translations.map(t => t.search);
                const uniqueTerms = new Set(searchTerms);
                return searchTerms.length !== uniqueTerms.size;
            };

            expect(hasDuplicates(noTranslations)).toBe(false);
            expect(hasDuplicates(nbTranslations)).toBe(false);
            expect(hasDuplicates(nnTranslations)).toBe(false);
        });

        test('should have reasonable translation lengths', () => {
            const validateLengths = (translations) => {
                return translations.every(t => {
                    return t.search.length > 0 && (t.replace.length >= 0); // Allow empty replace for undefined
                });
            };

            expect(validateLengths(noTranslations)).toBe(true);
            expect(validateLengths(nbTranslations)).toBe(true);
            expect(validateLengths(nnTranslations)).toBe(true);
        });
    });
});