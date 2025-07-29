# Service-STEM API Documentation

## Overview

The Service-STEM API is a microservice that generates accessible text content and images from MathML markup. The service follows the Nordic MathML Guidelines to ensure proper accessibility and compliance with mathematical content standards.

## Base URL

```text
http://[HOST]:[PORT]
```

## Authentication

No authentication is required for this service.

## Endpoints

### Health Check

**GET** `/health`

Returns the health status of the service.

**Response:**

```json
{
  "name": "service-stem",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### MathML Processing

**POST** `/`

Processes MathML content and returns accessible text representations.

**Request Body:**

```json
{
  "contentType": "math",
  "content": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\">...</math>"
}
```

**Query Parameters:**

- `noImage` (optional): ALIX threshold for image generation (default: 25)
- `noEquationText` (optional): ALIX threshold for equation text (default: 12)

**Response:**

```json
{
  "success": true,
  "input": {
    "mathml": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\">...</math>"
  },
  "output": {
    "text": {
      "words": ["3", "minus", "2", "equals", "1"],
      "translated": "3 minus 2 equals 1",
      "latex": "3-2=1",
      "ascii": "3-2=1",
      "html": "<div class=\"math-content\">...</div>"
    },
    "image": {
      "path": null
    },
    "attributes": {
      "language": "en",
      "alix": 15,
      "alixThresholdNoImage": 25,
      "alixThresholdNoEquationText": 12
    }
  }
}
```

## MathML Requirements

### Namespace Declaration

**Required:** All MathML content must use the direct namespace declaration:

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML">
```

**Deprecated:** The `m:` namespace prefix is no longer supported:

```xml
<!-- DEPRECATED - Do not use -->
<m:math xmlns:m="http://www.w3.org/1998/Math/MathML">
```

### Display Attribute

The `display` attribute controls how mathematical expressions are rendered:

- **`inline`** (default): Expression appears within text
- **`block`**: Expression appears as a separate block

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

### Language Support

Specify the language using the `xml:lang` attribute:

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>3</mn><mo>+</mo><mn>2</mn>
</math>
```

Supported languages: `en`, `no`, `da`, `sv`, `fi`, `nl`, `nn`

## MathML Elements and Guidelines

### Basic Mathematical Elements

**Numbers:**

```xml
<mn>3</mn>        <!-- Number -->
<mn>3.14</mn>     <!-- Decimal -->
<mn>-5</mn>       <!-- Negative number -->
```

**Variables:**

```xml
<mi>x</mi>        <!-- Variable -->
<mi>y</mi>        <!-- Variable -->
<mi>α</mi>        <!-- Greek letter -->
```

**Operators:**

```xml
<mo>+</mo>        <!-- Plus -->
<mo>-</mo>        <!-- Minus -->
<mo>=</mo>        <!-- Equals -->
<mo>(</mo>        <!-- Opening parenthesis -->
<mo>)</mo>        <!-- Closing parenthesis -->
```

### Invisible Operators

The Nordic MathML Guidelines specify invisible operators for unambiguous mathematical expressions:

```xml
<!-- Invisible multiplication -->
<mo>&#x2062;</mo>

<!-- Invisible function application -->
<mo>&#x2061;</mo>

<!-- Invisible plus -->
<mo>&#x2064;</mo>

<!-- Invisible comma -->
<mo>&#x2063;</mo>
```

**Examples:**

```xml
<!-- 3x (invisible multiplication) -->
<mn>3</mn><mo>&#x2062;</mo><mi>x</mi>

<!-- f(x) (invisible function application) -->
<mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo>

<!-- 100 m (number with unit) -->
<mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi>
```

### Special Characters

Use proper Unicode characters for mathematical symbols:

```xml
<!-- Minus sign (not hyphen) -->
<mo>&#x2212;</mo>

<!-- Prime -->
<mo>&#x2032;</mo>

<!-- Element of -->
<mo>&#x2208;</mo>

<!-- Greek letters -->
<mi>&#x3B1;</mi>  <!-- alpha -->
<mi>&#x3B2;</mi>  <!-- beta -->
<mi>&#x3B3;</mi>  <!-- gamma -->
```

### Chemistry Markup

**Chemical formulas:**

```xml
<!-- H₂O -->
<msub><mi>H</mi><mn>2</mn></msub><mi>O</mi>

<!-- CO₂ -->
<mi>C</mi><msub><mi>O</mi><mn>2</mn></msub>

<!-- Isotope notation -->
<mmultiscripts>
  <mi>C</mi>
  <mn>14</mn>
  <none/>
  <mn>6</mn>
</mmultiscripts>
```

### Labeled Equations

Use `<mtable>` for labeled equations:

```xml
<mtable>
  <mtr>
    <mtd><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></mtd>
    <mtd><mo>(</mo><mn>1</mn><mo>)</mo></mtd>
  </mtr>
</mtable>
```

### Crossed Out Math

Use `<menclose>` for crossed out mathematical expressions:

```xml
<menclose notation="updiagonalstrike">
  <mn>3</mn><mo>+</mo><mn>2</mn>
</menclose>
```

### Fill-in-the-blanks

Use Unicode symbol `&#x9109;` (⎕) for blank spaces:

```xml
<mn>3</mn><mo>+</mo><mi>&#x9109;</mi><mo>=</mo><mn>5</mn>
```

### Units

Use `mathvariant="normal"` for units:

```xml
<mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi>
<mn>50</mn><mo>&#x2062;</mo><mi mathvariant="normal">km/h</mi>
```

## Deprecated Elements and Attributes

### Deprecated Elements

The following elements are deprecated and will cause validation errors:

- `<mfenced>` - Use `<mo>` elements for parentheses instead
- `<semantics>` - Not required unless specifically requested
- `<annotation>` - Not required unless specifically requested  
- `<annotation-xml>` - Not required unless specifically requested

### Deprecated Attributes

The following attributes are deprecated and will generate warnings:

- `alttext` - MathML support has improved, making this unnecessary
- `altimg` - MathML support has improved, making this unnecessary

## Error Handling

### Validation Errors

When MathML validation fails, the service returns a 400 status with detailed error information:

```json
{
  "success": false,
  "error": "MathML validation failed",
  "validationErrors": [
    "Deprecated element <mfenced> is not allowed. Use <mo> elements for parentheses instead."
  ],
  "validationWarnings": [
    "alttext attribute is deprecated. MathML support has improved and this attribute should not be used."
  ]
}
```

### Common Error Codes

- **400**: Invalid request (missing content, validation errors)
- **500**: Internal server error
- **501**: Unsupported content type

## Examples

### Basic Arithmetic

```bash
curl -H 'Content-Type: application/json' \
  -d '{
    "contentType": "math",
    "content": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" xml:lang=\"en\"><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></math>"
  }' \
  -X POST \
  http://localhost:3000/
```

### Complex Expression with Invisible Operators

```bash
curl -H 'Content-Type: application/json' \
  -d '{
    "contentType": "math",
    "content": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><mn>3</mn><mo>&#x2062;</mo><mi>x</mi><mo>+</mo><mn>2</mn><mo>&#x2062;</mo><mi>y</mi><mo>=</mo><mn>10</mn></math>"
  }' \
  -X POST \
  http://localhost:3000/
```

### Chemistry Formula

```bash
curl -H 'Content-Type: application/json' \
  -d '{
    "contentType": "math",
    "content": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi></math>"
  }' \
  -X POST \
  http://localhost:3000/
```

## Best Practices

1. **Always use the direct namespace declaration** - `xmlns="http://www.w3.org/1998/Math/MathML"`
2. **Use invisible operators** for unambiguous mathematical expressions
3. **Use proper Unicode characters** for mathematical symbols
4. **Specify language** using `xml:lang` attribute
5. **Use `display="block"`** only for standalone mathematical expressions
6. **Avoid deprecated elements and attributes**
7. **Place `<math>` elements within paragraph elements** - never as standalone blocks
8. **Use `mathvariant="normal"`** for units and non-mathematical text

## Rate Limiting

No rate limiting is currently implemented.

## Support

For issues and questions related to the Nordic MathML Guidelines, please refer to the official documentation or contact the Nordic agencies.
