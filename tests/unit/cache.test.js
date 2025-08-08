/* eslint-disable complexity, max-depth, max-lines, no-unused-vars */

const { MathMLCache, mathMLCache } = require('../../src/cache');

describe('Cache Tests', () => {
  let testCache;

  beforeEach(() => {
    testCache = new MathMLCache(5); // Small cache for testing
  });

  afterEach(() => {
    testCache.clear();
  });

  test('should generate consistent cache keys', () => {
    const mathML1 = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>';
    const mathML2 = '<math xmlns="http://www.w3.org/1998/Math/MathML">  <mn>1</mn>  <mo>+</mo>  <mn>2</mn>  </math>';
    const alixThresholds = { noImage: 25, noEquationText: 12 };

    const key1 = testCache.generateKey(mathML1, alixThresholds);
    const key2 = testCache.generateKey(mathML2, alixThresholds);

    expect(key1).toBe(key2);
  });

  test('should handle different ALIX thresholds', () => {
    const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>';
    const thresholds1 = { noImage: 25, noEquationText: 12 };
    const thresholds2 = { noImage: 30, noEquationText: 15 };

    const key1 = testCache.generateKey(mathML, thresholds1);
    const key2 = testCache.generateKey(mathML, thresholds2);

    expect(key1).not.toBe(key2);
  });

  test('should store and retrieve cached results', () => {
    const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>';
    const alixThresholds = { noImage: 25, noEquationText: 12 };
    const result = { success: true, words: ['1', 'plus', '2'], alix: 5 };

    const key = testCache.generateKey(mathML, alixThresholds);

    // Initially not in cache
    expect(testCache.get(key)).toBeNull();

    // Store in cache
    testCache.set(key, result);

    // Should be retrievable
    expect(testCache.get(key)).toEqual(result);
  });

  test('should implement LRU eviction', () => {
    const alixThresholds = { noImage: 25, noEquationText: 12 };

    // Fill cache to capacity
    for (let i = 0; i < 5; i++) {
      const mathML = `<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>${i}</mn></math>`;
      const key = testCache.generateKey(mathML, alixThresholds);
      const result = { success: true, words: [`${i}`], alix: i };
      testCache.set(key, result);
    }

    expect(testCache.cache.size).toBe(5);

    // Add one more item
    const newMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>new</mn></math>';
    const newKey = testCache.generateKey(newMathML, alixThresholds);
    const newResult = { success: true, words: ['new'], alix: 10 };
    testCache.set(newKey, newResult);

    // Should still be at max size
    expect(testCache.cache.size).toBe(5);

    // Oldest item (0) should be evicted
    const oldestKey = testCache.generateKey('<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>0</mn></math>', alixThresholds);
    expect(testCache.get(oldestKey)).toBeNull();

    // Newest item should still be there
    expect(testCache.get(newKey)).toEqual(newResult);
  });

  test('should track cache statistics', () => {
    const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>';
    const alixThresholds = { noImage: 25, noEquationText: 12 };
    const result = { success: true, words: ['1', 'plus', '2'], alix: 5 };

    const key = testCache.generateKey(mathML, alixThresholds);

    // Miss
    testCache.trackAccess(false);
    expect(testCache.getStats().missCount).toBe(1);

    // Store and hit
    testCache.set(key, result);
    testCache.trackAccess(true);
    expect(testCache.getStats().hitCount).toBe(1);

    const stats = testCache.getStats();
    expect(stats.hitRate).toBe(0.5); // 1 hit, 1 miss
    expect(stats.totalRequests).toBe(2);
  });

  test('should normalize MathML content', () => {
    const mathML1 = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>';
    const mathML2 = '<math xmlns="http://www.w3.org/1998/Math/MathML">  <mn>1</mn>  <mo>+</mo>  <mn>2</mn>  </math>';
    const mathML3 = '<m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:mn>1</m:mn><m:mo>+</m:mo><m:mn>2</m:mn></m:math>';

    const normalized1 = testCache.normalizeMathML(mathML1);
    const normalized2 = testCache.normalizeMathML(mathML2);
    const normalized3 = testCache.normalizeMathML(mathML3);

    expect(normalized1).toBe(normalized2);
    expect(normalized1).toBe('<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>');
    expect(normalized3).toBe('<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>');
  });

  test('should clear cache', () => {
    const mathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>1</mn><mo>+</mo><mn>2</mn></math>';
    const alixThresholds = { noImage: 25, noEquationText: 12 };
    const result = { success: true, words: ['1', 'plus', '2'], alix: 5 };

    const key = testCache.generateKey(mathML, alixThresholds);
    testCache.set(key, result);

    expect(testCache.cache.size).toBe(1);

    testCache.clear();

    expect(testCache.cache.size).toBe(0);
    expect(testCache.accessOrder.length).toBe(0);
  });
});
