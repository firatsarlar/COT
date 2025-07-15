import chalk from 'chalk';

// Types and Interfaces
export type ReasoningMode = 'draft' | 'concise' | 'standard' | 'auto';
export type ProblemType = 'arithmetic' | 'logical' | 'creative' | 'planning' | 'analysis' | 'general';

export interface ThoughtData {
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
  suggestedBranching?: string;
}

export interface ChainMetrics {
  totalTokens: number;
  totalWords: number;
  averageWordsPerThought: number;
  efficiency: number; // compared to standard CoT
  accuracy?: number;
  latency: number;
  modeDistribution: Record<ReasoningMode, number>;
}

export interface ChainTemplate {
  name: string;
  problemType: ProblemType;
  mode: ReasoningMode;
  exampleThoughts: string[];
  description: string;
}

export interface ConsensusData {
  paths: ThoughtData[][];
  consensus: string;
  confidence: number;
  agreementScore: number;
  pathCount: number;
  votingResults: Record<string, number>;
}

export interface RollbackState {
  thoughtId: string;
  previousStates: ThoughtData[];
  rollbackReason: string;
  correctedThought: ThoughtData;
  timestamp: number;
}

export interface AutoCoTConfig {
  trigger: string;
  diversitySampling: boolean;
  templateSuggestion: boolean;
  contextAware: boolean;
}

// Mode configurations
export const MODE_CONFIGS = {
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
export const PROBLEM_TYPE_DEFAULTS: Record<ProblemType, ReasoningMode> = {
  arithmetic: 'draft',
  logical: 'draft',
  creative: 'standard',
  planning: 'concise',
  analysis: 'concise',
  general: 'auto'
};

// Chain templates from research
export const CHAIN_TEMPLATES: ChainTemplate[] = [
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
  },
  {
    name: "Tree Exploration",
    problemType: "analysis",
    mode: "concise",
    description: "Systematic tree-like exploration of options with branching",
    exampleThoughts: [
      "Root: Problem space analysis",
      "Branch A: Option 1 feasibility",
      "Branch B: Option 2 constraints", 
      "Branch A1: Implementation path",
      "Branch A2: Alternative approach",
      "Merge: Best solution synthesis"
    ]
  },
  {
    name: "Decision Tree",
    problemType: "planning",
    mode: "concise",
    description: "Structured decision making with clear branching points",
    exampleThoughts: [
      "Root: Core decision criteria",
      "If condition A → Branch left",
      "If condition B → Branch right",
      "Left branch: Pros/cons analysis",
      "Right branch: Risk assessment",
      "Final: Optimal path selection"
    ]
  },
  {
    name: "Debugging Tree",
    problemType: "logical",
    mode: "concise",
    description: "Systematic debugging with hypothesis branching",
    exampleThoughts: [
      "Error: Initial problem statement",
      "Hypothesis A: Network issue",
      "Hypothesis B: Logic error",
      "Test A: Network diagnostics",
      "Test B: Code review",
      "Branch A failed → Try B",
      "Solution: Root cause found"
    ]
  },
  {
    name: "Research Tree",
    problemType: "analysis",
    mode: "standard",
    description: "Multi-perspective research with branching viewpoints",
    exampleThoughts: [
      "Topic: Central research question",
      "Branch 1: Academic perspective with detailed literature review",
      "Branch 2: Industry perspective with market analysis",
      "Branch 3: User perspective with behavioral insights",
      "Cross-analysis: Connecting patterns across branches",
      "Synthesis: Integrated understanding and conclusions"
    ]
  },
  {
    name: "Feature Design Tree",
    problemType: "creative",
    mode: "standard", 
    description: "Feature development with architectural branching",
    exampleThoughts: [
      "Feature goal: Core user need identification",
      "UI Branch: Interface design considerations and user flow",
      "Backend Branch: Data models and API requirements",
      "Performance Branch: Optimization and scaling concerns",
      "Integration points: How branches connect and dependencies",
      "MVP definition: Minimal viable implementation path"
    ]
  },
  {
    name: "Learning Tree",
    problemType: "general",
    mode: "concise",
    description: "Knowledge acquisition with concept branching",
    exampleThoughts: [
      "Core concept: Foundation",
      "Branch 1: Practical applications",
      "Branch 2: Theoretical depth",
      "Branch 3: Related concepts",
      "Connections: Links between branches",
      "Mastery: Integrated understanding"
    ]
  }
];