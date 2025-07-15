# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run watch` - Watch for changes and recompile
- `pnpm run dev` - Run in development mode with ts-node
- `pnpm run start` - Run the built server
- `pnpm install` - Install dependencies
- `pnpm test` - Run comprehensive test suite (103 tests)

## Project Overview

This is an Enhanced Chain of Thought MCP (Model Context Protocol) server implementing advanced reasoning capabilities based on 2024-2025 research. The server provides tools for multi-path reasoning, rollback/correction, and automatic chain generation.

### Architecture

- **Modular implementation**: Logic split across `src/types.ts`, `src/server.ts`, `src/tools.ts`, `src/index.ts`
- **MCP Server**: Uses `@modelcontextprotocol/sdk` for protocol compliance
- **TypeScript**: Compiled to ES modules targeting Node.js 18+
- **Terminal UI**: Uses `chalk` for colored console output
- **Test Coverage**: Comprehensive Jest test suite with 103+ tests

### Core Components

1. **EnhancedChainOfThoughtServer class**: Main server logic with advanced reasoning capabilities
2. **Four reasoning modes**: 
   - `draft` (≤5 words): Ultra-concise for math/logic
   - `concise` (≤15 words): Balanced clarity and efficiency
   - `standard`: Full detailed reasoning
   - `auto`: Adaptive mode switching
3. **Chain templates**: Pre-configured patterns from research with 9 specialized templates
4. **Advanced features**: Self-consistency voting, rollback support, auto-CoT generation

### Tools Provided

- `chainofthought`: Main reasoning tool with branching, consensus, rollback, and auto-CoT features
- `chainsummary`: Generate chain metrics and efficiency analysis  
- `loadtemplate`: Load research-based templates
- `resetchain`: Clear thought history, branches, and rollback data

### Phase 1 Features (COMPLETED)

#### 1.1 Self-Consistency Voting System
- **Multi-path reasoning**: Generate 2-10 reasoning paths with consensus selection
- **Majority voting**: Achieve +25% accuracy improvement via path agreement
- **Confidence scoring**: Agreement metrics and voting results
- **Parameter**: `pathCount` (2-10, default: 3)

#### 1.2 Rollback/Backtracking Support
- **State management**: Automatic thought snapshots for rollback points
- **Revision history**: Track all rollback operations with unique IDs
- **Branch integrity**: Automatic cleanup of invalid branches after rollback
- **Parameters**: `rollbackToThought` (thought number), `rollbackReason` (string)

#### 1.3 Auto-CoT Generation
- **Trigger detection**: Automatic activation on "Let's think step by step" and similar phrases
- **Content analysis**: Intelligent mode selection based on mathematical, logical, creative, or planning content
- **Template suggestions**: Automatic template matching with relevance scoring
- **Parameter**: `autoMode` (boolean) for explicit activation

### Configuration

- **Environment**: `DISABLE_COT_LOGGING=true` disables console visualization
- **Templates**: 9 specialized templates in `CHAIN_TEMPLATES` array
- **Auto-CoT**: Configurable trigger phrases, diversity sampling, template suggestions
- **Mode limits**: Draft (5 words), Concise (15 words), Standard (unlimited)

### Integration

Designed for Claude Desktop integration via MCP protocol. Provides comprehensive reasoning capabilities with backward compatibility for existing workflows.

### RULES

Please include @devdocs/rules.md for workflow.