# service-stem

A microservice to generate text content and images based on MathML.

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

## Usage

Use "curl" from the command-line: to test this service.

Replace `[HOST]` and `[PORT]` with appropriate values from the `.env` file.

Replace "content" with appropriate MathML that you want to test.

### New MathML Format (Recommended)

The new Nordic MathML Guidelines recommend using the direct namespace declaration:

```bash
curl -H 'Content-Type: application/json' \
      -d '{ "contentType": "math", "content": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" xml:lang=\"en\" display=\"block\"><mn>3</mn><mo>-</mo><mn>2</mn><mo>=</mo><mn>1</mn></math>" }' \
      -X POST \
      http://[HOST]:[PORT]/
```

**Important:** The `<mfenced>` element is deprecated according to the Nordic MathML Guidelines. Use `<mo>` elements for parentheses instead:

```bash
# Recommended (new format)
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mo>(</mo>
  <mn>3</mn>
  <mo>+</mo>
  <mn>2</mn>
  <mo>)</mo>
</math>

# Deprecated (old format)
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mfenced open="(" close=")">
    <mn>3</mn>
    <mo>+</mo>
    <mn>2</mn>
  </mfenced>
</math>
```

**Display Attribute Guidelines:**

According to the Nordic MathML Guidelines:

- The default value for `display` is `inline` (no need to specify it for inline math)
- Use `display="block"` only for standalone mathematical expressions
- Use `display="inline"` for mathematical expressions within text
- The `<math>` element should never be a standalone block element - it should always be within a paragraph element or equivalent

```bash
# Inline math (default - no display attribute needed)
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mn>3</mn><mo>+</mo><mn>2</mn>
</math>

# Block math (explicitly specified)
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn>
</math>
```

### Legacy MathML Format (Deprecated)

The old format used the `m:` namespace prefix:

```bash
curl -H 'Content-Type: application/json' \
      -d '{ "contentType": "math", "content": "<m:math xmlns:m=\"http://www.w3.org/1998/Math/MathML\" xml:lang=\"en\" display=\"block\" class=\"math\"><m:mn>3</m:mn><m:mo>-</m:mo><m:mn>2</m:mn><m:mo>=</mo><m:mn>1</m:mn></m:math>" }' \
      -X POST \
      http://[HOST]:[PORT]/
```

**Note:** The `alttext` and `altimg` attributes are deprecated and should not be used in new content according to the Nordic MathML Guidelines. MathML support has improved significantly, making these fallback attributes unnecessary.

### Invisible Operators

The Nordic MathML Guidelines specify the use of invisible operators to make mathematical expressions unambiguous:

- **Invisible multiplication** (`&#x2062;`): Used between numbers and variables, or between variables
- **Invisible function application** (`&#x2061;`): Used to indicate function application
- **Invisible plus** (`&#x2064;`): Used for implicit addition
- **Invisible comma** (`&#x2063;`): Used for implicit separation

```bash
# Invisible multiplication
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mn>3</mn><mo>&#x2062;</mo><mi>x</mi>
</math>

# Invisible function application
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo>
</math>

# Numbers with units using invisible multiplication
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi>
</math>
```

**Backward Compatibility:** The legacy ring operator (`&#x2218;`) is still supported for backward compatibility.
