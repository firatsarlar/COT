# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principles

- **No emojis**: Zero tolerance in output.
- **Concise communication**: Essential details only, maximum compression applied.

## Workflow (CRITICAL)

When user asks questions, suggests ideas, or wants to discuss:

1. **DISCUSS FIRST** - Have conversation, explore options, answer questions
2. **SKETCH PLAN** - Outline approach with user, get confirmation
3. **DOCUMENT PLAN** - Write plan in markdown/comments before coding
4. **VERIFY DEPENDENCIES** - Check tools/packages actually exist and work
5. **EXECUTE** - Implement after plan is clear and agreed

**DO NOT**:

- Jump straight into code when user is asking questions
- Install packages without verifying they work
- Create configs without testing them
- Implement without discussing approach first

**Pattern**:

```
User: "I think we should add X, what do you think?"
Claude: [Discussion of options, tradeoffs]
User: "Let's go with approach Y"
Claude: [Outline plan, get confirmation]
User: "Looks good"
Claude: [Document plan, then execute]
```

## Git Commit Strategy

**Micro-commits with balance:**

- Group logically related changes (not single line = 1 commit)
- **Group tests with implementation** - Test files belong in same commit as their implementation
- **Include untracked files** - Always check `git status` for untracked files that should be committed
- **No fancy git operations** - Only commit unless explicitly requested (no rebase, reset, amend, cherry-pick, etc.)
- Separate concerns: tooling, fixes, features, docs
- Aim for 3-5 commits per session when possible
- Commit message format: `type: subject\n\ndetail explanation` (no co-author line)
- Squash trivial changes (typos, formatting) into logical commits

## Tool Priority

1. **Enhanced CoT** (`mcp__enhanced-cot__chainofthought`) - Always use for all tasks
2. **Context7 MCP** - Latest framework/library docs (`get-library-docs`, `resolve-library-id`)
3. **Web Search** - Current info, prices, post-Jan-2025 content

## Development Commands

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run watch` - Watch for changes and recompile
- `pnpm run dev` - Run in development mode with tsx
- `pnpm run start` - Run the built server
- `pnpm install` - Install dependencies
- `pnpm test` - Run comprehensive test suite (103 tests)

## Project Overview

Enhanced Chain of Thought MCP (Model Context Protocol) server implementing advanced reasoning capabilities based on 2024-2025 research. Provides tools for multi-path reasoning, rollback/correction, and automatic chain generation.

### Architecture

- **Modular implementation**: Logic split across `src/types.ts`, `src/server.ts`, `src/tools.ts`, `src/index.ts`
- **MCP Server**: Uses `@modelcontextprotocol/sdk` for protocol compliance
- **TypeScript**: Compiled to ES modules targeting Node.js 18+
- **Terminal UI**: Uses `chalk` for colored console output
- **Test Coverage**: Comprehensive Jest test suite with 103+ tests

### Core Components

1. **EnhancedChainOfThoughtServer class**: Main server logic with advanced reasoning capabilities
2. **Five reasoning modes**:
   - `draft` (≤5 words): Ultra-concise for math/logic
   - `concise` (≤15 words): Balanced clarity and efficiency
   - `standard`: Full detailed reasoning
   - `analysis` (≤50 words): In-depth analysis for complex problems
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

## Code Style Guidelines

### Standards

- **Simple, concise, clever** - Avoid overengineering solutions.
- **Comments**: Only for complex logic; no comment bloat.
- **Avoid nesting**: Early returns, guard clauses, DRY principle.
- **Async/await**: Default for asynchronous operations.
- **Arrow functions**: Prefer `const` + arrow syntax for simple utilities/single returns; use `function` declarations for complex type-heavy logic.
- **Extract and generalize (DRY)**: When ANY code pattern repeats 2+ times, extract to shared constant/function/utility.

### TypeScript Types

**Principle**: Cognitive clarity over type perfection. Types should reduce mental overhead, not increase it.

- **Simple unions**: `string | Record<string, string>` over complex conditional types
- **Self-documenting names**: `ResponsiveValue<T>` > `RV<T>`
- **Minimal generics**: Only when reusability clearly justifies complexity
- **Type assertions**: Prefer `as Type` over complex type guards when safe
- **Comment non-obvious types**: Explain intent for mapped types, conditional types, or complex generics

### Variable Naming

- **Descriptive names**: Use clear, meaningful variable names even in lambdas and arrow functions.

## Text Compression Rules

Apply these when creating documentation, comments, or responses:

1. **Remove redundancy** - Eliminate filler words and obvious context
2. **Merge concepts** - Combine related statements into single sentences
3. **Precise terms** - Replace verbose phrases with technical accuracy
4. **Extract essentials** - Only facts/actions/logic needed for understanding
5. **Convert to patterns** - Replace examples with reusable patterns when possible

**Always preserve**: Numbers, metrics, proper nouns, technical terms, causal relationships, temporal sequences, critical constraints.

## RULES

Please include @devdocs/rules.md for workflow.
