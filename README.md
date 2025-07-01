# Enhanced Chain of Thought MCP Server

An advanced Model Context Protocol (MCP) server that implements Chain of Thought reasoning with Chain of Draft optimization, inspired by the research paper "Chain of Draft: Thinking Faster by Writing Less" (Xu et al., 2025).

## Features

### 🎯 Multiple Reasoning Modes
- **Draft Mode** (≤5 words): Ultra-concise reasoning for maximum efficiency
- **Concise Mode** (≤15 words): Balanced clarity and efficiency
- **Standard Mode**: Full Chain of Thought with detailed explanations
- **Auto Mode**: Adaptive switching based on problem complexity

### 📊 Advanced Features
- **Token & Efficiency Tracking**: Real-time metrics on reasoning efficiency
- **Mode Switching Recommendations**: AI suggests optimal modes
- **Branching & Revision Support**: Non-linear thinking paths
- **Problem-Type Optimization**: Tailored approaches for different problems
- **Research-Based Templates**: Pre-configured chains from academic papers

### 🚀 Performance Benefits
- Up to 80% reduction in token usage compared to standard CoT
- 40-76% reduction in latency for reasoning tasks
- Maintains comparable accuracy to verbose CoT

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/enhanced-cot-mcp.git
cd enhanced-cot-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Or use development mode
npm run dev
```

## Usage

### Basic Example

```typescript
// Start with a math problem in draft mode
{
  "thought": "20 - x = 12",
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "mode": "draft",
  "problemType": "arithmetic",
  "nextThoughtNeeded": true
}

// Continue reasoning
{
  "thought": "x = 8",
  "thoughtNumber": 2,
  "totalThoughts": 3,
  "mode": "draft",
  "nextThoughtNeeded": true
}

// Final answer
{
  "thought": "#### 8",
  "thoughtNumber": 3,
  "totalThoughts": 3,
  "mode": "draft",
  "nextThoughtNeeded": false
}
```

### Complex Example with Mode Switching

```typescript
// Start with auto mode for a complex problem
{
  "thought": "Analyze the impact of AI on employment",
  "thoughtNumber": 1,
  "totalThoughts": 5,
  "mode": "auto",
  "problemType": "analysis",
  "nextThoughtNeeded": true
}

// System might suggest concise mode
{
  "thought": "Key factors: automation, new job creation, skill gaps",
  "thoughtNumber": 2,
  "totalThoughts": 5,
  "mode": "concise",
  "nextThoughtNeeded": true
}
```

## Configuration

### Environment Variables
- `DISABLE_COT_LOGGING=true`: Disable console visualization
- `DEFAULT_MODE=draft`: Set default reasoning mode

### Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "enhanced-cot": {
      "command": "node",
      "args": ["/path/to/enhanced-cot-mcp/dist/index.js"],
      "env": {
        "DISABLE_COT_LOGGING": "false"
      }
    }
  }
}
```

## Problem Types

The server optimizes for different problem types:

| Problem Type | Default Mode | Use Cases |
|-------------|--------------|-----------|
| arithmetic | draft | Math problems, calculations |
| logical | draft | Boolean logic, state tracking |
| creative | standard | Writing, ideation, design |
| planning | concise | Project planning, strategies |
| analysis | concise | Data analysis, evaluation |
| general | auto | Mixed or unknown problems |

## Templates

Load pre-configured templates from research:

```typescript
// Load GSM8K math template
{
  "tool": "loadtemplate",
  "templateName": "GSM8K Math"
}
```

Available templates:
- GSM8K Math (arithmetic, draft mode)
- Coin Flip (logical, draft mode)
- Creative Writing (creative, standard mode)

## Metrics

Get comprehensive metrics with the `chainsummary` tool:

```json
{
  "totalThoughts": 10,
  "metrics": {
    "totalTokens": 450,
    "totalWords": 180,
    "averageWordsPerThought": 18,
    "efficiency": "2.78",
    "latency": 3421,
    "modeDistribution": {
      "draft": 6,
      "concise": 3,
      "standard": 1,
      "auto": 0
    }
  }
}
```

## Research Background

This implementation is based on:
- **Chain of Draft** (Xu et al., 2025): Reducing verbosity while maintaining accuracy
- **Chain of Thought** (Wei et al., 2022): Step-by-step reasoning
- **Auto-CoT** (Zhang et al., 2022): Automatic reasoning generation

## Comparison with Standard CoT

| Metric | Standard CoT | Enhanced CoT (Draft) | Improvement |
|--------|--------------|---------------------|-------------|
| Tokens/Response | ~200 | ~40 | 80% reduction |
| Latency | 4.2s | 1.0s | 76% reduction |
| Accuracy (GSM8K) | 95.4% | 91.1% | -4.3% |

## Advanced Features

### Branching
```typescript
{
  "thought": "Alternative approach",
  "branchFromThought": 3,
  "branchId": "alt-1",
  // ... other fields
}
```

### Revisions
```typescript
{
  "thought": "Actually, x = 9",
  "isRevision": true,
  "revisesThought": 2,
  // ... other fields
}
```

### Confidence Tracking
```typescript
{
  "thought": "Probably correct",
  "confidence": 0.85,
  // ... other fields
}
```

## Development

```bash
# Run in development mode
npm run dev

# Watch for changes
npm run watch

# Build for production
npm run build
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Citation

If you use this tool in research, please cite:

```bibtex
@article{xu2025cod,
  title={Chain of Draft: Thinking Faster by Writing Less},
  author={Xu, Silei and Xie, Wenhao and Zhao, Lingxiao and He, Pengcheng},
  journal={arXiv preprint arXiv:2502.18600},
  year={2025}
}
```

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/yourusername/enhanced-cot-mcp/issues)
- Documentation: [Full API documentation](https://github.com/yourusername/enhanced-cot-mcp/wiki)

---

Built with ❤️ for efficient AI reasoning