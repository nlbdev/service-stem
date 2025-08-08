# MathML Examples

This document provides comprehensive examples of MathML markup patterns that comply with the Nordic MathML Guidelines 2024. These examples demonstrate proper usage of the new MathML requirements and can be used for testing and reference. **Version 2.0.0** includes enhanced validation and backward compatibility support.

## Basic Mathematical Expressions

### Simple Arithmetic

**Addition:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn>
</math>
```

**Subtraction:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>10</mn><mo>&#x2212;</mo><mn>4</mn><mo>=</mo><mn>6</mn>
</math>
```

**Multiplication:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>4</mn><mo>&#x2062;</mo><mn>5</mn><mo>=</mo><mn>20</mn>
</math>
```

**Division:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>15</mn><mo>/</mo><mn>3</mn><mo>=</mo><mn>5</mn>
</math>
```

### Variables and Expressions

**Simple variable:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>x</mi><mo>+</mo><mn>5</mn>
</math>
```

**Variable with coefficient:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>3</mn><mo>&#x2062;</mo><mi>x</mi><mo>+</mo><mn>2</mn><mo>&#x2062;</mo><mi>y</mi>
</math>
```

**Equation:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en" display="block">
  <mi>x</mi><mo>+</mo><mi>y</mi><mo>=</mo><mn>10</mn>
</math>
```

## Invisible Operators

### Invisible Multiplication

**Number and variable:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>3</mn><mo>&#x2062;</mo><mi>x</mi>
</math>
```

**Variable and variable:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>x</mi><mo>&#x2062;</mo><mi>y</mi>
</math>
```

**Number with unit:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi>
</math>
```

### Invisible Function Application

**Function call:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo>
</math>
```

**Multiple arguments:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>g</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>,</mo><mi>y</mi><mo>)</mo>
</math>
```

## Special Characters

### Mathematical Symbols

**Minus sign (not hyphen):**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>5</mn><mo>&#x2212;</mo><mn>3</mn>
</math>
```

**Prime:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>x</mi><mo>&#x2032;</mo>
</math>
```

**Element of:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>x</mi><mo>&#x2208;</mo><mi>A</mi>
</math>
```

### Greek Letters

**Alpha, beta, gamma:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>&#x3B1;</mi><mo>+</mo><mi>&#x3B2;</mi><mo>=</mo><mi>&#x3B3;</mi>
</math>
```

**Delta:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>&#x394;</mi><mi>x</mi>
</math>
```

**Pi:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>&#x3C0;</mi><mo>&#x2062;</mo><mi>r</mi><mo>&#x2072;</mo>
</math>
```

## Chemistry Markup

### Chemical Formulas

**Water (H₂O):**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <msub><mi>H</mi><mn>2</mn></msub><mi>O</mi>
</math>
```

**Carbon dioxide (CO₂):**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mi>C</mi><msub><mi>O</mi><mn>2</mn></msub>
</math>
```

### Isotope Notation

**Carbon-14:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mmultiscripts>
    <mi>C</mi>
    <mn>14</mn>
    <none/>
    <mn>6</mn>
  </mmultiscripts>
</math>
```

## Labeled Equations

### Simple Labeled Equation

**Equation with label:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en" display="block">
  <mtable>
    <mtr>
      <mtd><mi>E</mi><mo>=</mo><mi>m</mi><mo>&#x2062;</mo><msup><mi>c</mi><mn>2</mn></msup></mtd>
      <mtd><mo>(</mo><mn>1</mn><mo>)</mo></mtd>
    </mtr>
  </mtable>
</math>
```

## Crossed Out Math

### Diagonal Strike

**Crossed out expression:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <menclose notation="updiagonalstrike">
    <mn>3</mn><mo>+</mo><mn>2</mn>
  </menclose>
</math>
```

## Fill-in-the-blanks

### Simple Blank

**Single blank:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>3</mn><mo>+</mo><mi>&#x9109;</mi><mo>=</mo><mn>5</mn>
</math>
```

## Units

### Basic Units

**Meters:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>100</mn><mo>&#x2062;</mo><mi mathvariant="normal">m</mi>
</math>
```

**Kilometers per hour:**

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML" xml:lang="en">
  <mn>50</mn><mo>&#x2062;</mo><mi mathvariant="normal">km/h</mi>
</math>
```

## Common Mistakes to Avoid

### Deprecated Elements

**❌ Don't use mfenced:**

```xml
<!-- DEPRECATED -->
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mfenced><mn>3</mn><mo>+</mo><mn>2</mn></mfenced>
</math>
```

**✅ Use mo elements instead:**

```xml
<!-- CORRECT -->
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mo>(</mo><mn>3</mn><mo>+</mo><mn>2</mn><mo>)</mo>
</math>
```

### Deprecated Namespace

**❌ Don't use m: prefix:**

```xml
<!-- DEPRECATED -->
<m:math xmlns:m="http://www.w3.org/1998/Math/MathML">
  <m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn>
</m:math>
```

**✅ Use direct namespace:**

```xml
<!-- CORRECT -->
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mn>3</mn><mo>+</mo><mn>2</mn>
</math>
```

## Testing Examples

### Basic Test

```bash
curl -H 'Content-Type: application/json' \
  -d '{
    "contentType": "math",
    "content": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" xml:lang=\"en\"><mn>3</mn><mo>+</mo><mn>2</mn><mo>=</mo><mn>5</mn></math>"
  }' \
  -X POST \
  http://localhost:3000/
```

### Chemistry Test

```bash
curl -H 'Content-Type: application/json' \
  -d '{
    "contentType": "math",
    "content": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>H</mi><mn>2</mn></msub><mi>O</mi></math>"
  }' \
  -X POST \
  http://localhost:3000/
```

### Version Detection Test

```bash
curl -H 'Content-Type: application/json' \
  -d '{
    "content": "<m:math xmlns:m=\"http://www.w3.org/1998/Math/MathML\"><m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn></m:math>"
  }' \
  -X POST \
  http://localhost:3000/detect-version
```

### Migration Test

```bash
curl -H 'Content-Type: application/json' \
  -d '{
    "content": "<m:math xmlns:m=\"http://www.w3.org/1998/Math/MathML\"><m:mn>3</m:mn><m:mo>+</m:mo><m:mn>2</m:mn></m:math>"
  }' \
  -X POST \
  http://localhost:3000/migrate
```
