// Jest setup file for common test configurations

// Suppress console warnings during tests unless explicitly needed
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // Suppress deprecation warnings during tests unless explicitly testing them
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  // Helper to create MathML test content
  createMathML: (content, attributes = {}) => {
    const attrString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    return `<math xmlns="http://www.w3.org/1998/Math/MathML" ${attrString}>${content}</math>`;
  },

  // Helper to create legacy MathML with m: prefix
  createLegacyMathML: (content, attributes = {}) => {
    const attrString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    return `<m:math xmlns:m="http://www.w3.org/1998/Math/MathML" ${attrString}>${content}</m:math>`;
  },

  // Helper to check if console warnings were called
  expectWarnings: (warnings) => {
    if (Array.isArray(warnings)) {
      warnings.forEach(warning => {
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(warning));
      });
    } else {
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(warnings));
    }
  },

  // Helper to clear console mocks
  clearConsoleMocks: () => {
    console.warn.mockClear();
    console.error.mockClear();
  }
};
