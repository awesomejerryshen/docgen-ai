import { parseCodebase } from './parser';
import { generateReadme, generateApiDocs } from './ai-writer';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DocOptions {
  output: string;
  template: string;
  apiKey?: string;
}

export async function generateDocs(inputPath: string, options: DocOptions) {
  // Step 1: Parse codebase
  console.log('📖 Parsing codebase...');
  const codeStructure = await parseCodebase(inputPath);
  
  // Step 2: Generate documentation using AI
  console.log('🤖 Generating documentation...');
  const readme = await generateReadme(codeStructure, options.apiKey);
  const apiDocs = await generateApiDocs(codeStructure, options.apiKey);
  
  // Step 3: Write output files
  console.log('📝 Writing documentation files...');
  await fs.mkdir(options.output, { recursive: true });
  
  await fs.writeFile(
    path.join(options.output, 'README.md'),
    readme
  );
  
  await fs.writeFile(
    path.join(options.output, 'API.md'),
    apiDocs
  );
  
  return {
    readme: path.join(options.output, 'README.md'),
    apiDocs: path.join(options.output, 'API.md'),
  };
}
