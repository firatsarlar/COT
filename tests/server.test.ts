import { EnhancedChainOfThoughtServer } from '../src/server.js';
import { CHAIN_TEMPLATES } from '../src/types.js';

describe('EnhancedChainOfThoughtServer', () => {
  let server: EnhancedChainOfThoughtServer;

  beforeEach(() => {
    server = new EnhancedChainOfThoughtServer();
  });

  describe('processThought', () => {
    it('should process a basic thought correctly', () => {
      const input = {
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      };

      const result = server.processThought(input);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.thoughtNumber).toBe(1);
      expect(response.totalThoughts).toBe(3);
      expect(response.nextThoughtNeeded).toBe(true);
      expect(response.thoughtHistoryLength).toBe(1);
    });

    it('should handle mode specification', () => {
      const input = {
        thought: 'Test',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        mode: 'draft'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.currentMode).toBe('draft');
    });

    it('should handle problem type specification', () => {
      const input = {
        thought: 'Solve math problem',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        problemType: 'arithmetic'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.currentMode).toBe('draft'); // arithmetic defaults to draft
    });

    it('should validate input parameters', () => {
      const invalidInputs = [
        { thought: 123 }, // invalid thought type
        { thought: 'test', thoughtNumber: 'invalid' }, // invalid thoughtNumber
        { thought: 'test', thoughtNumber: 1, totalThoughts: 'invalid' }, // invalid totalThoughts
        { thought: 'test', thoughtNumber: 1, totalThoughts: 1 } // missing nextThoughtNeeded
      ];

      invalidInputs.forEach(input => {
        const result = server.processThought(input);
        expect(result.isError).toBe(true);
      });
    });
  });

  describe('getChainSummary', () => {
    it('should return empty summary for new server', () => {
      const result = server.getChainSummary();
      const summary = JSON.parse(result.content[0].text);

      expect(summary.totalThoughts).toBe(0);
      expect(summary.thoughtChain).toHaveLength(0);
    });

    it('should return summary after processing thoughts', () => {
      server.processThought({
        thought: 'First thought',
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

      const result = server.getChainSummary();
      const summary = JSON.parse(result.content[0].text);

      expect(summary.totalThoughts).toBe(2);
      expect(summary.thoughtChain).toHaveLength(2);
      expect(summary.metrics.totalWords).toBeGreaterThan(0);
      expect(summary.metrics.efficiency).toBeGreaterThan(0);
    });
  });

  describe('loadTemplate', () => {
    it('should load existing template', () => {
      const templateName = 'GSM8K Math';
      const result = server.loadTemplate(templateName);
      const response = JSON.parse(result.content[0].text);

      expect(response.loaded).toBe(templateName);
      expect(response.mode).toBe('draft');
      expect(response.problemType).toBe('arithmetic');
      expect(response.exampleThoughts).toBeDefined();
    });

    it('should handle non-existent template', () => {
      const result = server.loadTemplate('NonExistent');
      const response = JSON.parse(result.content[0].text);

      expect(response.error).toBeDefined();
      expect(response.availableTemplates).toBeDefined();
      expect(response.availableTemplates.length).toBeGreaterThan(0);
    });

    it('should list all available templates', () => {
      const result = server.loadTemplate('NonExistent');
      const response = JSON.parse(result.content[0].text);

      expect(response.availableTemplates).toEqual(
        CHAIN_TEMPLATES.map(t => t.name)
      );
    });
  });

  describe('reset', () => {
    it('should reset server state', () => {
      server.processThought({
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      let summary = server.getChainSummary();
      let summaryData = JSON.parse(summary.content[0].text);
      expect(summaryData.totalThoughts).toBe(1);

      const result = server.reset();
      const response = JSON.parse(result.content[0].text);

      expect(response.status).toBe('reset');

      summary = server.getChainSummary();
      summaryData = JSON.parse(summary.content[0].text);
      expect(summaryData.totalThoughts).toBe(0);
    });
  });

  describe('mode optimization', () => {
    it('should use draft mode for math problems', () => {
      const input = {
        thought: '2 + 2 = 4',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        mode: 'auto',
        problemType: 'arithmetic'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.currentMode).toBe('draft');
    });

    it('should use standard mode for creative problems', () => {
      const input = {
        thought: 'Let me create a story about a magical forest',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        mode: 'auto',
        problemType: 'creative'
      };

      const result = server.processThought(input);
      const response = JSON.parse(result.content[0].text);

      expect(response.currentMode).toBe('standard');
    });
  });
});
