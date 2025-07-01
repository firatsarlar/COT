# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run watch` - Watch for changes and recompile
- `pnpm run dev` - Run in development mode with ts-node
- `pnpm run start` - Run the built server
- `pnpm install` - Install dependencies

## Project Overview

This is an Enhanced Chain of Thought MCP (Model Context Protocol) server that implements Chain of Draft optimization. The server provides tools for step-by-step reasoning with multiple modes optimized for different problem types.

### Architecture

- **Single-file implementation**: All logic is contained in `src/index.ts`
- **MCP Server**: Uses `@modelcontextprotocol/sdk` for protocol compliance
- **TypeScript**: Compiled to ES modules targeting Node.js 18+
- **Terminal UI**: Uses `chalk` for colored console output

### Core Components

1. **EnhancedChainOfThoughtServer class**: Main server logic handling thought processing
2. **Four reasoning modes**: 
   - `draft` (≤5 words): Ultra-concise for math/logic
   - `concise` (≤15 words): Balanced clarity and efficiency
   - `standard`: Full detailed reasoning
   - `auto`: Adaptive mode switching
3. **Chain templates**: Pre-configured patterns from research (GSM8K Math, Coin Flip, Creative Writing)
4. **Metrics tracking**: Token usage, efficiency, latency measurement

### Tools Provided

- `chainofthought`: Main reasoning tool with branching/revision support
- `chainsummary`: Generate chain metrics and efficiency analysis
- `loadtemplate`: Load research-based templates
- `resetchain`: Clear thought history

### Key Features

- **Problem-type optimization**: Automatically suggests optimal modes
- **Branching support**: Non-linear thinking paths with branch IDs
- **Revision tracking**: Ability to revise previous thoughts
- **Token efficiency**: Up to 80% reduction vs standard CoT
- **Real-time metrics**: Tracks words, tokens, efficiency

### Configuration

- Environment variable `DISABLE_COT_LOGGING=true` disables console visualization
- Templates are hardcoded in `CHAIN_TEMPLATES` array
- Mode configurations define word limits and styling

### Integration

Designed for Claude Desktop integration via MCP protocol. The server communicates over stdio and provides JSON responses with thought processing results and metrics.

### RULES

Please include @devdocs/rules.md for workflow.