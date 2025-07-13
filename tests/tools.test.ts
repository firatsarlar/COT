import { 
  CHAIN_OF_THOUGHT_TOOL, 
  CHAIN_SUMMARY_TOOL, 
  LOAD_TEMPLATE_TOOL, 
  RESET_CHAIN_TOOL 
} from '../src/tools.js';

describe('Tool Definitions', () => {
  describe('CHAIN_OF_THOUGHT_TOOL', () => {
    it('should have correct basic properties', () => {
      expect(CHAIN_OF_THOUGHT_TOOL.name).toBe('chainofthought');
      expect(CHAIN_OF_THOUGHT_TOOL.description).toBeDefined();
      expect(CHAIN_OF_THOUGHT_TOOL.inputSchema).toBeDefined();
    });

    it('should have comprehensive description mentioning branching', () => {
      const desc = CHAIN_OF_THOUGHT_TOOL.description;
      expect(desc).toBeDefined();
      expect(desc!.toLowerCase()).toContain('branching');
      expect(desc!.toLowerCase()).toContain('branch');
      expect(desc!.toLowerCase()).toContain('alternative');
    });

    it('should have proper input schema', () => {
      const schema = CHAIN_OF_THOUGHT_TOOL.inputSchema;
      
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toBeDefined();
      
      // Required fields
      const required = schema.required as string[];
      expect(required).toContain('thought');
      expect(required).toContain('nextThoughtNeeded');
      expect(required).toContain('thoughtNumber');
      expect(required).toContain('totalThoughts');
    });

    it('should have branching parameters in schema', () => {
      const props = CHAIN_OF_THOUGHT_TOOL.inputSchema.properties;
      expect(props).toBeDefined();
      
      expect((props as any).branchFromThought).toBeDefined();
      expect((props as any).branchId).toBeDefined();
      
      // These should be integers
      expect((props as any).branchFromThought.type).toBe('integer');
      expect((props as any).branchFromThought.minimum).toBe(1);
      
      // Branch ID should be string
      expect((props as any).branchId.type).toBe('string');
    });

    it('should have mode and problem type enums', () => {
      const props = CHAIN_OF_THOUGHT_TOOL.inputSchema.properties as any;
      
      expect(props.mode.enum).toEqual(['draft', 'concise', 'standard', 'auto']);
      expect(props.problemType.enum).toEqual([
        'arithmetic', 'logical', 'creative', 'planning', 'analysis', 'general'
      ]);
    });

    it('should have revision parameters', () => {
      const props = CHAIN_OF_THOUGHT_TOOL.inputSchema.properties as any;
      
      expect(props.isRevision).toBeDefined();
      expect(props.revisesThought).toBeDefined();
      
      expect(props.isRevision.type).toBe('boolean');
      expect(props.revisesThought.type).toBe('integer');
      expect(props.revisesThought.minimum).toBe(1);
    });
  });

  describe('CHAIN_SUMMARY_TOOL', () => {
    it('should have correct properties', () => {
      expect(CHAIN_SUMMARY_TOOL.name).toBe('chainsummary');
      expect(CHAIN_SUMMARY_TOOL.description).toBeDefined();
      expect(CHAIN_SUMMARY_TOOL.inputSchema).toBeDefined();
    });

    it('should have empty input schema', () => {
      const schema = CHAIN_SUMMARY_TOOL.inputSchema;
      expect(schema.type).toBe('object');
      expect(Object.keys(schema.properties || {})).toHaveLength(0);
    });

    it('should mention metrics in description', () => {
      const desc = CHAIN_SUMMARY_TOOL.description;
      expect(desc).toBeDefined();
      expect(desc!.toLowerCase()).toContain('summary');
      expect(desc!.toLowerCase()).toContain('metrics');
    });
  });

  describe('LOAD_TEMPLATE_TOOL', () => {
    it('should have correct properties', () => {
      expect(LOAD_TEMPLATE_TOOL.name).toBe('loadtemplate');
      expect(LOAD_TEMPLATE_TOOL.description).toBeDefined();
      expect(LOAD_TEMPLATE_TOOL.inputSchema).toBeDefined();
    });

    it('should require templateName', () => {
      const schema = LOAD_TEMPLATE_TOOL.inputSchema;
      expect(schema.required).toContain('templateName');
      expect((schema.properties as any).templateName.type).toBe('string');
    });

    it('should mention templates in description', () => {
      const desc = LOAD_TEMPLATE_TOOL.description;
      expect(desc).toBeDefined();
      expect(desc!.toLowerCase()).toContain('template');
      expect(desc!.toLowerCase()).toContain('research');
    });
  });

  describe('RESET_CHAIN_TOOL', () => {
    it('should have correct properties', () => {
      expect(RESET_CHAIN_TOOL.name).toBe('resetchain');
      expect(RESET_CHAIN_TOOL.description).toBeDefined();
      expect(RESET_CHAIN_TOOL.inputSchema).toBeDefined();
    });

    it('should have empty input schema', () => {
      const schema = RESET_CHAIN_TOOL.inputSchema;
      expect(schema.type).toBe('object');
      expect(Object.keys(schema.properties || {})).toHaveLength(0);
    });

    it('should mention reset in description', () => {
      const desc = RESET_CHAIN_TOOL.description;
      expect(desc).toBeDefined();
      expect(desc!.toLowerCase()).toContain('reset');
    });
  });

  describe('Tool Array Completeness', () => {
    it('should export all required tools', () => {
      const tools = [
        CHAIN_OF_THOUGHT_TOOL,
        CHAIN_SUMMARY_TOOL,
        LOAD_TEMPLATE_TOOL,
        RESET_CHAIN_TOOL
      ];

      const toolNames = tools.map(t => t.name);
      const expectedNames = ['chainofthought', 'chainsummary', 'loadtemplate', 'resetchain'];
      
      expect(toolNames.sort()).toEqual(expectedNames.sort());
    });

    it('should have unique tool names', () => {
      const tools = [
        CHAIN_OF_THOUGHT_TOOL,
        CHAIN_SUMMARY_TOOL,
        LOAD_TEMPLATE_TOOL,
        RESET_CHAIN_TOOL
      ];

      const names = tools.map(t => t.name);
      const uniqueNames = new Set(names);
      
      expect(names.length).toBe(uniqueNames.size);
    });
  });
});