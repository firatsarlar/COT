import chalk from 'chalk';
import {
  ThoughtData,
  ChainMetrics,
  ChainTemplate,
  ReasoningMode,
  ProblemType,
  MODE_CONFIGS,
  CHAIN_TEMPLATES,
  AutoCoTConfig,
  STANDARD_AVG_WORDS_FOR_EFFICIENCY
} from './types.js';

export class EnhancedChainOfThoughtServer {
  private thoughtHistory: ThoughtData[] = [];
  private currentMode: ReasoningMode = 'auto';
  private currentProblemType: ProblemType = 'general';
  private startTime: number = Date.now();
  private disableLogging: boolean;
  private templates: ChainTemplate[] = CHAIN_TEMPLATES;
  private autoCoTConfig: AutoCoTConfig = {
    trigger: 'Let\'s think step by step',
    diversitySampling: true,
    templateSuggestion: true,
    contextAware: true
  };

  constructor() {
    this.disableLogging = (process.env.DISABLE_COT_LOGGING || "").toLowerCase() === "true";
  }

  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private determineOptimalMode(thought: string, problemType: ProblemType): ReasoningMode {
    if (this.currentMode !== 'auto') return this.currentMode;

    const wordCount = this.countWords(thought);
    const requiresDetail = thought.includes('explain') ||
                          thought.includes('why') ||
                          thought.includes('how') ||
                          problemType === 'creative';
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
    return STANDARD_AVG_WORDS_FOR_EFFICIENCY / avgWords;
  }

  private suggestModeSwitch(currentThought: ThoughtData): ReasoningMode | undefined {
    const recentThoughts = this.thoughtHistory.slice(-3);

    if (this.currentMode === 'standard' && recentThoughts.every(t => t.wordCount < 10)) {
      return 'concise';
    }
    if (this.currentMode === 'draft' && currentThought.wordCount > MODE_CONFIGS.draft.maxWords) {
      return 'concise';
    }
    if (this.calculateEfficiency() < 0.5 && this.currentMode === 'standard') {
      return 'concise';
    }
    return undefined;
  }

  private detectAutoCoTTrigger(thought: string): boolean {
    if (!this.autoCoTConfig.trigger) return false;

    const lowerThought = thought.toLowerCase();
    const triggerPhrase = this.autoCoTConfig.trigger.toLowerCase();

    if (lowerThought.includes(triggerPhrase)) return true;

    const triggerPatterns = [
      'let me think', 'let\'s think', 'thinking step by step',
      'step by step', 'let me work through this', 'let me break this down',
      'let\'s work through', 'let\'s break this down'
    ];
    return triggerPatterns.some(pattern => lowerThought.includes(pattern));
  }

  private analyzeContentForAutoMode(thought: string): ReasoningMode {
    if (!this.autoCoTConfig.contextAware) return this.currentMode;

    const lowerThought = thought.toLowerCase();
    const wordCount = this.countWords(thought);

    if (/(\d+[\+\-\*\/\=]\d+|calculate|solve|equation|formula|math)/i.test(thought) && wordCount <= 10) {
      return 'draft';
    }
    if (/(if.*then|because|therefore|thus|hence|implies|logic|reason)/i.test(thought) && wordCount <= 20) {
      return 'concise';
    }
    if (/(story|creative|imagine|design|brainstorm|idea|innovate)/i.test(thought)) {
      return 'standard';
    }

    const complexityIndicators = ['however', 'although', 'furthermore', 'moreover', 'nevertheless', 'complex', 'detailed', 'thoroughly', 'multiple considerations', 'systematically'];
    const hasComplexity = complexityIndicators.some(indicator => lowerThought.includes(indicator));

    if (/(analyze|compare|evaluate|assess|consider|examine|pros.*cons)/i.test(thought) && (hasComplexity || wordCount > 20)) {
      return 'standard';
    } else if (/(analyze|compare|evaluate|assess|consider|examine|pros.*cons)/i.test(thought)) {
      return 'concise';
    }

    if (hasComplexity || wordCount > 20) return 'standard';
    if (wordCount <= 8) return 'draft';
    return 'concise';
  }

  private suggestTemplate(thought: string, problemType: ProblemType): ChainTemplate | undefined {
    if (!this.autoCoTConfig.templateSuggestion) return undefined;

    const lowerThought = thought.toLowerCase();
    const matchingTemplates = this.templates.filter(t => t.problemType === problemType);
    if (matchingTemplates.length === 0) return undefined;

    const scoredTemplates = matchingTemplates.map(template => {
      let score = 0;
      const templateKeywords = template.description.toLowerCase().split(' ');
      templateKeywords.forEach(keyword => {
        if (keyword.length > 3 && lowerThought.includes(keyword)) score += 1;
      });
      template.exampleThoughts.forEach(example => {
        const exampleWords = example.toLowerCase().split(' ');
        exampleWords.forEach(word => {
          if (word.length > 3 && lowerThought.includes(word)) score += 0.5;
        });
      });
      return { template, score };
    });

    const bestMatch = scoredTemplates.reduce((best, current) =>
      current.score > best.score ? current : best
    );
    return bestMatch.score > 1.5 ? bestMatch.template : undefined;
  }

  private generateDiverseExamples(template: ChainTemplate, count: number = 3): string[] {
    if (!this.autoCoTConfig.diversitySampling || count <= 1) {
      return template.exampleThoughts.slice(0, 1);
    }

    const examples: string[] = [];
    const baseExample = template.exampleThoughts[0] || 'Think step by step';

    switch (template.problemType) {
      case 'arithmetic':
        examples.push(baseExample, 'Calculate systematically', 'Solve step-by-step');
        break;
      case 'logical':
        examples.push(baseExample, 'Apply logical reasoning', 'Consider premises and conclusions');
        break;
      case 'creative':
        examples.push(baseExample, 'Explore creative possibilities', 'Generate innovative solutions');
        break;
      case 'planning':
        examples.push(baseExample, 'Break down into actionable steps', 'Consider resources and constraints');
        break;
      case 'analysis':
        examples.push(baseExample, 'Examine from multiple angles', 'Compare different perspectives');
        break;
      default:
        examples.push(baseExample, 'Think systematically', 'Consider all aspects');
    }
    return examples.slice(0, Math.min(count, 3));
  }

  private detectProblemType(thought: string): ProblemType {
    if (/(\d+[\+\-\*\/\=]\d+|calculate|solve|equation|formula|math|arithmetic|number|sum|product|divide)/i.test(thought)) {
      return 'arithmetic';
    }
    if (/(if.*then|because|therefore|thus|hence|implies|logic|reason|premise|conclusion|valid|invalid)/i.test(thought)) {
      return 'logical';
    }
    if (/(story|creative|imagine|design|brainstorm|idea|innovate|art|write|compose|invent)/i.test(thought)) {
      return 'creative';
    }
    if (/(plan|schedule|organize|strategy|steps|process|workflow|timeline|roadmap|goal)/i.test(thought)) {
      return 'planning';
    }
    if (/(analyze|compare|evaluate|assess|consider|examine|pros.*cons|advantages|disadvantages|review)/i.test(thought)) {
      return 'analysis';
    }
    return 'general';
  }

  private formatThought(thoughtData: ThoughtData): string {
    const config = MODE_CONFIGS[thoughtData.mode];
    const modeColor = config.color;

    const prefix = modeColor(`[${thoughtData.mode.toUpperCase()}]`);
    const metrics = chalk.gray(`[${thoughtData.wordCount}w, ~${thoughtData.tokenCount}t]`);
    const header = `${prefix} ${thoughtData.thoughtNumber}/${thoughtData.totalThoughts} ${metrics}`;

    let suggestions = '';
    if (thoughtData.suggestedModeSwitch) {
      suggestions += chalk.yellow(`\n  -> Consider switching to ${thoughtData.suggestedModeSwitch} mode`);
    }

    const border = '-'.repeat(Math.max(50, thoughtData.thought.length + 4));
    return `\n${border}\n${header}\n${thoughtData.thought}${suggestions}\n${border}`;
  }

  private generateMetrics(): ChainMetrics {
    const totalWords = this.thoughtHistory.reduce((sum, t) => sum + t.wordCount, 0);
    const totalTokens = this.thoughtHistory.reduce((sum, t) => sum + (t.tokenCount || 0), 0);

    const modeDistribution: Record<ReasoningMode, number> = {
      draft: 0, concise: 0, standard: 0, analysis: 0, auto: 0
    };
    this.thoughtHistory.forEach(t => modeDistribution[t.mode]++);

    return {
      totalTokens,
      totalWords,
      averageWordsPerThought: this.thoughtHistory.length > 0 ? totalWords / this.thoughtHistory.length : 0,
      efficiency: this.calculateEfficiency(),
      latency: Date.now() - this.startTime,
      modeDistribution
    };
  }

  private validateThoughtData(input: unknown): Partial<ThoughtData> & { autoMode?: boolean } {
    const data = input as Record<string, unknown>;

    if (data.thought === undefined || data.thought === null || typeof data.thought !== 'string') {
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
    if (data.mode && !['draft', 'concise', 'standard', 'analysis', 'auto'].includes(data.mode as string)) {
      throw new Error('Invalid mode: must be draft, concise, standard, analysis, or auto');
    }
    if (data.problemType && !['arithmetic', 'logical', 'creative', 'planning', 'analysis', 'general'].includes(data.problemType as string)) {
      throw new Error('Invalid problemType');
    }
    if (data.autoMode !== undefined && typeof data.autoMode !== 'boolean') {
      throw new Error('Invalid autoMode: must be a boolean');
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      mode: data.mode as ReasoningMode,
      problemType: data.problemType as ProblemType,
      needsMoreThoughts: data.needsMoreThoughts as boolean,
      confidence: data.confidence as number,
      autoMode: data.autoMode as boolean
    };
  }

  public processThought(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const validatedInput = this.validateThoughtData(input);

      // Handle auto-CoT
      const autoCoTSuggestions = this._handleAutoCoT(validatedInput);

      if (!validatedInput.mode && autoCoTSuggestions.suggestedMode) {
        validatedInput.mode = autoCoTSuggestions.suggestedMode;
      }
      if (!validatedInput.problemType && autoCoTSuggestions.detectedProblemType) {
        validatedInput.problemType = autoCoTSuggestions.detectedProblemType;
      }

      if (validatedInput.mode) this.currentMode = validatedInput.mode;
      if (validatedInput.problemType) this.currentProblemType = validatedInput.problemType;

      // Process and store thought
      const thoughtData = this._processAndStoreThought(validatedInput);

      const responseData: any = {
        thoughtNumber: thoughtData.thoughtNumber,
        totalThoughts: thoughtData.totalThoughts,
        nextThoughtNeeded: thoughtData.nextThoughtNeeded,
        currentMode: thoughtData.mode,
        suggestedMode: thoughtData.suggestedModeSwitch,
        thoughtHistoryLength: this.thoughtHistory.length
      };

      if (Object.keys(autoCoTSuggestions).length > 0) {
        responseData.autoCoT = autoCoTSuggestions;
      }

      return {
        content: [{ type: "text", text: JSON.stringify(responseData, null, 2) }]
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

  private _handleAutoCoT(validatedInput: Partial<ThoughtData> & { autoMode?: boolean }): any {
    const isAutoModeEnabled = validatedInput.autoMode;
    const hasAutoTrigger = this.detectAutoCoTTrigger(validatedInput.thought || '');

    if (!isAutoModeEnabled && !hasAutoTrigger) return {};

    const suggestedMode = this.analyzeContentForAutoMode(validatedInput.thought || '');
    const detectedProblemType = validatedInput.problemType || this.detectProblemType(validatedInput.thought || '');
    const suggestedTemplate = this.suggestTemplate(validatedInput.thought || '', detectedProblemType);

    return {
      autoTriggerDetected: hasAutoTrigger,
      suggestedMode,
      detectedProblemType,
      suggestedTemplate: suggestedTemplate ? {
        name: suggestedTemplate.name,
        description: suggestedTemplate.description,
        exampleThoughts: this.generateDiverseExamples(suggestedTemplate)
      } : undefined
    };
  }

  private _processAndStoreThought(validatedInput: Partial<ThoughtData>): ThoughtData {
    const actualMode = this.determineOptimalMode(validatedInput.thought!, this.currentProblemType);
    const wordCount = this.countWords(validatedInput.thought!);
    const tokenCount = this.estimateTokenCount(validatedInput.thought!);

    const maxWords = MODE_CONFIGS[actualMode].maxWords;
    if (actualMode !== 'auto' && wordCount > maxWords) {
      console.warn(chalk.yellow(`Warning: Thought exceeds ${actualMode} mode limit (${wordCount}/${maxWords} words)`));
    }

    const thoughtData: ThoughtData = {
      thought: validatedInput.thought!,
      thoughtNumber: validatedInput.thoughtNumber!,
      totalThoughts: validatedInput.totalThoughts!,
      nextThoughtNeeded: validatedInput.nextThoughtNeeded!,
      mode: actualMode,
      wordCount,
      tokenCount,
      timestamp: Date.now(),
      problemType: validatedInput.problemType,
      confidence: validatedInput.confidence,
      needsMoreThoughts: validatedInput.needsMoreThoughts,
      suggestedModeSwitch: undefined
    };

    thoughtData.suggestedModeSwitch = this.suggestModeSwitch(thoughtData);

    if (thoughtData.thoughtNumber > thoughtData.totalThoughts) {
      thoughtData.totalThoughts = thoughtData.thoughtNumber;
    }

    this.thoughtHistory.push(thoughtData);

    if (!this.disableLogging) {
      console.error(this.formatThought(thoughtData));
    }
    return thoughtData;
  }

  public getChainSummary(): { content: Array<{ type: string; text: string }> } {
    const metrics = this.generateMetrics();

    const summary = {
      totalThoughts: this.thoughtHistory.length,
      metrics,
      modeUsage: metrics.modeDistribution,
      problemType: this.currentProblemType,
      thoughtChain: this.thoughtHistory.map(t => ({
        number: t.thoughtNumber,
        mode: t.mode,
        words: t.wordCount,
        thought: t.thought.substring(0, 50) + (t.thought.length > 50 ? '...' : '')
      }))
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }]
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
