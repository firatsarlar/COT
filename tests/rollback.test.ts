import { EnhancedChainOfThoughtServer } from '../src/server.js';

describe('Rollback/Backtracking Support', () => {
  let server: EnhancedChainOfThoughtServer;

  beforeEach(() => {
    server = new EnhancedChainOfThoughtServer();
  });

  describe('Basic Rollback Operations', () => {
    it('should rollback to a previous thought successfully', () => {
      // Add some thoughts first
      server.processThought({
        thought: 'First thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Second thought',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Third thought',
        thoughtNumber: 3,
        totalThoughts: 3,
        nextThoughtNeeded: false
      });

      // Now rollback to thought 2
      const result = server.processThought({
        thought: 'Rollback operation',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 2,
        rollbackReason: 'Found error in third thought'
      });

      const response = JSON.parse(result.content[0].text);
      
      expect(response.operation).toBe('rollback');
      expect(response.rolledBackTo).toBe(2);
      expect(response.reason).toBe('Found error in third thought');
      expect(response.rollbackId).toBeDefined();
      expect(response.currentHistoryLength).toBe(2);
      expect(result.isError).toBeFalsy();
    });

    it('should maintain rollback history', () => {
      // Add thoughts
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

      // First rollback
      const result1 = server.processThought({
        thought: 'Rollback 1',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'First rollback'
      });

      const response1 = JSON.parse(result1.content[0].text);
      expect(response1.rollbackCount).toBe(1);

      // Add another thought
      server.processThought({
        thought: 'New second thought',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      // Second rollback
      const result2 = server.processThought({
        thought: 'Rollback 2',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'Second rollback'
      });

      const response2 = JSON.parse(result2.content[0].text);
      expect(response2.rollbackCount).toBe(2);
    });
  });

  describe('Rollback Validation', () => {
    it('should reject rollback to invalid thought number', () => {
      server.processThought({
        thought: 'Only thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      const result = server.processThought({
        thought: 'Invalid rollback',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 5,
        rollbackReason: 'Invalid rollback'
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('Cannot rollback to thought 5');
      expect(response.operation).toBe('rollback');
      expect(response.status).toBe('failed');
    });

    it('should reject rollback to thought 0', () => {
      server.processThought({
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      const result = server.processThought({
        thought: 'Invalid rollback',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 0,
        rollbackReason: 'Invalid'
      });

      expect(result.isError).toBe(true);
    });

    it('should validate rollbackReason parameter', () => {
      const result = server.processThought({
        thought: 'Test',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 123 // Invalid type
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('Invalid rollbackReason');
    });
  });

  describe('Branch Cleanup on Rollback', () => {
    it('should clean up branches that reference removed thoughts', () => {
      // Create a chain with branches
      server.processThought({
        thought: 'Root thought',
        thoughtNumber: 1,
        totalThoughts: 4,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Second thought',
        thoughtNumber: 2,
        totalThoughts: 4,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Branch from thought 2',
        thoughtNumber: 3,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        branchFromThought: 2,
        branchId: 'A'
      });

      server.processThought({
        thought: 'Fourth thought',
        thoughtNumber: 4,
        totalThoughts: 4,
        nextThoughtNeeded: false
      });

      // Rollback to thought 1 (should remove branch)
      const result = server.processThought({
        thought: 'Rollback',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'Reset to beginning'
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.currentHistoryLength).toBe(1);
      
      // Verify branches are cleaned up by checking next operation
      const nextResult = server.processThought({
        thought: 'New thought after rollback',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      const nextResponse = JSON.parse(nextResult.content[0].text);
      expect(nextResponse.branches).toEqual([]);
    });

    it('should preserve branches that are still valid after rollback', () => {
      server.processThought({
        thought: 'Root thought',
        thoughtNumber: 1,
        totalThoughts: 4,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Branch from root',
        thoughtNumber: 2,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        branchFromThought: 1,
        branchId: 'A'
      });

      server.processThought({
        thought: 'Third thought',
        thoughtNumber: 3,
        totalThoughts: 4,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Fourth thought',
        thoughtNumber: 4,
        totalThoughts: 4,
        nextThoughtNeeded: false
      });

      // Rollback to thought 2 (branch should be preserved)
      const result = server.processThought({
        thought: 'Rollback',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 2,
        rollbackReason: 'Keep branch'
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.currentHistoryLength).toBe(2);

      // Check that branch is still there
      const nextResult = server.processThought({
        thought: 'Check branches',
        thoughtNumber: 3,
        totalThoughts: 3,
        nextThoughtNeeded: false
      });

      const nextResponse = JSON.parse(nextResult.content[0].text);
      expect(nextResponse.branches).toContain('A');
    });
  });

  describe('Snapshot Management', () => {
    it('should save snapshots for each thought', () => {
      server.processThought({
        thought: 'First',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Second',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Third',
        thoughtNumber: 3,
        totalThoughts: 3,
        nextThoughtNeeded: false
      });

      const result = server.processThought({
        thought: 'Rollback',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 2,
        rollbackReason: 'Test snapshots'
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.availableSnapshots).toContain(1);
      expect(response.availableSnapshots).toContain(2);
      expect(response.availableSnapshots).toContain(3);
    });

    it('should restore from snapshots correctly', () => {
      server.processThought({
        thought: 'Original first',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Original second',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      // Rollback to thought 1
      const rollbackResult = server.processThought({
        thought: 'Rollback',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'Test restore'
      });

      const rollbackResponse = JSON.parse(rollbackResult.content[0].text);
      expect(rollbackResponse.restoredThought).toBe('Original first');
      expect(rollbackResponse.currentHistoryLength).toBe(1);
    });
  });

  describe('Integration with Other Features', () => {
    it('should work with consensus after rollback', () => {
      // Add initial thoughts
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
        rollbackReason: 'Start over'
      });

      // Add new thought with consensus
      const result = server.processThought({
        thought: 'New path with consensus',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        pathCount: 3
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.consensus).toBeDefined();
      expect(response.thoughtHistoryLength).toBe(2);
    });

    it('should reset rollback data on server reset', () => {
      // Add thought and rollback
      server.processThought({
        thought: 'Test',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      server.processThought({
        thought: 'Rollback',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'Test'
      });

      // Reset server
      const resetResult = server.reset();
      const resetResponse = JSON.parse(resetResult.content[0].text);
      
      expect(resetResponse.message).toContain('rollback data cleared');

      // Verify rollback count is 0 after reset
      server.processThought({
        thought: 'After reset',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      const result = server.processThought({
        thought: 'Check rollback count',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'After reset test'
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.rollbackCount).toBe(1); // First rollback after reset
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rollback on empty history gracefully', () => {
      const result = server.processThought({
        thought: 'Rollback on empty',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'Empty history test'
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('Cannot rollback');
    });

    it('should handle rollback without reason', () => {
      server.processThought({
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      const result = server.processThought({
        thought: 'Rollback without reason',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1
        // No rollbackReason provided
      });

      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0].text);
      expect(response.reason).toBe('Manual rollback'); // Default reason
    });

    it('should generate unique rollback IDs', () => {
      server.processThought({
        thought: 'Test',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      const result1 = server.processThought({
        thought: 'Rollback 1',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'First'
      });

      server.processThought({
        thought: 'Another thought',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      const result2 = server.processThought({
        thought: 'Rollback 2',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
        rollbackToThought: 1,
        rollbackReason: 'Second'
      });

      const response1 = JSON.parse(result1.content[0].text);
      const response2 = JSON.parse(result2.content[0].text);
      
      expect(response1.rollbackId).not.toBe(response2.rollbackId);
    });
  });
});