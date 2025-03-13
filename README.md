# typescript-i18n-transformer

A powerful TypeScript i18n (internationalization) transformer that automatically generates and manages translation tables with GPT-4o integration.

## Features

- **Bundle Size Optimization**: Replaces string keys with numeric IDs to reduce bundle size
- **Automatic Table Generation**: Generates and maintains translation tables
- **Automatic Translation**: Leverages GPT-4o for high-quality, context-aware translations
- **Smart Context Handling**: Uses surrounding code context for more accurate translations
- **Type Safety**: Full TypeScript support with type checking
- **Build-time Integration**: Works as a TypeScript transformer during compilation

## Installation

```bash
# Install the package
npm install typescript-i18n-transformer

# Set up OpenAI API key for translations
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

### Webpack Configuration

To enable bundle size optimization, register the minify transformer in your webpack configuration:

```typescript
// webpack.config.ts
import { i18nMinifyTransformer } from 'typescript-i18n-transformer';

module.exports = {
  // ... other webpack config
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          getCustomTransformers: (program) => ({
            before: [
              i18nMinifyTransformer(program)
            ]
          })
        }
      }
    ]
  }
};
```

### TypeScript Configuration

If you're not using webpack, you can use `ts-patch` to register the transformer:

1. Install ts-patch:
```bash
npm install --save-dev ts-patch
```

2. Configure your `tsconfig.json`:
```json
{
  "compilerOptions": {
    // ... other options
    "plugins": [
      { "transform": "typescript-i18n-transformer" }
    ]
  }
}
```

3. Use ts-patch instead of tsc:
```json
{
  "scripts": {
    "build": "tspc"
  }
}
```

## Usage

### 1. Setting up I18n

```typescript
import { I18n, I18nData } from 'typescript-i18n-transformer/i18n';

// Create I18n instance with language configurations
const i18n = new I18n(
  {
    "en": {
      "default": (): Promise<I18nData> => import("./language/default.en")
    },
    "ko": {
      "default": (): Promise<I18nData> => import("./language/default.ko")
    }
  },
  {
    defaultLanguage: "en",
    logger: console,
    fallbackText: process.env.NODE_ENV === "development" ? null : "",
    onTableLoaded: (namespace, language) => {
      // Handle table loading completion
      // Trigger re-render of the component here
    }
  }
);
```

### 2. Using Translations

```typescript
// Basic translation
i18n.locText("hello"); // Uses default namespace

// Translation with namespace
i18n.nslocText("common", "welcome");

// Translation with parameters
i18n.locText("greeting", userName);

// Dynamic translations
// For translate text received from API
i18n.dLocText("dynamic_key");
```

### 3. Managing Translation Tables

#### Generate Translation Tables

run `i18n-codegen` to generate translation table structure

- `-r, --resourceDir`: Directory for language resources (default: "src/language")
- `-c, --tsConfigPath`: Path to tsconfig.json (default: "tsconfig.json")

```bash
# Generate translation table structure
npm run i18nt-codegen -r src/language
```

#### Automatic Translation

run `i18n-translate` to translate text to all languages

- `-r, --resourceDir`: Directory for language resources (default: "src/language")
- `-c, --tsConfigPath`: Path to tsconfig.json (default: "tsconfig.json")
- `-d, --defaultLanguage`: Source language for translations (default: "en")
- `-a, --additionalContext`: Extra context for translations

```bash
# Translate to all languages (using en as default)
npm run i18nt-translate -r src/language -d en
```
