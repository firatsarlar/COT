import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CHAIN_OF_THOUGHT_TOOL: Tool = {
  name: "chainofthought",
  description: `Enhanced Chain of Thought reasoning tool with multiple modes and automatic CoT generation.

Modes:
- draft: Ultra-concise reasoning (≤5 words) for maximum efficiency
- concise: Balanced reasoning (≤15 words) for clarity with efficiency
- standard: Full Chain of Thought with detailed explanations
- analysis: In-depth analysis mode for complex problems (≤50 words)
- auto: Adaptive mode that switches based on problem complexity

Key Features:
- AUTO-COT: Automatic reasoning chain generation with minimal input (autoMode parameter)
- Auto-suggestions: Tool recommends mode switches based on content analysis
- Problem type detection: Automatically detects arithmetic, logical, creative, planning, analysis problems
- Template suggestions: Recommends appropriate reasoning templates

Usage Tips:
- Use autoMode for automatic reasoning optimization
- Trigger phrases like "Let's think step by step" automatically enable Auto-CoT
- The tool will suggest mode switches when appropriate`,
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
        enum: ["draft", "concise", "standard", "analysis", "auto"],
        description: "Reasoning mode to use"
      },
      problemType: {
        type: "string",
        enum: ["arithmetic", "logical", "creative", "planning", "analysis", "general"],
        description: "Type of problem being solved"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed"
      },
      confidence: {
        type: "number",
        description: "Confidence level (0-10, default: 5)",
        minimum: 0,
        maximum: 10
      },
      autoMode: {
        type: "boolean",
        description: "Enable automatic CoT generation with intelligent suggestions"
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
