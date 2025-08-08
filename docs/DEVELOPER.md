# Developer Documentation

## Overview

This document provides internal documentation for developers working on the service-stem microservice. It covers implementation details, architecture decisions, and guidelines for maintaining the service.

## Architecture

### Core Components

1. **Main Service** (`index.js`)
   - Express.js web server
   - MathML validation and processing
   - Response generation
   - **New:** Migration endpoints (`/migrate`, `/detect-version`)

2. **Validation Module** (`validation.js`)
   - MathML content validation
   - Nordic MathML Guidelines compliance checking
   - Error and warning reporting

3. **Backward Compatibility Module** (`backward-compatibility.js`)
   - **New:** Version detection and analysis
   - **New:** Content migration strategies
   - **New:** Migration recommendations
   - **New:** Legacy feature identification

4. **Conversion Modules** (`conversions/`)
   - `text.js`: MathML to text conversion
   - `ascii.js`: MathML to ASCIIMath conversion
   - `svg.js`: MathML to SVG conversion (if needed)
   - `alix.js`: ALIX accessibility scoring

5. **Configuration** (`configurations/`)
   - `appConfig.js`: Application configuration

6. **Templates** (`templates/`)
   - `accessibleHtmlWithAlix.ejs`: HTML template generation

7. **Translations** (`translations/`)
   - Language-specific translation files

## MathML Processing Pipeline

### 1. Request Validation

- Validate required fields (`contentType`, `content`)
- Check content type is supported (`math`, `chemistry`, `physics`, `other`)

### 2. Version Detection (New)

- **New:** Detect MathML version and compatibility mode
- **New:** Identify legacy features and migration requirements
- **New:** Generate migration recommendations

### 3. MathML Validation

- Parse XML structure
- Validate namespace declaration
- Check for deprecated elements and attributes
- Validate display attribute values
- Generate validation errors and warnings

### 4. Content Processing

- Remove deprecated elements (semantics, annotations)
- Convert deprecated elements (mfenced → mo)
- Handle both old and new namespace formats
- Extract language and display attributes
- **New:** Apply migration strategies for legacy content

### 5. Text Generation

- Convert MathML to word array
- Apply language-specific translations
- Generate LaTeX and ASCIIMath representations
- Create accessible HTML with ALIX scoring

### 6. Response Assembly

- Structure response with input/output format
- Include validation warnings
- Add metadata (language, ALIX scores, thresholds)
- **New:** Include migration information and recommendations

## Nordic MathML Guidelines Implementation

### Namespace Handling

**New Format (Required):**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML">
```

**Legacy Format (Deprecated):**

```xml
<m:math xmlns:m="http://www.w3.org/1998/Math/MathML">
```

The service validates and requires the new namespace format while providing backward compatibility for legacy content.

### Display Attribute Logic

According to the Nordic MathML Guidelines:

- **Default**: `inline` (no attribute needed)
- **Block**: `display="block"` for standalone expressions
- **Validation**: Only `inline` and `block` values are accepted
- **Structure**: `<math>` elements should never be standalone blocks

### Deprecated Elements

The following elements are deprecated and cause validation errors:

1. **`<mfenced>`** - Converted to `<mo>` elements for backward compatibility
2. **`<semantics>`** - Removed unless specifically requested
3. **`<annotation>`** - Removed unless specifically requested
4. **`<annotation-xml>`** - Removed unless specifically requested

### Deprecated Attributes

The following attributes generate warnings but don't cause validation failures:

1. **`alttext`** - Deprecated due to improved MathML support
2. **`altimg`** - Deprecated due to improved MathML support

### Invisible Operators

The service supports the new invisible operator Unicode codes:

- **Invisible multiplication**: `&#x2062;` (U+2062)
- **Invisible function application**: `&#x2061;` (U+2061)
- **Invisible plus**: `&#x2064;` (U+2064)
- **Invisible comma**: `&#x2063;` (U+2063)

### Special Character Handling

The service properly handles mathematical symbols:

- **Minus sign**: `&#x2212;` vs hyphen `-`
- **Prime**: `&#x2032;` vs apostrophe `'`
- **Greek letters**: Proper distinction from Latin letters
- **Element of**: `&#x2208;` vs epsilon `&#x03B5;`

## Validation Implementation

### Validation Levels

1. **Structure Validation**
   - XML syntax checking
   - Balanced tag validation
   - Required element presence

2. **Namespace Validation**
   - Correct namespace declaration
   - Rejection of deprecated `m:` prefix

3. **Attribute Validation**
   - Display attribute values
   - Deprecated attribute warnings

4. **Element Validation**
   - Deprecated element detection
   - Element-specific validation rules

### Error Handling

The validation system provides:

- **Errors**: Prevent processing (deprecated elements, invalid namespace)
- **Warnings**: Allow processing but notify user (deprecated attributes)
- **Info**: Informational messages (display attribute usage)

## Testing Strategy

### Test Categories

1. **Unit Tests** (`tests/unit/`)
   - Individual function testing
   - Validation logic testing
   - Conversion module testing

2. **Integration Tests** (`tests/integration/`)
   - End-to-end API testing
   - Request/response validation
   - Error handling testing

3. **Backward Compatibility Tests** (`tests/backward-compatibility/`)
   - **New:** Version detection testing
   - **New:** Migration functionality testing
   - **New:** Legacy content handling
   - **New:** Migration endpoint validation

4. **Guidelines Compliance Tests** (`tests/guidelines/2024-1/`)
   - **New:** Nordic MathML Guidelines 2024 validation
   - **New:** Namespace compliance testing
   - **New:** Deprecated element detection
   - **New:** Special character validation

5. **Documentation Tests** (`tests/validation/`)
   - API documentation example validation
   - MathML requirement compliance

### Test Data

Test files include examples of:

- Valid MathML content
- Invalid MathML content
- Deprecated elements and attributes
- Special characters and operators
- Chemistry markup
- Labeled equations

## Configuration

### Environment Variables

Required environment variables (see `config.env.example`):

- `PORT`: Service port
- `HOST`: Service host
- `NODE_ENV`: Environment (development/production)

### ALIX Thresholds

- **Default noImage**: 25
- **Default noEquationText**: 12
- **Configurable**: Via query parameters

## Error Handling

### HTTP Status Codes

- **200**: Successful processing
- **400**: Bad request (validation errors, missing content)
- **500**: Internal server error
- **501**: Unsupported content type

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "validationErrors": ["Error details"],
  "validationWarnings": ["Warning details"]
}
```

## Performance Considerations

### Caching

- No caching implemented currently
- Consider adding caching for frequently used MathML patterns

### Memory Usage

- XML parsing uses fast-xml-parser for efficiency
- Large MathML content may require memory optimization

### Processing Time

- Validation adds minimal overhead
- Text generation is the most time-consuming operation
- Consider async processing for large content

## Security Considerations

### Input Validation

- XML injection prevention through validation
- Content length limits (if needed)
- Malicious content detection

### Output Sanitization

- HTML output sanitization in templates
- XSS prevention in generated HTML

## Monitoring and Logging

### Logging

- Request logging with timestamps
- Validation warnings and errors
- Performance metrics (if needed)

### Health Checks

- `/health` endpoint for service monitoring
- Basic service status information

## Future Enhancements

### Planned Features

1. **Enhanced Chemistry Support**
   - More chemistry-specific markup
   - Chemical equation balancing

2. **Performance Optimization**
   - Caching layer
   - Async processing

3. **Additional Formats**
   - More output formats
   - Enhanced accessibility features

4. **Migration Tools Enhancement**
   - **New:** Batch migration capabilities
   - **New:** Migration progress tracking
   - **New:** Automated migration workflows

### Maintenance Tasks

1. **Dependency Updates**
   - Regular security updates
   - MathML library updates

2. **Guideline Compliance**
   - Monitor Nordic MathML Guidelines updates
   - Implement new requirements
   - **New:** Automated compliance checking

3. **Testing**
   - Expand test coverage
   - Add performance tests
   - **New:** Migration regression testing

## Contributing

### Code Standards

- Follow existing code style
- Add comments for complex logic
- Include tests for new features

### Review Process

1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request

### Documentation Updates

- Update API documentation for new features
- Maintain developer documentation
- Update examples and test cases
