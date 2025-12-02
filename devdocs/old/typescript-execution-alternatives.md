# TypeScript Direct Execution Alternatives (July 2025)

## Overview

Running TypeScript files directly without transpilation has become much more viable in 2025. This document outlines the best approaches for executing `src/index.ts` directly, addressing common issues with ts-node and pnpm builds.

## Recommended Solutions

### 1. TSX (Recommended)

**tsx** is the modern alternative to ts-node, built on esbuild for fast execution.

#### Installation
```bash
pnpm add -D tsx
```

#### Usage
```bash
# Direct execution
npx tsx src/index.ts

# Watch mode
npx tsx watch src/index.ts

# As Node.js loader
NODE_OPTIONS='--import tsx' node src/index.ts
```

#### Advantages
- **Fast**: Powered by esbuild, significantly faster than ts-node
- **ESM Support**: Seamless CommonJS/ESM module handling
- **No Type Checking**: Focuses on execution, not type validation
- **Zero Config**: Works without tsconfig.json
- **Better ESM**: Handles ESM dependencies without configuration issues

#### Script Integration
```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:watch": "tsx watch src/index.ts"
  }
}
```

### 2. Node.js Native TypeScript Support (Node.js 22.6+)

Node.js now has experimental built-in TypeScript support.

#### Node.js 22.6 - 23.5
```bash
node --experimental-strip-types src/index.ts
```

#### Node.js 23.6+
```bash
# Type stripping enabled by default
node src/index.ts

# Disable if needed
node --no-experimental-strip-types src/index.ts
```

#### Limitations
- Experimental feature, may change
- Limited to type stripping (no type checking)
- May not support all TypeScript features

### 3. Alternative Runtimes

#### Bun (Fastest)
```bash
bun run src/index.ts
```

#### Deno (Security-focused)
```bash
deno run src/index.ts
```

## Issues with ts-node and ESM

### Common Problems
1. **ESM Module Conflicts**: ts-node struggles with ESM dependencies
2. **Configuration Complexity**: Requires extensive tsconfig tweaks
3. **Performance**: TypeScript compiler is slower than esbuild
4. **pnpm Compatibility**: Module resolution issues with pnpm

### ts-node ESM Configuration (If Needed)
```json
// tsconfig.json
{
  "ts-node": {
    "esm": true
  },
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
```

```bash
# Running with ESM loader
node --loader ts-node/esm src/index.ts
```

## Package.json Script Updates

Replace problematic ts-node commands with tsx:

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:watch": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  }
}
```

## Troubleshooting Common Issues

### 1. Chalk ESM Import Issues
Since chalk v5 is pure ESM, ensure proper import:
```typescript
import chalk from 'chalk';  // ✓ Correct
// const chalk = require('chalk');  // ✗ Won't work
```

### 2. MCP SDK Import Issues
Use explicit .js extensions for relative imports:
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
```

### 3. Module Resolution with pnpm
tsx handles module resolution better than ts-node with pnpm.

## Performance Comparison (2025)

| Tool | Speed | ESM Support | Type Checking | Setup |
|------|-------|-------------|---------------|-------|
| tsx | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ |
| Node.js Native | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ |
| ts-node | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Bun | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ |

## Recommendations for MCP Server

1. **Use tsx for development**: Fast, reliable, handles ESM properly
2. **Build for production**: Still compile to JavaScript for distribution
3. **Keep ts-node as fallback**: Some environments may still require it
4. **Test with Node.js native**: Future-proofing for when it becomes stable

## Implementation

Update package.json to use tsx as the primary development runner:

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:old": "node --loader ts-node/esm src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "devDependencies": {
    "tsx": "^4.19.2"
  }
}
```