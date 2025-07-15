import chalk from 'chalk';
import {
  ThoughtData,
  ChainMetrics,
  ChainTemplate,
  ReasoningMode,
  ProblemType,
  MODE_CONFIGS,
  PROBLEM_TYPE_DEFAULTS,
  CHAIN_TEMPLATES,
  ConsensusData,
  RollbackState,
  AutoCoTConfig
} from './types.js';

export class EnhancedChainOfThoughtServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private rollbackHistory: RollbackState[] = [];
  private thoughtSnapshots: Map<number, ThoughtData[]> = new Map();
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

  private generateMultiplePaths(input: Partial<ThoughtData>, pathCount: number = 3): ThoughtData[][] {
    const paths: ThoughtData[][] = [];
    
    for (let i = 0; i < pathCount; i++) {
      const path: ThoughtData[] = [];
      
      // Generate slight variations for diversity
      const variations = this.generatePathVariations(input, i);
      
      for (const variation of variations) {
        const thoughtData: ThoughtData = {
          ...input as any,
          ...variation,
          mode: this.determineOptimalMode(variation.thought || '', this.currentProblemType),
          wordCount: this.countWords(variation.thought || ''),
          tokenCount: this.estimateTokenCount(variation.thought || ''),
          timestamp: Date.now()
        };
        
        path.push(thoughtData);
      }
      
      paths.push(path);
    }
    
    return paths;
  }

  private generatePathVariations(input: Partial<ThoughtData>, pathIndex: number): Partial<ThoughtData>[] {
    const baseThought = input.thought || '';
    const variations: Partial<ThoughtData>[] = [];
    
    // Create variations based on different reasoning approaches
    switch (pathIndex) {
      case 0:
        // Direct approach
        variations.push({
          thought: baseThought,
          thoughtNumber: input.thoughtNumber || 1,
          totalThoughts: input.totalThoughts || 1,
          nextThoughtNeeded: input.nextThoughtNeeded || false
        });
        break;
        
      case 1:
        // Alternative perspective
        variations.push({
          thought: `Alternatively: ${baseThought}`,
          thoughtNumber: input.thoughtNumber || 1,
          totalThoughts: input.totalThoughts || 1,
          nextThoughtNeeded: input.nextThoughtNeeded || false
        });
        break;
        
      case 2:
        // Cautious approach
        variations.push({
          thought: `Considering carefully: ${baseThought}`,
          thoughtNumber: input.thoughtNumber || 1,
          totalThoughts: input.totalThoughts || 1,
          nextThoughtNeeded: input.nextThoughtNeeded || false
        });
        break;
        
      default:
        // Additional variations for higher path counts
        variations.push({
          thought: `Path ${pathIndex + 1}: ${baseThought}`,
          thoughtNumber: input.thoughtNumber || 1,
          totalThoughts: input.totalThoughts || 1,
          nextThoughtNeeded: input.nextThoughtNeeded || false
        });
    }
    
    return variations;
  }

  private calculateConsensus(paths: ThoughtData[][]): ConsensusData {
    if (paths.length === 0) {
      throw new Error('No paths provided for consensus calculation');
    }

    // Extract final thoughts from each path
    const finalThoughts = paths.map(path => path[path.length - 1]?.thought || '');
    
    // Simple majority voting on key concepts
    const conceptCounts: Record<string, number> = {};
    const votingResults: Record<string, number> = {};
    
    finalThoughts.forEach((thought, index) => {
      const concepts = this.extractKeyConcepts(thought);
      votingResults[`path_${index + 1}`] = concepts.length;
      
      concepts.forEach(concept => {
        conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
      });
    });
    
    // Find the most common concepts
    const sortedConcepts = Object.entries(conceptCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    // Calculate consensus based on agreement
    const totalPaths = paths.length;
    const agreementScore = sortedConcepts.length > 0 
      ? sortedConcepts[0][1] / totalPaths 
      : 0;
    
    // Generate consensus statement
    const consensus = this.generateConsensusStatement(sortedConcepts, finalThoughts);
    
    // Calculate confidence based on agreement
    const confidence = Math.min(agreementScore * 1.2, 1.0);
    
    return {
      paths,
      consensus,
      confidence,
      agreementScore,
      pathCount: totalPaths,
      votingResults
    };
  }

  private extractKeyConcepts(thought: string): string[] {
    // Simple concept extraction based on significant words
    const words = thought.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'were', 'said', 'each', 'which', 'their', 'time', 'into', 'more', 'very', 'what', 'know', 'just', 'first', 'after', 'back', 'other', 'many', 'than', 'then', 'them', 'these', 'some', 'could', 'would', 'should'].includes(word));
    
    // Return unique concepts
    return [...new Set(words)];
  }

  private generateConsensusStatement(sortedConcepts: [string, number][], finalThoughts: string[]): string {
    if (sortedConcepts.length === 0) {
      return 'No clear consensus found among reasoning paths';
    }
    
    const topConcepts = sortedConcepts.slice(0, 2).map(([concept]) => concept);
    const pathCount = finalThoughts.length;
    
    return `Consensus across ${pathCount} reasoning paths centers on: ${topConcepts.join(', ')}. ${sortedConcepts[0][1]}/${pathCount} paths align on this approach.`;
  }

  private detectAutoCoTTrigger(thought: string): boolean {
    if (!this.autoCoTConfig.trigger) return false;
    
    const lowerThought = thought.toLowerCase();
    const triggerPhrase = this.autoCoTConfig.trigger.toLowerCase();
    
    // Check for exact trigger phrase
    if (lowerThought.includes(triggerPhrase)) {
      return true;
    }
    
    // Check for similar trigger patterns
    const triggerPatterns = [
      'let me think',
      'let\'s think',
      'thinking step by step',
      'step by step',
      'let me work through this',
      'let me break this down',
      'let\'s work through',
      'let\'s break this down'
    ];
    
    return triggerPatterns.some(pattern => lowerThought.includes(pattern));
  }

  private analyzeContentForAutoMode(thought: string): ReasoningMode {
    if (!this.autoCoTConfig.contextAware) {
      return this.currentMode;
    }
    
    const lowerThought = thought.toLowerCase();
    const wordCount = this.countWords(thought);
    
    // Analyze mathematical content
    const mathPatterns = /(\d+[\+\-\*\/\=]\d+|calculate|solve|equation|formula|math)/i;
    if (mathPatterns.test(thought) && wordCount <= 10) {
      return 'draft';
    }
    
    // Analyze logical reasoning content
    const logicalPatterns = /(if.*then|because|therefore|thus|hence|implies|logic|reason)/i;
    if (logicalPatterns.test(thought) && wordCount <= 20) {
      return 'concise';
    }
    
    // Analyze creative content
    const creativePatterns = /(story|creative|imagine|design|brainstorm|idea|innovate)/i;
    if (creativePatterns.test(thought)) {
      return 'standard';
    }
    
    // Check for complexity indicators first
    const complexityIndicators = ['however', 'although', 'furthermore', 'moreover', 'nevertheless', 'complex', 'detailed', 'thoroughly', 'multiple considerations', 'systematically'];
    const hasComplexity = complexityIndicators.some(indicator => lowerThought.includes(indicator));
    
    // Analyze complex analysis content
    const analysisPatterns = /(analyze|compare|evaluate|assess|consider|examine|pros.*cons)/i;
    if (analysisPatterns.test(thought) && (hasComplexity || wordCount > 20)) {
      return 'standard';
    } else if (analysisPatterns.test(thought)) {
      return 'concise';
    }
    
    // Default based on complexity indicators and word count
    if (hasComplexity || wordCount > 20) {
      return 'standard';
    } else if (wordCount <= 8) {
      return 'draft';
    } else {
      return 'concise';
    }
  }

  private suggestTemplate(thought: string, problemType: ProblemType): ChainTemplate | undefined {
    if (!this.autoCoTConfig.templateSuggestion) {
      return undefined;
    }
    
    const lowerThought = thought.toLowerCase();
    
    // Find templates that match the problem type
    const matchingTemplates = this.templates.filter(t => t.problemType === problemType);
    
    if (matchingTemplates.length === 0) {
      return undefined;
    }
    
    // Score templates based on content relevance
    const scoredTemplates = matchingTemplates.map(template => {
      let score = 0;
      
      // Check if thought contains template-relevant keywords
      const templateKeywords = template.description.toLowerCase().split(' ');
      templateKeywords.forEach(keyword => {
        if (keyword.length > 3 && lowerThought.includes(keyword)) {
          score += 1;
        }
      });
      
      // Check example thoughts for similarity
      template.exampleThoughts.forEach(example => {
        const exampleWords = example.toLowerCase().split(' ');
        exampleWords.forEach(word => {
          if (word.length > 3 && lowerThought.includes(word)) {
            score += 0.5;
          }
        });
      });
      
      return { template, score };
    });
    
    // Return the best matching template if score is significant
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
    
    // Generate variations based on problem type
    switch (template.problemType) {
      case 'arithmetic':
        examples.push(baseExample);
        examples.push('Calculate systematically');
        examples.push('Solve step-by-step');
        break;
        
      case 'logical':
        examples.push(baseExample);
        examples.push('Apply logical reasoning');
        examples.push('Consider premises and conclusions');
        break;
        
      case 'creative':
        examples.push(baseExample);
        examples.push('Explore creative possibilities');
        examples.push('Generate innovative solutions');
        break;
        
      case 'planning':
        examples.push(baseExample);
        examples.push('Break down into actionable steps');
        examples.push('Consider resources and constraints');
        break;
        
      case 'analysis':
        examples.push(baseExample);
        examples.push('Examine from multiple angles');
        examples.push('Compare different perspectives');
        break;
        
      default:
        examples.push(baseExample);
        examples.push('Think systematically');
        examples.push('Consider all aspects');
    }
    
    return examples.slice(0, Math.min(count, 3));
  }

  private detectProblemType(thought: string): ProblemType {
    const lowerThought = thought.toLowerCase();
    
    // Mathematical/arithmetic patterns
    const mathPatterns = /(\d+[\+\-\*\/\=]\d+|calculate|solve|equation|formula|math|arithmetic|number|sum|product|divide)/i;
    if (mathPatterns.test(thought)) {
      return 'arithmetic';
    }
    
    // Logical reasoning patterns
    const logicPatterns = /(if.*then|because|therefore|thus|hence|implies|logic|reason|premise|conclusion|valid|invalid)/i;
    if (logicPatterns.test(thought)) {
      return 'logical';
    }
    
    // Creative patterns
    const creativePatterns = /(story|creative|imagine|design|brainstorm|idea|innovate|art|write|compose|invent)/i;
    if (creativePatterns.test(thought)) {
      return 'creative';
    }
    
    // Planning patterns
    const planningPatterns = /(plan|schedule|organize|strategy|steps|process|workflow|timeline|roadmap|goal)/i;
    if (planningPatterns.test(thought)) {
      return 'planning';
    }
    
    // Analysis patterns
    const analysisPatterns = /(analyze|compare|evaluate|assess|consider|examine|pros.*cons|advantages|disadvantages|review)/i;
    if (analysisPatterns.test(thought)) {
      return 'analysis';
    }
    
    // Default to general
    return 'general';
  }

  private saveThoughtSnapshot(thoughtNumber: number): void {
    // Save a deep copy of the current state
    this.thoughtSnapshots.set(thoughtNumber, [...this.thoughtHistory]);
  }

  private rollbackToThought(thoughtNumber: number, reason: string): RollbackState {
    const targetThought = this.thoughtHistory.find(t => t.thoughtNumber === thoughtNumber);
    if (!targetThought) {
      throw new Error(`Cannot rollback: thought ${thoughtNumber} not found`);
    }

    // Create rollback state with unique ID
    const rollbackState: RollbackState = {
      thoughtId: `rollback_${thoughtNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      previousStates: [...this.thoughtHistory],
      rollbackReason: reason,
      correctedThought: targetThought,
      timestamp: Date.now()
    };

    // Restore state by keeping only thoughts up to and including the target
    this.thoughtHistory = this.thoughtHistory.filter(t => t.thoughtNumber <= thoughtNumber);

    // Store rollback in history
    this.rollbackHistory.push(rollbackState);

    // Clean up branches that reference removed thoughts
    this.cleanupBranchesAfterRollback(thoughtNumber);

    return rollbackState;
  }

  private cleanupBranchesAfterRollback(thoughtNumber: number): void {
    Object.keys(this.branches).forEach(branchId => {
      this.branches[branchId] = this.branches[branchId].filter(
        t => (t.branchFromThought || 0) <= thoughtNumber
      );
      
      // Remove empty branches
      if (this.branches[branchId].length === 0) {
        delete this.branches[branchId];
      }
    });
  }

  private canRollback(thoughtNumber: number): boolean {
    return thoughtNumber > 0 && thoughtNumber <= this.thoughtHistory.length;
  }

  private getRevisionHistory(thoughtNumber: number): ThoughtData[] {
    return this.rollbackHistory
      .filter(r => r.correctedThought.thoughtNumber === thoughtNumber)
      .map(r => r.correctedThought);
  }

  private handleRollback(thoughtNumber: number, reason: string): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      if (!this.canRollback(thoughtNumber)) {
        throw new Error(`Cannot rollback to thought ${thoughtNumber}: invalid thought number`);
      }

      const rollbackState = this.rollbackToThought(thoughtNumber, reason);
      
      // Log rollback operation
      if (!this.disableLogging) {
        console.error(chalk.yellow(`🔄 Rollback to thought ${thoughtNumber}: ${reason}`));
        console.error(chalk.gray(`Restored to: "${rollbackState.correctedThought.thought}"`));
        console.error(chalk.gray(`Rollback ID: ${rollbackState.thoughtId}`));
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            operation: 'rollback',
            rolledBackTo: thoughtNumber,
            reason: reason,
            rollbackId: rollbackState.thoughtId,
            restoredThought: rollbackState.correctedThought.thought,
            currentHistoryLength: this.thoughtHistory.length,
            rollbackCount: this.rollbackHistory.length,
            availableSnapshots: Array.from(this.thoughtSnapshots.keys()),
            message: `Successfully rolled back to thought ${thoughtNumber}`
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            operation: 'rollback',
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
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

  private validateThoughtData(input: unknown): Partial<ThoughtData> & { pathCount?: number; rollbackToThought?: number; rollbackReason?: string; autoMode?: boolean } {
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

    // Validate mode if provided
    if (data.mode && !['draft', 'concise', 'standard', 'auto'].includes(data.mode as string)) {
      throw new Error('Invalid mode: must be draft, concise, standard, or auto');
    }

    // Validate problem type if provided
    if (data.problemType && !['arithmetic', 'logical', 'creative', 'planning', 'analysis', 'general'].includes(data.problemType as string)) {
      throw new Error('Invalid problemType');
    }

    // Validate pathCount if provided
    if (data.pathCount !== undefined && (typeof data.pathCount !== 'number' || data.pathCount < 1 || data.pathCount > 10)) {
      throw new Error('Invalid pathCount: must be a number between 1 and 10');
    }

    // Validate rollback parameters if provided
    if (data.rollbackToThought !== undefined && (typeof data.rollbackToThought !== 'number' || data.rollbackToThought < 1)) {
      throw new Error('Invalid rollbackToThought: must be a positive number');
    }

    if (data.rollbackReason !== undefined && typeof data.rollbackReason !== 'string') {
      throw new Error('Invalid rollbackReason: must be a string');
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
      isRevision: data.isRevision as boolean,
      revisesThought: data.revisesThought as number,
      branchFromThought: data.branchFromThought as number,
      branchId: data.branchId as string,
      needsMoreThoughts: data.needsMoreThoughts as boolean,
      confidence: data.confidence as number,
      pathCount: data.pathCount as number,
      rollbackToThought: data.rollbackToThought as number,
      rollbackReason: data.rollbackReason as string,
      autoMode: data.autoMode as boolean
    };
  }

  public processThought(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const validatedInput = this.validateThoughtData(input);
      
      // Handle rollback operation first
      if (validatedInput.rollbackToThought) {
        const rollbackResult = this.handleRollback(validatedInput.rollbackToThought, validatedInput.rollbackReason || 'Manual rollback');
        return rollbackResult;
      }
      
      // Auto-CoT processing
      let autoCoTSuggestions: any = {};
      const isAutoModeEnabled = validatedInput.autoMode;
      const hasAutoTrigger = this.detectAutoCoTTrigger(validatedInput.thought || '');
      
      if (isAutoModeEnabled || hasAutoTrigger) {
        // Automatic mode selection based on content
        const suggestedMode = this.analyzeContentForAutoMode(validatedInput.thought || '');
        
        // Auto-detect problem type if not provided
        const detectedProblemType = validatedInput.problemType || this.detectProblemType(validatedInput.thought || '');
        
        // Template suggestion
        const suggestedTemplate = this.suggestTemplate(validatedInput.thought || '', detectedProblemType);
        
        autoCoTSuggestions = {
          autoTriggerDetected: hasAutoTrigger,
          suggestedMode,
          detectedProblemType,
          suggestedTemplate: suggestedTemplate ? {
            name: suggestedTemplate.name,
            description: suggestedTemplate.description,
            exampleThoughts: this.generateDiverseExamples(suggestedTemplate)
          } : undefined
        };
        
        // Apply auto-suggestions
        if (!validatedInput.mode) {
          validatedInput.mode = suggestedMode;
        }
        if (!validatedInput.problemType) {
          validatedInput.problemType = detectedProblemType;
        }
      }

      // Set mode and problem type
      if (validatedInput.mode) {
        this.currentMode = validatedInput.mode;
      }
      if (validatedInput.problemType) {
        this.currentProblemType = validatedInput.problemType;
      }

      // Check if self-consistency is requested
      const pathCount = validatedInput.pathCount;
      let consensusData: ConsensusData | undefined;

      if (pathCount && pathCount > 1 && validatedInput.thought && validatedInput.thought.trim().length > 0) {
        // Generate multiple reasoning paths
        const paths = this.generateMultiplePaths(validatedInput, pathCount);
        consensusData = this.calculateConsensus(paths);
        
        // Log consensus results
        if (!this.disableLogging) {
          console.error(chalk.magenta(`🔄 Self-Consistency with ${pathCount} paths`));
          console.error(chalk.gray(`Agreement: ${(consensusData.agreementScore * 100).toFixed(1)}%`));
          console.error(chalk.gray(`Confidence: ${(consensusData.confidence * 100).toFixed(1)}%`));
          console.error(chalk.blue(`Consensus: ${consensusData.consensus}`));
        }
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

      // Save snapshot after adding new thought (for rollback support)
      this.saveThoughtSnapshot(thoughtData.thoughtNumber);

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

      // Prepare response with optional consensus data
      const responseData: any = {
        thoughtNumber: thoughtData.thoughtNumber,
        totalThoughts: thoughtData.totalThoughts,
        nextThoughtNeeded: thoughtData.nextThoughtNeeded,
        currentMode: actualMode,
        suggestedMode: thoughtData.suggestedModeSwitch,
        suggestedBranching: thoughtData.suggestedBranching,
        nextBranchId: thoughtData.suggestedBranching ? this.generateBranchId() : undefined,
        branches: Object.keys(this.branches),
        thoughtHistoryLength: this.thoughtHistory.length
      };

      // Add consensus data if available
      if (consensusData) {
        responseData.consensus = {
          statement: consensusData.consensus,
          confidence: consensusData.confidence,
          agreementScore: consensusData.agreementScore,
          pathCount: consensusData.pathCount,
          votingResults: consensusData.votingResults
        };
      }

      // Add auto-CoT suggestions if available
      if (Object.keys(autoCoTSuggestions).length > 0) {
        responseData.autoCoT = autoCoTSuggestions;
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(responseData, null, 2)
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
    this.rollbackHistory = [];
    this.thoughtSnapshots.clear();
    this.currentMode = 'auto';
    this.currentProblemType = 'general';
    this.startTime = Date.now();

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: 'reset',
          message: 'Chain of thought history, branches, and rollback data cleared'
        }, null, 2)
      }]
    };
  }
}