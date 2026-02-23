#!/usr/bin/env node

import { Command } from 'commander';
import { generateDocs } from './generator';

const program = new Command();

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
  .action(async (path: string, options) => {
    try {
      console.log(`🚀 Generating documentation for: ${path}`);
      await generateDocs(path, options);
      console.log(`✅ Documentation generated in: ${options.output}`);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program.parse();
