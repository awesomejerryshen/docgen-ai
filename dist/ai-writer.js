"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReadme = generateReadme;
exports.generateApiDocs = generateApiDocs;
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
async function generateReadme(structure, apiKey) {
    const client = getOpenAI(apiKey);
    const prompt = `Generate a comprehensive README.md for a codebase with the following structure:

Files: ${structure.files.length}
Dependencies: ${structure.dependencies.join(', ')}

Main exports:
${structure.exports.map(e => `- ${e.type}: ${e.name} (${e.file})`).join('\n')}

Generate a README with:
1. Project name and description
2. Installation instructions
3. Usage examples
4. API Reference (brief)
5. License (MIT)

Use markdown formatting. Be concise but helpful.`;
    const response = await client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
            {
                role: 'system',
                content: 'You are a technical writer who creates clear, helpful documentation for developers.',
            },
            { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
    });
    return response.choices[0].message.content || '# Documentation';
}
async function generateApiDocs(structure, apiKey) {
    const client = getOpenAI(apiKey);
    const functions = structure.files
        .flatMap(f => f.functions)
        .filter(f => f.isExported);
    const classes = structure.files
        .flatMap(f => f.classes)
        .filter(c => c.isExported);
    const prompt = `Generate API documentation for the following codebase:

Exported Functions:
${functions.map(f => `- ${f.name}(${f.params.join(', ')})`).join('\n')}

Exported Classes:
${classes.map(c => `- class ${c.name}`).join('\n')}

Generate detailed API documentation with:
1. Function signatures
2. Parameter descriptions
3. Return types
4. Usage examples

Use markdown formatting.`;
    const response = await client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
            {
                role: 'system',
                content: 'You are a technical writer specializing in API documentation.',
            },
            { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
    });
    return response.choices[0].message.content || '# API Documentation';
}
//# sourceMappingURL=ai-writer.js.map