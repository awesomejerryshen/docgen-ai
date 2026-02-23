#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const generator_1 = require("./generator");
const program = new commander_1.Command();
program
    .name('docgen')
    .description('AI-powered code documentation generator')
    .version('0.1.0');
program
    .command('generate')
    .description('Generate documentation for a codebase')
    .argument('<path>', 'Path to codebase (local directory or GitHub URL)')
    .option('-o, --output <dir>', 'Output directory for docs', './docs')
    .option('-t, --template <name>', 'Documentation template to use', 'default')
    .option('--api-key <key>', 'OpenAI API key (or set OPENAI_API_KEY env var)')
    .action(async (path, options) => {
    try {
        console.log(`🚀 Generating documentation for: ${path}`);
        await (0, generator_1.generateDocs)(path, options);
        console.log(`✅ Documentation generated in: ${options.output}`);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map