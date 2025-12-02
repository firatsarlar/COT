# Enhanced Chain of Thought MCP Server Setup Plan

## Current Status
- No packages installed yet
- TypeScript source exists but not built
- Using pnpm as package manager
- Target: Node.js 18+ with ES modules

## Setup Phase 1: Package Installation & Build

### 1. Install Core Dependencies
```bash
pnpm add @modelcontextprotocol/sdk@^1.13.2 chalk@^5.3.0
```

### 2. Install Development Dependencies
```bash
pnpm add -D typescript@^5.8.3 @types/node@^24.0.7 ts-node@^10.9.2
```

### 3. Verify Package.json Scripts
Current scripts in package.json:
- `build`: tsc
- `watch`: tsc --watch  
- `dev`: node --loader ts-node/esm src/index.ts
- `start`: node dist/index.js
- `prepare`: npm run build (needs update to pnpm)

### 4. Build Project
```bash
pnpm run build
```

## Setup Phase 2: Testing & Validation

### 1. Test Development Mode
```bash
pnpm run dev
```
Should start MCP server with console output showing modes.

### 2. Test Production Build
```bash
pnpm run start
```
Should run from dist/ directory.

### 3. Validate MCP Integration
Test with Claude Desktop configuration:
```json
{
  "mcpServers": {
    "enhanced-cot": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "DISABLE_COT_LOGGING": "false"
      }
    }
  }
}
```

## Setup Phase 3: Optional Enhancements

### 1. Add Testing Framework (if needed)
```bash
pnpm add -D jest@^29.7.0 @types/jest@^29.5.11 ts-jest@^29.1.1
```

### 2. Add Linting/Formatting (if needed)
```bash
pnpm add -D eslint@^8.56.0 @typescript-eslint/eslint-plugin@^6.19.0 @typescript-eslint/parser@^6.19.0 prettier@^3.2.4
```

## Potential Issues & Solutions

### Issue 1: ts-node ESM Loading
- Current dev script uses `--loader ts-node/esm`
- Alternative: Use tsx or adjust TypeScript config

### Issue 2: MCP SDK Version Compatibility
- Using @modelcontextprotocol/sdk@^1.13.2 (latest stable as of July 2025)
- Version verified and compatible with current TypeScript

### Issue 3: Chalk v5 ESM Requirements
- Chalk v5.3.0 is pure ESM
- Compatible with TypeScript 5.8.3 and Node.js 18+
- Ensure proper import syntax in TypeScript

### Issue 4: Node.js Shebang
- src/index.ts has `#!/usr/bin/env node`
- Ensure this transfers to built file or adjust

## Package.json Updates Completed

1. Fixed prepare script:
```json
"prepare": "pnpm run build"
```

2. Updated dependencies to latest stable versions:
```json
"dependencies": {
  "@modelcontextprotocol/sdk": "^1.13.2",
  "chalk": "^5.3.0"
},
"devDependencies": {
  "@types/node": "^24.0.7",
  "ts-node": "^10.9.2",
  "typescript": "^5.8.3"
}
```

2. Consider adding:
```json
"clean": "rm -rf dist",
"type-check": "tsc --noEmit"
```

## Success Criteria

1. `pnpm install` completes without errors
2. `pnpm run build` produces dist/index.js
3. `pnpm run dev` starts server with colored output
4. `pnpm run start` runs built version
5. MCP tools are accessible via stdio protocol
6. No TypeScript compilation errors
7. All modes (draft, concise, standard, auto) function correctly

## Next Steps After Setup

1. Test all four reasoning modes
2. Validate chain templates loading
3. Test branching and revision features
4. Verify metrics tracking accuracy  
5. Test with actual Claude Desktop integration