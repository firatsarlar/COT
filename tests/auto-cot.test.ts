import { EnhancedChainOfThoughtServer } from '../src/server.js';

describe('Auto-CoT Generation', () => {
  let server: EnhancedChainOfThoughtServer;

  beforeEach(() => {
    server = new EnhancedChainOfThoughtServer();
  });

  describe('Auto-Trigger Detection', () => {
    it('should detect "Let\'s think step by step" trigger', () => {
      const input = {
        thought: 'Let\'s think step by step about this problem',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT).toBeDefined();
      expect(response.autoCoT.autoTriggerDetected).toBe(true);
    });

    it('should detect similar trigger patterns', () => {
      const triggerPhrases = [
        'Let me think about this',
        'Let me work through this step by step',
        'Let me break this down',
        'Let\'s work through this problem',
        'Thinking step by step here'
      ];

      triggerPhrases.forEach(phrase => {
        const input = {
          thought: phrase,
          thoughtNumber: 1,
          totalThoughts: 1,
          nextThoughtNeeded: false
        };

        const result = server.processThought(input);
        const response = JSON.parse(result.content[0].text);

        expect(response.autoCoT).toBeDefined();
        expect(response.autoCoT.autoTriggerDetected).toBe(true);
      });
    });

    it('should not trigger on unrelated thoughts', () => {
      const input = {
        thought: 'This is just a regular thought without triggers',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT).toBeUndefined();
    });
  });

  describe('Automatic Mode Selection', () => {
    it('should suggest draft mode for math problems', () => {
      const input = {
        thought: 'Calculate 2 + 3 * 4',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.suggestedMode).toBe('draft');
      expect(response.currentMode).toBe('draft');
    });

    it('should suggest concise mode for logical reasoning', () => {
      const input = {
        thought: 'If A implies B and B implies C, then A implies C',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.suggestedMode).toBe('concise');
      expect(response.currentMode).toBe('concise');
    });

    it('should suggest standard mode for creative tasks', () => {
      const input = {
        thought: 'Let me design a creative story about space exploration',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.suggestedMode).toBe('standard');
      expect(response.currentMode).toBe('standard');
    });

    it('should suggest appropriate mode based on complexity', () => {
      const input = {
        thought: 'This is a very complex problem that requires detailed analysis with multiple considerations, however we need to examine all aspects thoroughly and systematically',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.suggestedMode).toBe('standard');
    });
  });

  describe('Problem Type Detection', () => {
    it('should detect arithmetic problems', () => {
      const input = {
        thought: 'Solve the equation: 2x + 5 = 15',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.detectedProblemType).toBe('arithmetic');
    });

    it('should detect logical problems', () => {
      const input = {
        thought: 'Given the premises, what conclusion can we logically derive?',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.detectedProblemType).toBe('logical');
    });

    it('should detect creative problems', () => {
      const input = {
        thought: 'Brainstorm innovative ideas for a new art installation',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.detectedProblemType).toBe('creative');
    });

    it('should detect planning problems', () => {
      const input = {
        thought: 'Create a detailed project timeline and strategy',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.detectedProblemType).toBe('planning');
    });

    it('should detect analysis problems', () => {
      const input = {
        thought: 'Compare and evaluate the advantages and disadvantages of different approaches',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.detectedProblemType).toBe('analysis');
    });

    it('should default to general for unclear problems', () => {
      const input = {
        thought: 'Just some random thoughts here',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.detectedProblemType).toBe('general');
    });
  });

  describe('Template Auto-Suggestion', () => {
    it('should suggest relevant templates for math problems', () => {
      const input = {
        thought: 'Let me solve this arithmetic math problem with numbers and calculation',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.suggestedTemplate).toBeDefined();
      expect(response.autoCoT.suggestedTemplate.name).toContain('Math');
    });

    it('should provide diverse examples for templates', () => {
      const input = {
        thought: 'Let me think through this mathematical calculation',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      if (response.autoCoT.suggestedTemplate) {
        expect(response.autoCoT.suggestedTemplate.exampleThoughts).toBeDefined();
        expect(Array.isArray(response.autoCoT.suggestedTemplate.exampleThoughts)).toBe(true);
        expect(response.autoCoT.suggestedTemplate.exampleThoughts.length).toBeGreaterThan(0);
      }
    });

    it('should not suggest templates for low-relevance content', () => {
      const input = {
        thought: 'Random unrelated content without specific patterns',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT.suggestedTemplate).toBeUndefined();
    });
  });

  describe('Integration with Explicit AutoMode', () => {
    it('should activate auto-CoT when autoMode is enabled', () => {
      const input = {
        thought: 'Analyze this complex problem thoroughly',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT).toBeDefined();
      expect(response.autoCoT.detectedProblemType).toBe('analysis');
      expect(response.autoCoT.suggestedMode).toBeDefined();
    });

    it('should not activate auto-CoT when autoMode is false', () => {
      const input = {
        thought: 'Analyze this complex problem thoroughly',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: false
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT).toBeUndefined();
    });

    it('should respect explicit mode when autoMode is enabled', () => {
      const input = {
        thought: 'Simple math: 2+2',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true,
        mode: 'standard' // Explicitly set different mode
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.currentMode).toBe('standard'); // Should respect explicit mode
      expect(response.autoCoT.suggestedMode).toBe('draft'); // But still suggest optimal
    });
  });

  describe('Integration with Other Features', () => {
    it('should work with consensus when auto-CoT is enabled', () => {
      const input = {
        thought: 'Let\'s think step by step about this mathematical problem',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 3
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT).toBeDefined();
      expect(response.consensus).toBeDefined();
      expect(response.autoCoT.autoTriggerDetected).toBe(true);
    });

    it('should work with branching suggestions', () => {
      const input = {
        thought: 'Let me think through this - we could try option A or option B',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT).toBeDefined();
      expect(response.suggestedBranching).toBeDefined();
    });

    it('should work after rollback operations', () => {
      // Add initial thought
      server.processThought({
        thought: 'Initial thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Second thought',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      // Rollback
      server.processThought({
        thought: 'Rollback',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'Test'
      });

      // Add new thought with auto-CoT
      const result = server.processThought({
        thought: 'Let\'s think step by step about the new approach',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.autoCoT).toBeDefined();
      expect(response.autoCoT.autoTriggerDetected).toBe(true);
    });
  });

  describe('Validation and Edge Cases', () => {
    it('should validate autoMode parameter type', () => {
      const input = {
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: 'invalid' // Wrong type
      };

      const result = server.processThought(input);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('Invalid autoMode');
    });

    it('should handle empty thoughts with auto-CoT', () => {
      const input = {
        thought: '',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      // Should detect general problem type for empty thoughts
      expect(response.autoCoT.detectedProblemType).toBe('general');
    });

    it('should handle very long thoughts efficiently', () => {
      const longThought = 'Let me think step by step. This is a very long thought that contains many words and complex ideas. '.repeat(20);
      
      const input = {
        thought: longThought,
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        autoMode: true
      };

      const startTime = Date.now();
      const result = server.processThought(input);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
      expect(result.isError).toBeFalsy();
      
      const response = JSON.parse(result.content[0].text);
      expect(response.autoCoT).toBeDefined();
    });

    it('should handle case insensitive trigger detection', () => {
      const input = {
        thought: 'LET\'S THINK STEP BY STEP',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT).toBeDefined();
      expect(response.autoCoT.autoTriggerDetected).toBe(true);
    });
  });

  describe('Configuration and Customization', () => {
    it('should use default auto-CoT configuration', () => {
      const input = {
        thought: 'Let me think step by step about this',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.autoCoT).toBeDefined();
      expect(response.autoCoT.autoTriggerDetected).toBe(true);
      // Should have detected problem type (contextAware: true)
      expect(response.autoCoT.detectedProblemType).toBeDefined();
    });
  });
});