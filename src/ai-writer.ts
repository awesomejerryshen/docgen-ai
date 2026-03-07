import OpenAI from 'openai';
import {
  CodeStructure,
  DependencyInfo,
  FrameworkInfo,
  FunctionInfo,
  ClassInfo,
  InterfaceInfo,
} from './parser';
import { BadgeConfig, SectionConfig, AIConfig } from './config';

let openai: OpenAI | null = null;

function hasApiKey(apiKey?: string): boolean {
  return Boolean(apiKey || process.env.OPENAI_API_KEY);
}

function getOpenAI(apiKey?: string): OpenAI {
  if (!openai) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key required. Set OPENAI_API_KEY env var or use --api-key option.');
    }
    openai = new OpenAI({ apiKey: key });
  }
  return openai;
}

function formatDependencies(deps: DependencyInfo): string {
  const all = { ...deps.production, ...deps.dev };
  return Object.keys(all).join(', ') || 'None detected';
}

function formatFrameworks(frameworks: FrameworkInfo[]): string {
  if (frameworks.length === 0) return 'None detected';
  return frameworks.map((f) => `${f.name} (${f.category})`).join(', ');
}

function extractRepoPath(url: string): string {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1].replace(/\.git$/, '') : '';
}

function generateBadges(pkgName?: string, repo?: string, license?: string, badges?: BadgeConfig): string {
  const cfg = badges || { npm: true, github: true, license: true };
  const out: string[] = [];

  if (cfg.npm && pkgName) {
    out.push(`[![npm version](https://badge.fury.io/js/${pkgName}.svg)](https://badge.fury.io/js/${pkgName})`);
  }

  if (cfg.github && repo) {
    const repoPath = extractRepoPath(repo);
    if (repoPath) {
      out.push(`[![GitHub stars](https://img.shields.io/github/stars/${repoPath}?style=social)](https://github.com/${repoPath})`);
    }
  }

  if (cfg.license && license) {
    out.push(`[![License](https://img.shields.io/badge/license-${encodeURIComponent(license)}-blue.svg)](LICENSE)`);
  }

  return out.join('\n');
}

function fallbackReadme(structure: CodeStructure, badges?: BadgeConfig, sections?: SectionConfig): string {
  const name = structure.packageInfo?.name || 'Project';
  const desc = structure.packageInfo?.description || 'Auto-generated documentation.';
  const repo = structure.packageInfo?.repository;
  const license = structure.packageInfo?.license || 'MIT';

  const exportedFns = structure.files.flatMap((f) => f.functions).filter((f) => f.isExported).slice(0, 12);
  const exportedClasses = structure.files.flatMap((f) => f.classes).filter((c) => c.isExported).slice(0, 12);

  const lines: string[] = [];
  lines.push(`# ${name}`);
  const badgeBlock = generateBadges(name, repo, license, badges);
  if (badgeBlock) lines.push('', badgeBlock);

  lines.push('', desc, '');

  if (sections?.installation !== false) {
    lines.push('## Installation', '', '```bash', 'npm install', '```', '');
  }

  if (sections?.usage !== false) {
    lines.push('## Usage', '', '```bash', 'docgen generate .', '```', '');
  }

  lines.push('## Project Overview', '');
  lines.push(`- Files parsed: ${structure.files.length}`);
  lines.push(`- Exports found: ${structure.exports.length}`);
  lines.push(`- Frameworks: ${formatFrameworks(structure.frameworks)}`);
  lines.push(`- Dependencies: ${formatDependencies(structure.dependencies)}`);

  if (sections?.api !== false) {
    lines.push('', '## API Summary', '');

    if (exportedFns.length > 0) {
      lines.push('### Exported Functions');
      for (const fn of exportedFns) {
        const params = fn.params.map((p) => p.name).join(', ');
        lines.push(`- \`${fn.name}(${params})\``);
      }
      if (structure.exports.filter((e) => e.type === 'function').length > exportedFns.length) {
        lines.push(`- ...and more`);
      }
      lines.push('');
    }

    if (exportedClasses.length > 0) {
      lines.push('### Exported Classes');
      for (const cls of exportedClasses) {
        lines.push(`- \`${cls.name}\` (${cls.methods.length} methods)`);
      }
      if (structure.exports.filter((e) => e.type === 'class').length > exportedClasses.length) {
        lines.push(`- ...and more`);
      }
      lines.push('');
    }
  }

  if (sections?.contributing !== false) {
    lines.push('## Contributing', '', 'Pull requests are welcome. Please open an issue first for major changes.', '');
  }

  lines.push('## License', '', `${license}`);
  return lines.join('\n');
}

function fnSignature(fn: FunctionInfo): string {
  const params = fn.params
    .map((p) => `${p.name}${p.type ? `: ${p.type}` : ''}${p.isOptional ? '?' : ''}`)
    .join(', ');
  return `${fn.name}(${params})${fn.returnType ? `: ${fn.returnType}` : ''}`;
}

function classSummary(cls: ClassInfo): string {
  const ext = cls.extends ? ` extends ${cls.extends}` : '';
  return `class ${cls.name}${ext}`;
}

function fallbackApiDocs(structure: CodeStructure): string {
  const functions = structure.files.flatMap((f) => f.functions).filter((f) => f.isExported);
  const classes = structure.files.flatMap((f) => f.classes).filter((c) => c.isExported);
  const interfaces = structure.files.flatMap((f) => f.interfaces).filter((i) => i.isExported);

  const lines: string[] = ['# API Documentation', ''];

  lines.push('## Overview', '');
  lines.push(`- Total exported symbols: ${structure.exports.length}`);
  lines.push(`- Functions: ${functions.length}`);
  lines.push(`- Classes: ${classes.length}`);
  lines.push(`- Interfaces: ${interfaces.length}`, '');

  if (functions.length > 0) {
    lines.push('## Functions', '');
    for (const fn of functions) {
      lines.push(`### \`${fnSignature(fn)}\``);
      if (fn.description) lines.push('', fn.description);
      lines.push('', '**Parameters**');
      if (fn.params.length === 0) {
        lines.push('- None');
      } else {
        for (const p of fn.params) {
          lines.push(`- \`${p.name}\`${p.type ? ` (${p.type})` : ''}${p.isOptional ? ' optional' : ''}`);
        }
      }
      lines.push('', `**Returns:** ${fn.returnType || 'unknown'}`, '');
    }
  }

  if (classes.length > 0) {
    lines.push('## Classes', '');
    for (const cls of classes) {
      lines.push(`### \`${classSummary(cls)}\``, '');
      if (cls.properties.length > 0) {
        lines.push('**Properties**');
        for (const prop of cls.properties) {
          lines.push(`- \`${prop.name}\`${prop.type ? ` (${prop.type})` : ''}`);
        }
        lines.push('');
      }

      if (cls.methods.length > 0) {
        lines.push('**Methods**');
        for (const m of cls.methods) {
          lines.push(`- \`${fnSignature(m)}\``);
        }
        lines.push('');
      }
    }
  }

  if (interfaces.length > 0) {
    lines.push('## Interfaces', '');
    for (const i of interfaces) {
      lines.push(`### \`${i.name}\``, '');
      if (i.properties.length > 0) {
        for (const p of i.properties) {
          lines.push(`- \`${p.name}\`${p.type ? ` (${p.type})` : ''}`);
        }
      } else {
        lines.push('- No properties detected');
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

export async function generateReadme(
  structure: CodeStructure,
  apiKey?: string,
  badges?: BadgeConfig,
  sections?: SectionConfig,
  aiConfig?: AIConfig
): Promise<string> {
  if (!hasApiKey(apiKey)) {
    return fallbackReadme(structure, badges, sections);
  }

  const client = getOpenAI(apiKey);

  const prompt = `Generate a concise professional README for this project:\n\n- Name: ${structure.packageInfo?.name || 'Unknown'}\n- Description: ${structure.packageInfo?.description || 'N/A'}\n- Frameworks: ${formatFrameworks(structure.frameworks)}\n- Files: ${structure.files.length}\n- Exports: ${structure.exports.length}\n- Dependencies: ${formatDependencies(structure.dependencies)}\n\nInclude sections: Installation, Usage, API summary, Contributing, License.`;

  const response = await client.chat.completions.create({
    model: aiConfig?.model || 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'You are a technical writer for developer documentation.' },
      { role: 'user', content: prompt },
    ],
    temperature: aiConfig?.temperature ?? 0.7,
    max_tokens: aiConfig?.maxTokens || 2200,
  });

  return response.choices[0].message.content || fallbackReadme(structure, badges, sections);
}

export async function generateApiDocs(
  structure: CodeStructure,
  apiKey?: string,
  aiConfig?: AIConfig
): Promise<string> {
  if (!hasApiKey(apiKey)) {
    return fallbackApiDocs(structure);
  }

  const client = getOpenAI(apiKey);

  const response = await client.chat.completions.create({
    model: aiConfig?.model || 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'You write clear API docs with signatures, parameters, returns, and examples.' },
      {
        role: 'user',
        content: `Generate API docs for project ${structure.packageInfo?.name || 'Unknown'} with ${structure.exports.length} exports.`,
      },
    ],
    temperature: aiConfig?.temperature ?? 0.6,
    max_tokens: aiConfig?.maxTokens || 3500,
  });

  return response.choices[0].message.content || fallbackApiDocs(structure);
}

export async function generateSummary(structure: CodeStructure): Promise<string> {
  return `${structure.packageInfo?.name || 'Project'} has ${structure.files.length} source files and ${structure.exports.length} exports.`;
}
