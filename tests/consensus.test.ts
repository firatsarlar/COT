import { EnhancedChainOfThoughtServer } from '../src/server.js';

describe('Self-Consistency Voting System', () => {
  let server: EnhancedChainOfThoughtServer;

  beforeEach(() => {
    server = new EnhancedChainOfThoughtServer();
  });

  describe('Multiple Path Generation', () => {
    it('should generate consensus data when pathCount > 1', () => {
      const input = {
        thought: 'What is 2 + 2?',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 3,
        problemType: 'arithmetic'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus).toBeDefined();
      expect(response.consensus.pathCount).toBe(3);
      expect(response.consensus.confidence).toBeGreaterThanOrEqual(0);
      expect(response.consensus.confidence).toBeLessThanOrEqual(1);
      expect(response.consensus.agreementScore).toBeGreaterThanOrEqual(0);
      expect(response.consensus.agreementScore).toBeLessThanOrEqual(1);
      expect(response.consensus.statement).toBeDefined();
      expect(typeof response.consensus.statement).toBe('string');
    });

    it('should not generate consensus data when pathCount is 1', () => {
      const input = {
        thought: 'Simple thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 1
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus).toBeUndefined();
    });

    it('should not generate consensus data when pathCount is undefined', () => {
      const input = {
        thought: 'Simple thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus).toBeUndefined();
    });
  });

  describe('Consensus Quality', () => {
    it('should handle arithmetic problems with high consensus', () => {
      const input = {
        thought: 'Calculate 5 * 6 = 30',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 4,
        problemType: 'arithmetic'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus.pathCount).toBe(4);
      expect(response.consensus.votingResults).toBeDefined();
      expect(Object.keys(response.consensus.votingResults)).toHaveLength(4);
    });

    it('should handle creative problems with diverse paths', () => {
      const input = {
        thought: 'Write a story about dragons, magic, and adventure',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true,
        pathCount: 3,
        problemType: 'creative'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus.pathCount).toBe(3);
      expect(response.consensus.statement).toContain('paths');
    });

    it('should generate meaningful consensus statements', () => {
      const input = {
        thought: 'Analyze the benefits and drawbacks of renewable energy solutions',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
        pathCount: 5,
        problemType: 'analysis'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus.statement).toBeDefined();
      expect(response.consensus.statement.length).toBeGreaterThan(20);
      expect(response.consensus.statement).toMatch(/\d+\/\d+ paths/);
    });
  });

  describe('Path Validation', () => {
    it('should validate pathCount range', () => {
      const input = {
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 15  // Above maximum
      };

      const result = server.processThought(input);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid pathCount');
    });

    it('should validate pathCount minimum', () => {
      const input = {
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 0  // Below minimum
      };

      const result = server.processThought(input);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid pathCount');
    });

    it('should handle valid pathCount values', () => {
      for (let pathCount = 2; pathCount <= 10; pathCount++) {
        const input = {
          thought: `Test thought ${pathCount}`,
          thoughtNumber: 1,
          totalThoughts: 1,
          nextThoughtNeeded: false,
          pathCount
        };

        const result = server.processThought(input);
        expect(result.isError).toBeFalsy();
        
        const response = JSON.parse(result.content[0].text);
        expect(response.consensus.pathCount).toBe(pathCount);
      }
    });
  });

  describe('Concept Extraction', () => {
    it('should extract meaningful concepts from thoughts', () => {
      const input = {
        thought: 'Machine learning algorithms require large datasets for training neural networks',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 3,
        problemType: 'analysis'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus.statement).toBeDefined();
      // Should contain relevant concepts like 'machine', 'learning', 'algorithms', etc.
      const statement = response.consensus.statement.toLowerCase();
      expect(statement.length).toBeGreaterThan(10);
    });

    it('should handle thoughts with no meaningful concepts', () => {
      const input = {
        thought: 'The the the this that with',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 3
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      // Expect low consensus but still generate some statement
      expect(response.consensus.statement).toBeDefined();
      expect(response.consensus.agreementScore).toBeLessThan(0.5);
    });
  });

  describe('Integration with Existing Features', () => {
    it('should work with branching', () => {
      const input = {
        thought: 'Consider option A or option B for this decision',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true,
        pathCount: 3,
        branchFromThought: 1,
        branchId: 'A',
        problemType: 'planning'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus).toBeDefined();
      expect(response.branches).toContain('A');
      expect(response.suggestedBranching).toBeDefined();
    });

    it('should work with mode optimization', () => {
      const input = {
        thought: 'Quick math: 7 * 8',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 3,
        mode: 'auto',
        problemType: 'arithmetic'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus).toBeDefined();
      expect(response.currentMode).toBe('draft'); // Should optimize to draft for math
    });

    it('should maintain thought history with consensus', () => {
      const input1 = {
        thought: 'First thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
        pathCount: 3
      };

      const input2 = {
        thought: 'Second thought',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        pathCount: 2
      };

      server.processThought(input1);
      const result2 = server.processThought(input2);
      const response2 = JSON.parse(result2.content[0].text);

      expect(response2.thoughtHistoryLength).toBe(2);
      expect(response2.consensus.pathCount).toBe(2);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty thoughts gracefully', () => {
      const input = {
        thought: '',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 3
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      // Empty thoughts should not trigger consensus (pathCount ignored)
      expect(response.consensus).toBeUndefined();
      expect(result.isError).toBeFalsy();
    });

    it('should handle very long thoughts', () => {
      const longThought = 'This is a very long thought '.repeat(50);
      const input = {
        thought: longThought,
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 3
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.consensus).toBeDefined();
      expect(result.isError).toBeFalsy();
    });

    it('should handle maximum pathCount efficiently', () => {
      const input = {
        thought: 'Performance test with maximum paths',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        pathCount: 10
      };

      const startTime = Date.now();
      const result = server.processThought(input);
      const endTime = Date.now();

      expect(result.isError).toBeFalsy();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      const response = JSON.parse(result.content[0].text);
      expect(response.consensus.pathCount).toBe(10);
    });
  });
});