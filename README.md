# service-stem

A microservice to generate text content and images based on MathML, following the Nordic MathML Guidelines for accessibility and compliance.

## Documentation

- **[API Documentation](docs/API.md)** - Complete API reference and usage examples
- **[Developer Documentation](docs/DEVELOPER.md)** - Internal implementation details and guidelines
- **[MathML Examples](docs/MATHML_EXAMPLES.md)** - Comprehensive examples of MathML markup patterns
- **[Nordic MathML Guidelines](https://github.com/nlbdev/mathml-guidelines)** - Official guidelines repository

## Installation

### For local development

1. Clone this repository
    - Install: GitKraken and follow their guide on [how to clone a repo](https://www.gitkraken.com/learn/git/git-clone)
2. Install pre-requisites: NodeJS 14.19.3 <https://nodejs.org/en/blog/release/v14.19.3/> (Due to a bug in SSL, we cannot use the latest stable)
3. Create a new file in the root folder for the repo called: `.env` and copy the content from `config.env.example` and fill in the required environment variables
4. Inside the repo in GitKraken, press "Show/hide terminal"
5. Type `npm i -g nodemon pnpm`
6. Type `pnpm install`
7. Type `pnpm dev`
8. The service should now be running locally with the host details specified in the `.env` file - you can edit the files and it will update the service continuously.

### For live servers

1. Install Docker <https://www.docker.com/>
2. Create a new file on root folder for the repo called: `.env` and copy the content from `config.env.example` and fill in the required environment variables
3. Build the Docker image with `pnpm build`
4. Run the Docker image in any Docker environment, the health check will report if the container is healthy or not
5. You can access the container through your normal production environment with the host details specified in the `.env` file

## Quick Start

### Basic Usage

Use "curl" from the command-line to test this service. Replace `[HOST]` and `[PORT]` with appropriate values from the `.env` file.

### New MathML Format (Required)

The Nordic MathML Guidelines require using the direct namespace declaration:

```bash
curl -H 'Content-Type: application/json' \
      -d '{ "contentType": "math", "content": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" xml:lang=\"en\" display=\"block\"><mn>3</mn><mo>-</mo><mn>2</mn><mo>=</mo><mn>1</mn></math>" }' \
      -X POST \
      http://[HOST]:[PORT]/
```

### Key Requirements

**Namespace Declaration:**

```xml
<!-- REQUIRED - New format -->
<math xmlns="http://www.w3.org/1998/Math/MathML">

<!-- DEPRECATED - Old format (no longer supported) -->
<m:math xmlns:m="http://www.w3.org/1998/Math/MathML">
```

**Display Attribute:**

```xml
<!-- Inline math (default) -->
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mn>3</mn><mo>+</mo><mn>2</mn>
</math>

<!-- Block math -->
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn>
</math>
```

**Important:** The `<math>` element should never be a standalone block element. Always place it within a paragraph element or equivalent.

### Deprecated Elements

The following elements are deprecated and will cause validation errors:

- `<mfenced>` - Use `<mo>` elements for parentheses instead
- `<semantics>` - Not required unless specifically requested
- `<annotation>` - Not required unless specifically requested
- `<annotation-xml>` - Not required unless specifically requested

### Invisible Operators

The Nordic MathML Guidelines specify invisible operators for unambiguous mathematical expressions:

```xml
<!-- Invisible multiplication -->
<mn>3</mn><mo>&#x2062;</mo><mi>x</mi>

<!-- Invisible function application -->
<mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo>

<!-- Numbers with units -->
<mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi>
```

### Special Character Handling

Use proper Unicode characters for mathematical symbols:

```xml
<!-- Minus sign (not hyphen) -->
<mo>&#x2212;</mo>

<!-- Prime -->
<mo>&#x2032;</mo>

<!-- Greek letters -->
<mi>&#x3B1;</mi>  <!-- alpha -->
<mi>&#x3B2;</mi>  <!-- beta -->
```

## Testing

Run the test suite to validate functionality:

```bash
pnpm test
```

The test suite includes:

- Unit tests for validation and conversion logic
- Integration tests for API endpoints
- Documentation tests for MathML examples

## API Reference

For complete API documentation, examples, and best practices, see:

- **[API Documentation](docs/API.md)** - Complete API reference
- **[MathML Examples](docs/MATHML_EXAMPLES.md)** - Comprehensive examples
- **[Developer Documentation](docs/DEVELOPER.md)** - Implementation details

## Compliance

This service implements the Nordic MathML Guidelines to ensure:

- Proper accessibility for screen readers and braille displays
- Consistent mathematical content interpretation
- Compliance with international MathML standards
- Support for multiple languages (en, no, da, sv, fi, nl, nn)

## Support

For issues and questions related to the Nordic MathML Guidelines, please refer to the official documentation or contact the Nordic agencies.

For technical support with this service, please check the documentation or create an issue in the repository.
