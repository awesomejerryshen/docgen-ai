#!/usr/bin/env node

import { Command } from 'commander';
import { generateDocs, previewDocs } from './generator';

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
  .option('-f, --format <type>', 'Output format: markdown|html|both', 'markdown')
  .option('-d, --dry-run', 'Preview generation without writing files', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('--api-key <key>', 'OpenAI API key (or set OPENAI_API_KEY env var)')
  .action(async (targetPath: string, options) => {
    try {
      console.log(`🚀 Generating documentation for: ${targetPath}`);
      const result = await generateDocs(targetPath, options);
      if (options.dryRun) {
        console.log('ℹ️ Dry run completed. No files written.');
      } else {
        console.log(`✅ Documentation generated in: ${options.output}`);
      }
      if (options.verbose) {
        console.log(`📦 Files: ${result.filesWritten.length}`);
        result.filesWritten.forEach((f) => console.log(` - ${f}`));
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('preview')
  .description('Generate and preview docs in terminal without writing files')
  .argument('<path>', 'Path to codebase')
  .option('--api-key <key>', 'OpenAI API key (or set OPENAI_API_KEY env var)')
  .action(async (targetPath: string, options) => {
    try {
      await previewDocs(targetPath, { output: './docs', template: 'default', dryRun: true, apiKey: options.apiKey });
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
