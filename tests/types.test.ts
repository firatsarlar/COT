import { MODE_CONFIGS, PROBLEM_TYPE_DEFAULTS, CHAIN_TEMPLATES } from '../src/types.js';

describe('Types and Constants', () => {
  describe('MODE_CONFIGS', () => {
    it('should have all required modes', () => {
      const requiredModes = ['draft', 'concise', 'standard', 'auto'] as const;
      
      requiredModes.forEach(mode => {
        expect(MODE_CONFIGS[mode]).toBeDefined();
      });
    });

    it('should have proper word limits', () => {
      expect(MODE_CONFIGS.draft.maxWords).toBe(5);
      expect(MODE_CONFIGS.concise.maxWords).toBe(15);
      expect(MODE_CONFIGS.standard.maxWords).toBe(Infinity);
      expect(MODE_CONFIGS.auto.maxWords).toBe(Infinity);
    });

    it('should have token multipliers', () => {
      Object.values(MODE_CONFIGS).forEach(config => {
        expect(config.tokenMultiplier).toBeGreaterThan(0);
        expect(config.tokenMultiplier).toBeLessThanOrEqual(1);
      });
    });

    it('should have descriptions and colors', () => {
      Object.values(MODE_CONFIGS).forEach(config => {
        expect(config.description).toBeDefined();
        expect(typeof config.description).toBe('string');
        expect(config.color).toBeDefined();
      });
    });
  });

  describe('PROBLEM_TYPE_DEFAULTS', () => {
    it('should have defaults for all problem types', () => {
      const requiredTypes = ['arithmetic', 'logical', 'creative', 'planning', 'analysis', 'general'] as const;
      
      requiredTypes.forEach(type => {
        expect(PROBLEM_TYPE_DEFAULTS[type]).toBeDefined();
      });
    });

    it('should map to valid modes', () => {
      const validModes = ['draft', 'concise', 'standard', 'auto'];
      
      Object.values(PROBLEM_TYPE_DEFAULTS).forEach(mode => {
        expect(validModes).toContain(mode);
      });
    });

    it('should have logical defaults', () => {
      // Math and logic should prefer concise modes
      expect(PROBLEM_TYPE_DEFAULTS.arithmetic).toBe('draft');
      expect(PROBLEM_TYPE_DEFAULTS.logical).toBe('draft');
      
      // Creative should prefer detailed reasoning
      expect(PROBLEM_TYPE_DEFAULTS.creative).toBe('standard');
      
      // Planning and analysis should be balanced
      expect(PROBLEM_TYPE_DEFAULTS.planning).toBe('concise');
      expect(PROBLEM_TYPE_DEFAULTS.analysis).toBe('concise');
      
      // General should be adaptive
      expect(PROBLEM_TYPE_DEFAULTS.general).toBe('auto');
    });
  });

  describe('CHAIN_TEMPLATES', () => {
    it('should have templates for different problem types', () => {
      const templatesByType = CHAIN_TEMPLATES.reduce((acc, template) => {
        acc[template.problemType] = (acc[template.problemType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Should have templates for major problem types
      expect(templatesByType.arithmetic).toBeGreaterThan(0);
      expect(templatesByType.logical).toBeGreaterThan(0);
      expect(templatesByType.creative).toBeGreaterThan(0);
      expect(templatesByType.analysis).toBeGreaterThan(0);
      expect(templatesByType.planning).toBeGreaterThan(0);
    });

    it('should have well-formed templates', () => {
      CHAIN_TEMPLATES.forEach(template => {
        expect(template.name).toBeDefined();
        expect(typeof template.name).toBe('string');
        expect(template.name.length).toBeGreaterThan(0);
        
        expect(template.problemType).toBeDefined();
        expect(typeof template.problemType).toBe('string');
        
        expect(template.mode).toBeDefined();
        expect(['draft', 'concise', 'standard', 'auto']).toContain(template.mode);
        
        expect(template.description).toBeDefined();
        expect(typeof template.description).toBe('string');
        
        expect(Array.isArray(template.exampleThoughts)).toBe(true);
        expect(template.exampleThoughts.length).toBeGreaterThan(0);
      });
    });

    it('should have unique template names', () => {
      const names = CHAIN_TEMPLATES.map(t => t.name);
      const uniqueNames = new Set(names);
      
      expect(names.length).toBe(uniqueNames.size);
    });

    it('should have branching examples in tree templates', () => {
      const treeTemplates = CHAIN_TEMPLATES.filter(t => 
        t.name.toLowerCase().includes('tree') || 
        t.description.toLowerCase().includes('branching')
      );

      expect(treeTemplates.length).toBeGreaterThan(0);
      
      treeTemplates.forEach(template => {
        const hasBranchKeywords = template.exampleThoughts.some(thought =>
          thought.toLowerCase().includes('branch') ||
          thought.toLowerCase().includes('option') ||
          thought.toLowerCase().includes('alternative')
        );
        
        expect(hasBranchKeywords).toBe(true);
      });
    });

    it('should have appropriate modes for problem types', () => {
      CHAIN_TEMPLATES.forEach(template => {
        const expectedMode = PROBLEM_TYPE_DEFAULTS[template.problemType];
        
        // Template mode should either match default or be a reasonable alternative
        if (template.mode !== expectedMode) {
          // Creative, analysis, logical and general can reasonably use different modes
          const flexibleTypes = ['creative', 'analysis', 'general', 'logical'];
          expect(flexibleTypes).toContain(template.problemType);
        }
      });
    });
  });
});