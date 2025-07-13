import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CHAIN_OF_THOUGHT_TOOL: Tool = {
  name: "chainofthought",
  description: `Enhanced Chain of Thought reasoning tool with multiple modes and intelligent branching.

Modes:
- draft: Ultra-concise reasoning (≤5 words) for maximum efficiency
- concise: Balanced reasoning (≤15 words) for clarity with efficiency  
- standard: Full Chain of Thought with detailed explanations
- auto: Adaptive mode that switches based on problem complexity

Key Features:
- BRANCHING: Explore multiple solution paths simultaneously for better results
- Auto-suggestions: Tool recommends when to branch based on content analysis
- Smart branch IDs: Automatically generates branch identifiers (A, B, C, etc.)
- Branch visualization: Clear display of thought trees and connections

Branching Benefits:
✓ Explore alternative approaches when facing uncertainty
✓ Compare different solutions side-by-side
✓ Prevent tunnel vision and discover better paths
✓ Handle complex problems with multiple valid approaches

Usage Tips:
- Use branching when you see words like "or", "alternatively", "maybe"
- Branch for creative problems to explore different ideas
- Branch for analysis to examine multiple perspectives
- Use provided branchFromThought and branchId when suggested
- The tool will guide you with specific branch parameters

The tool actively suggests both mode switches AND branching opportunities.`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step"
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed"
      },
      thoughtNumber: {
        type: "integer",
        description: "Current thought number",
        minimum: 1
      },
      totalThoughts: {
        type: "integer",
        description: "Estimated total thoughts needed",
        minimum: 1
      },
      mode: {
        type: "string",
        enum: ["draft", "concise", "standard", "auto"],
        description: "Reasoning mode to use"
      },
      problemType: {
        type: "string",
        enum: ["arithmetic", "logical", "creative", "planning", "analysis", "general"],
        description: "Type of problem being solved"
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking"
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1
      },
      branchId: {
        type: "string",
        description: "Branch identifier"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed"
      },
      confidence: {
        type: "number",
        description: "Confidence level (0-1)",
        minimum: 0,
        maximum: 1
      }
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
  }
};

export const CHAIN_SUMMARY_TOOL: Tool = {
  name: "chainsummary",
  description: "Get a summary of the current chain of thought including metrics and efficiency analysis",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

export const LOAD_TEMPLATE_TOOL: Tool = {
  name: "loadtemplate",
  description: "Load a chain of thought template from research papers",
  inputSchema: {
    type: "object",
    properties: {
      templateName: {
        type: "string",
        description: "Name of the template to load"
      }
    },
    required: ["templateName"]
  }
};

export const RESET_CHAIN_TOOL: Tool = {
  name: "resetchain",
  description: "Reset the chain of thought history",
  inputSchema: {
    type: "object",
    properties: {}
  }
};