"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReadme = generateReadme;
exports.generateApiDocs = generateApiDocs;
exports.generateSummary = generateSummary;
const openai_1 = __importDefault(require("openai"));
let openai = null;
function getOpenAI(apiKey) {
    if (!openai) {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key) {
            throw new Error('OpenAI API key required. Set OPENAI_API_KEY env var or use --api-key option.');
        }
        openai = new openai_1.default({ apiKey: key });
    }
    return openai;
}
function formatDependencies(deps) {
    const all = { ...deps.production, ...deps.dev };
    return Object.keys(all).join(', ') || 'None detected';
}
function formatFrameworks(frameworks) {
    if (frameworks.length === 0)
        return 'None detected';
    return frameworks.map(f => `${f.name} (${f.category})`).join(', ');
}
function generateBadges(pkg, badges) {
    const badgeLines = [];
    if (!pkg)
        return '';
    if (badges.npm && pkg.name) {
        badgeLines.push(`[![npm version](https://badge.fury.io/js/${pkg.name}.svg)](https://badge.fury.io/js/${pkg.name})`);
    }
    if (badges.github && pkg.repository) {
        const repoUrl = pkg.repository.replace(/^git\+/, '').replace(/\.git$/, '');
        badgeLines.push(`[![GitHub stars](https://img.shields.io/github/stars/${extractRepoPath(repoUrl)}?style=social)](${repoUrl})`);
        badgeLines.push(`[![GitHub issues](https://img.shields.io/github/issues/${extractRepoPath(repoUrl)})](${repoUrl}/issues)`);
    }
    if (badges.license && pkg.license) {
        badgeLines.push(`[![License](https://img.shields.io/badge/license-${encodeURIComponent(pkg.license)}-blue.svg)](LICENSE)`);
    }
    if (badges.custom) {
        badgeLines.push(...badges.custom);
    }
    return badgeLines.join('\n');
}
function extractRepoPath(url) {
    const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
    return match ? match[1] : '';
}
function generateInstallationSection(pkg, deps) {
    if (!pkg)
        return '```bash\nnpm install\n```';
    const lines = [];
    lines.push('## Installation\n');
    if (pkg.name && !pkg.private) {
        lines.push('```bash');
        lines.push(`npm install ${pkg.name}`);
        lines.push('# or');
        lines.push(`yarn add ${pkg.name}`);
        lines.push('# or');
        lines.push(`pnpm add ${pkg.name}`);
        lines.push('```');
    }
    else {
        lines.push('```bash');
        lines.push('git clone <repository-url>');
        lines.push('cd <project-directory>');
        lines.push('npm install');
        lines.push('```');
    }
    const prodDeps = Object.keys(deps.production);
    if (prodDeps.length > 0) {
        lines.push('\n### Peer Dependencies');
        lines.push('```bash');
        prodDeps.slice(0, 5).forEach(dep => {
            lines.push(`npm install ${dep}`);
        });
        if (prodDeps.length > 5) {
            lines.push(`# ... and ${prodDeps.length - 5} more`);
        }
        lines.push('```');
    }
    return lines.join('\n');
}
async function generateReadme(structure, apiKey, badges, sections, aiConfig) {
    const client = getOpenAI(apiKey);
    const badgeSection = generateBadges(structure.packageInfo, badges || { npm: true, github: true, license: true });
    const installationTemplate = generateInstallationSection(structure.packageInfo, structure.dependencies);
    const prompt = `Generate a comprehensive README.md for a codebase with the following structure:

Project Info:
- Name: ${structure.packageInfo?.name || 'Unknown'}
- Description: ${structure.packageInfo?.description || 'Not provided'}
- Version: ${structure.packageInfo?.version || '0.0.0'}
- License: ${structure.packageInfo?.license || 'MIT'}

Code Analysis:
- Files: ${structure.files.length}
- Functions: ${structure.files.reduce((acc, f) => acc + f.functions.length, 0)}
- Classes: ${structure.files.reduce((acc, f) => acc + f.classes.length, 0)}
- Dependencies: ${formatDependencies(structure.dependencies)}
- Frameworks Detected: ${formatFrameworks(structure.frameworks)}

Main exports:
${structure.exports.slice(0, 20).map(e => `- ${e.type}: ${e.name} (${e.file})`).join('\n')}

Generate a README with these sections:
1. Project title with badges (use these badges at top: ${badgeSection})
2. Brief description
3. ${sections?.installation !== false ? 'Installation (use this template, enhance if needed):\n' + installationTemplate : ''}
4. ${sections?.usage !== false ? 'Usage examples with code snippets' : ''}
5. ${sections?.api !== false ? 'API Reference (brief summary)' : ''}
6. ${sections?.contributing !== false ? 'Contributing guide' : ''}
7. License (${structure.packageInfo?.license || 'MIT'})

Use markdown formatting. Include code examples. Be concise but helpful. Make it professional.`;
    const response = await client.chat.completions.create({
        model: aiConfig?.model || 'gpt-4-turbo-preview',
        messages: [
            {
                role: 'system',
                content: 'You are a technical writer who creates clear, helpful documentation for developers. You write professional, polished documentation.',
            },
            { role: 'user', content: prompt },
        ],
        temperature: aiConfig?.temperature ?? 0.7,
        max_tokens: aiConfig?.maxTokens || 2500,
    });
    return response.choices[0].message.content || '# Documentation';
}
async function generateApiDocs(structure, apiKey, aiConfig) {
    const client = getOpenAI(apiKey);
    const functions = structure.files
        .flatMap(f => f.functions)
        .filter(f => f.isExported);
    const classes = structure.files
        .flatMap(f => f.classes)
        .filter(c => c.isExported);
    const interfaces = structure.files
        .flatMap(f => f.interfaces)
        .filter(i => i.isExported);
    const prompt = `Generate API documentation for the following codebase:

Project: ${structure.packageInfo?.name || 'Unknown'}

Exported Functions (${functions.length}):
${functions.map(f => {
        const params = f.params.map(p => `${p.name}${p.type ? `: ${p.type}` : ''}`).join(', ');
        return `- ${f.name}(${params})${f.returnType ? `: ${f.returnType}` : ''}${f.isAsync ? ' [async]' : ''}`;
    }).join('\n')}

Exported Classes (${classes.length}):
${classes.map(c => {
        const methods = c.methods.map(m => m.name).join(', ');
        return `- class ${c.name}${c.extends ? ` extends ${c.extends}` : ''}\n  Methods: ${methods || 'none'}`;
    }).join('\n')}

Exported Interfaces (${interfaces.length}):
${interfaces.map(i => {
        const props = i.properties.map(p => p.name).join(', ');
        return `- interface ${i.name}\n  Properties: ${props || 'none'}`;
    }).join('\n')}

Generate detailed API documentation with:
1. Overview
2. Functions section with:
   - Function signatures
   - Parameter descriptions with types
   - Return types
   - Usage examples
3. Classes section with:
   - Class descriptions
   - Constructor info if available
   - Method signatures with params and returns
   - Property list
4. Interfaces/Types section (if any)

Use markdown formatting with code blocks for examples. Be thorough but clear.`;
    const response = await client.chat.completions.create({
        model: aiConfig?.model || 'gpt-4-turbo-preview',
        messages: [
            {
                role: 'system',
                content: 'You are a technical writer specializing in API documentation. You create clear, comprehensive documentation for developers.',
            },
            { role: 'user', content: prompt },
        ],
        temperature: aiConfig?.temperature ?? 0.7,
        max_tokens: aiConfig?.maxTokens || 4000,
    });
    return response.choices[0].message.content || '# API Documentation';
}
async function generateSummary(structure, apiKey) {
    const client = getOpenAI(apiKey);
    const prompt = `Generate a brief summary of this codebase:

Project: ${structure.packageInfo?.name || 'Unknown'}
Description: ${structure.packageInfo?.description || 'Not provided'}
Frameworks: ${formatFrameworks(structure.frameworks)}
Files: ${structure.files.length}
Functions: ${structure.files.reduce((acc, f) => acc + f.functions.length, 0)}
Classes: ${structure.files.reduce((acc, f) => acc + f.classes.length, 0)}

Write 2-3 sentences describing what this project does and its main purpose.`;
    const response = await client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
            { role: 'system', content: 'You are a helpful assistant that summarizes codebases.' },
            { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 200,
    });
    return response.choices[0].message.content || '';
}
//# sourceMappingURL=ai-writer.js.map