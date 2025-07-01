#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

// Types and Interfaces
type ReasoningMode = 'draft' | 'concise' | 'standard' | 'auto';
type ProblemType = 'arithmetic' | 'logical' | 'creative' | 'planning' | 'analysis' | 'general';

interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  mode: ReasoningMode;
  tokenCount?: number;
  wordCount: number;
  timestamp: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
  problemType?: ProblemType;
  confidence?: number;
  suggestedModeSwitch?: ReasoningMode;
}

interface ChainMetrics {
  totalTokens: number;
  totalWords: number;
  averageWordsPerThought: number;
  efficiency: number; // compared to standard CoT
  accuracy?: number;
  latency: number;
  modeDistribution: Record<ReasoningMode, number>;
}

interface ChainTemplate {
  name: string;
  problemType: ProblemType;
  mode: ReasoningMode;
  exampleThoughts: string[];
  description: string;
}

// Mode configurations
const MODE_CONFIGS = {
  draft: {
    maxWords: 5,
    description: "Ultra-concise reasoning (≤5 words) inspired by Chain of Draft",
    color: chalk.cyan,
    tokenMultiplier: 0.2
  },
  concise: {
    maxWords: 15,
    description: "Concise reasoning (≤15 words) balancing clarity and efficiency",
    color: chalk.green,
    tokenMultiplier: 0.4
  },
  standard: {
    maxWords: Infinity,
    description: "Standard Chain of Thought with detailed reasoning",
    color: chalk.blue,
    tokenMultiplier: 1.0
  },
  auto: {
    maxWords: Infinity,
    description: "Adaptive mode that switches based on problem complexity",
    color: chalk.magenta,
    tokenMultiplier: 0.6
  }
};

// Problem type optimal modes
const PROBLEM_TYPE_DEFAULTS: Record<ProblemType, ReasoningMode> = {
  arithmetic: 'draft',
  logical: 'draft',
  creative: 'standard',
  planning: 'concise',
  analysis: 'concise',
  general: 'auto'
};

// Chain templates from research
const CHAIN_TEMPLATES: ChainTemplate[] = [
  {
    name: "GSM8K Math",
    problemType: "arithmetic",
    mode: "draft",
    description: "Math word problem solving using minimal notation",
    exampleThoughts: [
      "20 - x = 12",
      "x = 8",
      "#### 8"
    ]
  },
  {
    name: "Coin Flip",
    problemType: "logical",
    mode: "draft",
    description: "Tracking state changes with minimal notation",
    exampleThoughts: [
      "H→T (flip)",
      "T→H (flip)",
      "H (no flip)",
      "#### heads"
    ]
  },
  {
    name: "Creative Writing",
    problemType: "creative",
    mode: "standard",
    description: "Detailed creative process with full reasoning",
    exampleThoughts: [
      "Setting: A mysterious library that appears only at midnight",
      "Protagonist: Young librarian discovers ancient texts that predict the future",
      "Conflict: Each prediction read alters reality, creating paradoxes",
      "Theme: The weight of knowledge and free will vs determinism"
    ]
  }
];

class EnhancedChainOfThoughtServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private currentMode: ReasoningMode = 'auto';
  private currentProblemType: ProblemType = 'general';
  private startTime: number = Date.now();
  private disableLogging: boolean;
  private templates: ChainTemplate[] = CHAIN_TEMPLATES;

  constructor() {
    this.disableLogging = (process.env.DISABLE_COT_LOGGING || "").toLowerCase() === "true";
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private determineOptimalMode(thought: string, problemType: ProblemType): ReasoningMode {
    // Auto mode logic
    if (this.currentMode !== 'auto') return this.currentMode;

    const wordCount = this.countWords(thought);
    
    // Check if problem requires detailed explanation
    const requiresDetail = thought.includes('explain') || 
                          thought.includes('why') || 
                          thought.includes('how') ||
                          problemType === 'creative';

    // Check if problem is mathematical/logical
    const isMathLogical = /[0-9+\-*/=<>]/.test(thought) || 
                         problemType === 'arithmetic' || 
                         problemType === 'logical';

    if (isMathLogical && wordCount <= 5) return 'draft';
    if (!requiresDetail && wordCount <= 15) return 'concise';
    return 'standard';
  }

  private calculateEfficiency(): number {
    if (this.thoughtHistory.length === 0) return 1.0;

    const avgWords = this.thoughtHistory.reduce((sum, t) => sum + t.wordCount, 0) / this.thoughtHistory.length;
    const standardAvgWords = 50; // Assumed average for standard CoT
    
    return standardAvgWords / avgWords;
  }

  private suggestModeSwitch(currentThought: ThoughtData): ReasoningMode | undefined {
    // Suggest mode switches based on patterns
    const recentThoughts = this.thoughtHistory.slice(-3);
    
    // If recent thoughts are all very short and we're in standard mode
    if (this.currentMode === 'standard' && 
        recentThoughts.every(t => t.wordCount < 10)) {
      return 'concise';
    }

    // If we're in draft mode but thoughts are getting complex
    if (this.currentMode === 'draft' && 
        currentThought.wordCount > MODE_CONFIGS.draft.maxWords) {
      return 'concise';
    }

    // If efficiency is very low in current mode
    const efficiency = this.calculateEfficiency();
    if (efficiency < 0.5 && this.currentMode === 'standard') {
      return 'concise';
    }

    return undefined;
  }

  private formatThought(thoughtData: ThoughtData): string {
    const config = MODE_CONFIGS[thoughtData.mode];
    const modeColor = config.color;
    
    let prefix = '';
    let context = '';

    if (thoughtData.isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${thoughtData.revisesThought})`;
    } else if (thoughtData.branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${thoughtData.branchFromThought}, ID: ${thoughtData.branchId})`;
    } else {
      prefix = modeColor(`💭 ${thoughtData.mode.toUpperCase()}`);
      context = '';
    }

    const metrics = chalk.gray(`[${thoughtData.wordCount} words, ~${thoughtData.tokenCount} tokens]`);
    const header = `${prefix} ${thoughtData.thoughtNumber}/${thoughtData.totalThoughts}${context} ${metrics}`;
    
    // Add mode switch suggestion if any
    const suggestion = thoughtData.suggestedModeSwitch ? 
      chalk.yellow(`\n│ 💡 Consider switching to ${thoughtData.suggestedModeSwitch} mode`) : '';

    const border = '─'.repeat(Math.max(header.length, thoughtData.thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thoughtData.thought.padEnd(border.length - 2)} │${suggestion}
└${border}┘`;
  }

  private generateMetrics(): ChainMetrics {
    const totalWords = this.thoughtHistory.reduce((sum, t) => sum + t.wordCount, 0);
    const totalTokens = this.thoughtHistory.reduce((sum, t) => sum + (t.tokenCount || 0), 0);
    
    const modeDistribution: Record<ReasoningMode, number> = {
      draft: 0,
      concise: 0,
      standard: 0,
      auto: 0
    };

    this.thoughtHistory.forEach(t => {
      modeDistribution[t.mode]++;
    });

    return {
      totalTokens,
      totalWords,
      averageWordsPerThought: this.thoughtHistory.length > 0 ? totalWords / this.thoughtHistory.length : 0,
      efficiency: this.calculateEfficiency(),
      latency: Date.now() - this.startTime,
      modeDistribution
    };
  }

  private validateThoughtData(input: unknown): Partial<ThoughtData> {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== 'string') {
      throw new Error('Invalid thought: must be a string');
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
      throw new Error('Invalid thoughtNumber: must be a number');
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
      throw new Error('Invalid totalThoughts: must be a number');
    }
    if (typeof data.nextThoughtNeeded !== 'boolean') {
      throw new Error('Invalid nextThoughtNeeded: must be a boolean');
    }

    // Validate mode if provided
    if (data.mode && !['draft', 'concise', 'standard', 'auto'].includes(data.mode as string)) {
      throw new Error('Invalid mode: must be draft, concise, standard, or auto');
    }

    // Validate problem type if provided
    if (data.problemType && !['arithmetic', 'logical', 'creative', 'planning', 'analysis', 'general'].includes(data.problemType as string)) {
      throw new Error('Invalid problemType');
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      mode: data.mode as ReasoningMode,
      problemType: data.problemType as ProblemType,
      isRevision: data.isRevision as boolean,
      revisesThought: data.revisesThought as number,
      branchFromThought: data.branchFromThought as number,
      branchId: data.branchId as string,
      needsMoreThoughts: data.needsMoreThoughts as boolean,
      confidence: data.confidence as number
    };
  }

  public processThought(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const validatedInput = this.validateThoughtData(input);
      
      // Set mode and problem type
      if (validatedInput.mode) {
        this.currentMode = validatedInput.mode;
      }
      if (validatedInput.problemType) {
        this.currentProblemType = validatedInput.problemType;
      }

      // Determine actual mode for this thought
      const actualMode = this.determineOptimalMode(
        validatedInput.thought!, 
        this.currentProblemType
      );

      // Calculate metrics
      const wordCount = this.countWords(validatedInput.thought!);
      const tokenCount = this.estimateTokenCount(validatedInput.thought!);

      // Check word limit for mode
      const maxWords = MODE_CONFIGS[actualMode].maxWords;
      if (actualMode !== 'auto' && wordCount > maxWords) {
        console.warn(chalk.yellow(`⚠️  Thought exceeds ${actualMode} mode limit (${wordCount}/${maxWords} words)`));
      }

      // Create complete thought data
      const thoughtData: ThoughtData = {
        ...validatedInput as any,
        mode: actualMode,
        wordCount,
        tokenCount,
        timestamp: Date.now(),
        suggestedModeSwitch: undefined
      };

      // Check if mode switch is recommended
      thoughtData.suggestedModeSwitch = this.suggestModeSwitch(thoughtData);

      // Update total thoughts if needed
      if (thoughtData.thoughtNumber > thoughtData.totalThoughts) {
        thoughtData.totalThoughts = thoughtData.thoughtNumber;
      }

      // Store thought
      this.thoughtHistory.push(thoughtData);

      // Handle branching
      if (thoughtData.branchFromThought && thoughtData.branchId) {
        if (!this.branches[thoughtData.branchId]) {
          this.branches[thoughtData.branchId] = [];
        }
        this.branches[thoughtData.branchId].push(thoughtData);
      }

      // Log formatted thought
      if (!this.disableLogging) {
        const formattedThought = this.formatThought(thoughtData);
        console.error(formattedThought);
      }

      // Generate response with metrics
      const metrics = this.generateMetrics();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtNumber: thoughtData.thoughtNumber,
            totalThoughts: thoughtData.totalThoughts,
            nextThoughtNeeded: thoughtData.nextThoughtNeeded,
            currentMode: actualMode,
            suggestedMode: thoughtData.suggestedModeSwitch,
            metrics: {
              wordCount,
              tokenCount,
              totalWords: metrics.totalWords,
              totalTokens: metrics.totalTokens,
              efficiency: metrics.efficiency.toFixed(2),
              averageWordsPerThought: metrics.averageWordsPerThought.toFixed(1)
            },
            branches: Object.keys(this.branches),
            thoughtHistoryLength: this.thoughtHistory.length
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  public getChainSummary(): { content: Array<{ type: string; text: string }> } {
    const metrics = this.generateMetrics();
    
    const summary = {
      totalThoughts: this.thoughtHistory.length,
      metrics,
      modeUsage: metrics.modeDistribution,
      branches: Object.keys(this.branches).length,
      problemType: this.currentProblemType,
      thoughtChain: this.thoughtHistory.map(t => ({
        number: t.thoughtNumber,
        mode: t.mode,
        words: t.wordCount,
        thought: t.thought.substring(0, 50) + (t.thought.length > 50 ? '...' : '')
      }))
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(summary, null, 2)
      }]
    };
  }

  public loadTemplate(templateName: string): { content: Array<{ type: string; text: string }> } {
    const template = this.templates.find(t => t.name === templateName);
    
    if (!template) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: `Template '${templateName}' not found`,
            availableTemplates: this.templates.map(t => t.name)
          }, null, 2)
        }]
      };
    }

    this.currentMode = template.mode;
    this.currentProblemType = template.problemType;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          loaded: template.name,
          mode: template.mode,
          problemType: template.problemType,
          description: template.description,
          exampleThoughts: template.exampleThoughts
        }, null, 2)
      }]
    };
  }

  public reset(): { content: Array<{ type: string; text: string }> } {
    this.thoughtHistory = [];
    this.branches = {};
    this.currentMode = 'auto';
    this.currentProblemType = 'general';
    this.startTime = Date.now();

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: 'reset',
          message: 'Chain of thought history cleared'
        }, null, 2)
      }]
    };
  }
}

// Tool definitions
const CHAIN_OF_THOUGHT_TOOL: Tool = {
  name: "chainofthought",
  description: `Enhanced Chain of Thought reasoning tool with multiple modes inspired by Chain of Draft research.

Modes:
- draft: Ultra-concise reasoning (≤5 words) for maximum efficiency
- concise: Balanced reasoning (≤15 words) for clarity with efficiency  
- standard: Full Chain of Thought with detailed explanations
- auto: Adaptive mode that switches based on problem complexity

Features:
- Token and efficiency tracking
- Mode switching recommendations
- Branching and revision support
- Problem-type optimization
- Chain templates from research

Usage tips:
- Use 'draft' mode for math/logic problems (like GSM8K)
- Use 'concise' for planning and analysis
- Use 'standard' for creative or complex explanations
- Use 'auto' to let the system optimize

The tool tracks efficiency metrics and suggests mode switches when appropriate.`,
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

const CHAIN_SUMMARY_TOOL: Tool = {
  name: "chainsummary",
  description: "Get a summary of the current chain of thought including metrics and efficiency analysis",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

const LOAD_TEMPLATE_TOOL: Tool = {
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

const RESET_CHAIN_TOOL: Tool = {
  name: "resetchain",
  description: "Reset the chain of thought history",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

// Server setup
const server = new Server(
  {
    name: "enhanced-cot-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const cotServer = new EnhancedChainOfThoughtServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CHAIN_OF_THOUGHT_TOOL, CHAIN_SUMMARY_TOOL, LOAD_TEMPLATE_TOOL, RESET_CHAIN_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "chainofthought":
      return cotServer.processThought(request.params.arguments);
    
    case "chainsummary":
      return cotServer.getChainSummary();
    
    case "loadtemplate":
      return cotServer.loadTemplate(
        (request.params.arguments as any).templateName
      );
    
    case "resetchain":
      return cotServer.reset();
    
    default:
      return {
        content: [{
          type: "text",
          text: `Unknown tool: ${request.params.name}`
        }],
        isError: true
      };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(chalk.bold.green("🧠 Enhanced Chain of Thought MCP Server running"));
  console.error(chalk.gray("Modes: draft (≤5 words), concise (≤15 words), standard, auto"));
  console.error(chalk.gray("Set DISABLE_COT_LOGGING=true to disable thought visualization"));
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});