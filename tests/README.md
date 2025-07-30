# Test Organization

This directory contains all tests for the service-stem project, organized by type and purpose.

## Directory Structure

### `/unit/`

Unit tests for individual modules and functions:

- `conversions/` - Tests for text, ASCII, and SVG conversion modules
- `cache.test.js` - Cache functionality tests
- `template.test.js` - Template generation tests

### `/integration/`

Integration tests that test the full application flow:

- `integration.test.js` - Main application integration tests

### `/api/`

API endpoint tests:

- `api.test.js` - Basic API endpoint tests
- `api-compatibility.test.js` - API compatibility tests
- `norwegian-api.test.js` - Norwegian-specific API tests

### `/performance/`

Performance and load testing:

- `performance.test.js` - Performance benchmarks and memory usage tests

### `/validation/`

Validation and documentation tests:

- `validation.test.js` - MathML validation tests
- `documentation.test.js` - Documentation consistency tests

### `/backward-compatibility/`

Backward compatibility and migration tests:

- `backward-compatibility.test.js` - Legacy format support tests
- `migration-endpoints.test.js` - Migration endpoint tests
- `dependency-compatibility.test.js` - Dependency compatibility tests
- `regression.test.js` - Regression tests
- `new-mathml-patterns.test.js` - New MathML pattern tests

### `/translations/`

Translation and localization tests:

- `norwegian-translations.test.js` - Norwegian translation tests

### `/guidelines/nordic/`

Nordic MathML Guidelines compliance tests:

- `item1-namespace.test.js` - Namespace handling tests
- `item2-mfenced.test.js` - mfenced deprecation tests
- `item3-display.test.js` - Display attribute tests
- `item4-alttext-altimg.test.js` - Alttext/altimg deprecation tests
- `item5-invisible-operators.test.js` - Invisible operators tests
- `item6-special-characters.test.js` - Special characters tests
- `item7-chemistry-markup.test.js` - Chemistry markup tests
- `item8-labeled-equations.test.js` - Labeled equations tests
- `item9-crossed-out-math.test.js` - Crossed out math tests
- `item10-fill-in-the-blanks.test.js` - Fill-in-the-blanks tests
- `item11-units-and-numbers.test.js` - Units and numbers tests

## Running Tests

- Run all tests: `npm test`
- Run specific test categories: `npm test -- tests/unit/`
- Run with coverage: `npm test -- --coverage`
- Run specific test file: `npm test -- tests/unit/text.test.js`

## Test Categories

- **Unit Tests**: Test individual functions and modules in isolation
- **Integration Tests**: Test the full application flow and endpoints
- **API Tests**: Test API endpoints and responses
- **Performance Tests**: Test performance, memory usage, and caching
- **Validation Tests**: Test input validation and documentation
- **Backward Compatibility Tests**: Test legacy format support and migration
- **Translation Tests**: Test localization and translation features
- **Guidelines Tests**: Test compliance with Nordic MathML Guidelines
