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

    it('should have comprehensive description mentioning auto-CoT', () => {
      const desc = CHAIN_OF_THOUGHT_TOOL.description || '';
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('auto');
      expect(desc.toLowerCase()).toContain('mode');
    });

    it('should have proper input schema', () => {
      const schema = CHAIN_OF_THOUGHT_TOOL.inputSchema;

      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toBeDefined();

      const required = schema.required || [];
      expect(required).toContain('thought');
      expect(required).toContain('nextThoughtNeeded');
      expect(required).toContain('thoughtNumber');
      expect(required).toContain('totalThoughts');
    });

    it('should have mode and problem type enums', () => {
      const props = schema_props(CHAIN_OF_THOUGHT_TOOL);

      expect(props.mode.enum).toEqual(['draft', 'concise', 'standard', 'analysis', 'auto']);
      expect(props.problemType.enum).toEqual([
        'arithmetic', 'logical', 'creative', 'planning', 'analysis', 'general'
      ]);
    });

    it('should have autoMode parameter', () => {
      const props = schema_props(CHAIN_OF_THOUGHT_TOOL);

      expect(props.autoMode).toBeDefined();
      expect(props.autoMode.type).toBe('boolean');
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
      const desc = CHAIN_SUMMARY_TOOL.description || '';
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('summary');
      expect(desc.toLowerCase()).toContain('metrics');
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
      const props = schema_props(LOAD_TEMPLATE_TOOL);
      expect(props.templateName.type).toBe('string');
    });

    it('should mention templates in description', () => {
      const desc = LOAD_TEMPLATE_TOOL.description || '';
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('template');
      expect(desc.toLowerCase()).toContain('research');
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
      const desc = RESET_CHAIN_TOOL.description || '';
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('reset');
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

// Helper to access schema properties without TS assertions
function schema_props(tool: { inputSchema: { properties?: Record<string, unknown> } }): Record<string, any> {
  return (tool.inputSchema.properties || {}) as Record<string, any>;
}
