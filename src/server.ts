import chalk from 'chalk';
import {
  ThoughtData,
  ChainMetrics,
  ChainTemplate,
  ReasoningMode,
  ProblemType,
  MODE_CONFIGS,
  PROBLEM_TYPE_DEFAULTS,
  CHAIN_TEMPLATES
} from './types.js';

export class EnhancedChainOfThoughtServer {
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

  private suggestBranching(currentThought: ThoughtData): string | undefined {
    const thought = currentThought.thought.toLowerCase();
    
    // Suggest branching for decision points
    if (thought.includes('or ') || thought.includes('alternatively') || thought.includes('however')) {
      return 'Consider branching to explore alternative approaches';
    }
    
    // Suggest branching for uncertainty
    if (thought.includes('maybe') || thought.includes('possibly') || thought.includes('might')) {
      return 'Branch to explore different possibilities';
    }
    
    // Suggest branching for complex problems
    if (this.currentProblemType === 'analysis' || this.currentProblemType === 'planning') {
      if (currentThought.thoughtNumber >= 2 && !this.hasActiveBranches()) {
        return 'Consider branching to analyze different aspects';
      }
    }
    
    // Suggest branching for creative problems
    if (this.currentProblemType === 'creative' && currentThought.thoughtNumber >= 3) {
      return 'Branch to explore creative alternatives';
    }
    
    return undefined;
  }

  private hasActiveBranches(): boolean {
    return Object.keys(this.branches).length > 0;
  }

  private generateBranchId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const existingIds = Object.keys(this.branches);
    
    for (let i = 0; i < chars.length; i++) {
      const id = chars[i];
      if (!existingIds.includes(id)) {
        return id;
      }
    }
    
    // If all single letters are used, use double letters
    for (let i = 0; i < chars.length; i++) {
      for (let j = 0; j < chars.length; j++) {
        const id = chars[i] + chars[j];
        if (!existingIds.includes(id)) {
          return id;
        }
      }
    }
    
    return `BR-${Date.now()}`;
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
    
    // Add suggestions if any
    let suggestions = '';
    if (thoughtData.suggestedModeSwitch) {
      suggestions += chalk.yellow(`\n│ 💡 Consider switching to ${thoughtData.suggestedModeSwitch} mode`);
    }
    if (thoughtData.suggestedBranching) {
      suggestions += chalk.cyan(`\n│ 🌿 ${thoughtData.suggestedBranching}`);
      suggestions += chalk.gray(`\n│ 📝 Use branchFromThought: ${thoughtData.thoughtNumber}, branchId: "${this.generateBranchId()}"`);
    }

    const border = '─'.repeat(Math.max(header.length, thoughtData.thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thoughtData.thought.padEnd(border.length - 2)} │${suggestions}
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
      
      // Check if branching is recommended
      thoughtData.suggestedBranching = this.suggestBranching(thoughtData);

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

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtNumber: thoughtData.thoughtNumber,
            totalThoughts: thoughtData.totalThoughts,
            nextThoughtNeeded: thoughtData.nextThoughtNeeded,
            currentMode: actualMode,
            suggestedMode: thoughtData.suggestedModeSwitch,
            suggestedBranching: thoughtData.suggestedBranching,
            nextBranchId: thoughtData.suggestedBranching ? this.generateBranchId() : undefined,
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