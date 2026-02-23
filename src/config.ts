import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface DocgenConfig {
  output?: string;
  format?: 'markdown' | 'html' | 'both';
  template?: string;
  includePrivate?: boolean;
  excludePatterns?: string[];
  badges?: BadgeConfig;
  sections?: SectionConfig;
  ai?: AIConfig;
}

export interface BadgeConfig {
  npm?: boolean;
  github?: boolean;
  license?: boolean;
  coverage?: boolean;
  custom?: string[];
}

export interface SectionConfig {
  installation?: boolean;
  usage?: boolean;
  api?: boolean;
  contributing?: boolean;
  changelog?: boolean;
}

export interface AIConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const CONFIG_FILES = ['.docgenrc', '.docgenrc.json', 'docgen.config.json'];

export async function loadConfig(projectPath?: string): Promise<DocgenConfig> {
  const config: DocgenConfig = {};
  
  if (projectPath) {
    for (const configFile of CONFIG_FILES) {
      const configPath = path.join(projectPath, configFile);
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const parsed = JSON.parse(content);
        Object.assign(config, parsed);
        break;
      } catch {
        continue;
      }
    }
  }
  
  const globalConfigPath = path.join(os.homedir(), '.docgenrc');
  try {
    const content = await fs.readFile(globalConfigPath, 'utf-8');
    const parsed = JSON.parse(content);
    Object.assign(config, parsed);
  } catch {
    // No global config, that's fine
  }
  
  return config;
}

export function mergeConfigWithDefaults(config: DocgenConfig): Required<DocgenConfig> {
  return {
    output: config.output || './docs',
    format: config.format || 'markdown',
    template: config.template || 'default',
    includePrivate: config.includePrivate || false,
    excludePatterns: config.excludePatterns || ['node_modules/**', 'dist/**', 'build/**', '**/*.test.ts', '**/*.spec.ts'],
    badges: {
      npm: config.badges?.npm ?? true,
      github: config.badges?.github ?? true,
      license: config.badges?.license ?? true,
      coverage: config.badges?.coverage ?? false,
      custom: config.badges?.custom || [],
    },
    sections: {
      installation: config.sections?.installation ?? true,
      usage: config.sections?.usage ?? true,
      api: config.sections?.api ?? true,
      contributing: config.sections?.contributing ?? true,
      changelog: config.sections?.changelog ?? false,
    },
    ai: {
      model: config.ai?.model || 'gpt-4-turbo-preview',
      temperature: config.ai?.temperature ?? 0.7,
      maxTokens: config.ai?.maxTokens || 2000,
    },
  };
}

export const DEFAULT_CONFIG: DocgenConfig = {
  output: './docs',
  format: 'markdown',
  template: 'default',
  includePrivate: false,
  excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
  badges: {
    npm: true,
    github: true,
    license: true,
    coverage: false,
    custom: [],
  },
  sections: {
    installation: true,
    usage: true,
    api: true,
    contributing: true,
    changelog: false,
  },
  ai: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
  },
};
