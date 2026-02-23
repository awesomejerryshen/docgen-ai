import { parseCodebase, CodeStructure } from './parser';
import { generateReadme, generateApiDocs, generateSummary } from './ai-writer';
import { loadConfig, mergeConfigWithDefaults, DocgenConfig } from './config';
import { isGitHubUrl, cloneGitHubRepo, validatePath, GitHubInfo, parseGitHubUrl } from './github';
import { markdownToHtml, OutputFormat } from './formatter';
import * as fs from 'fs/promises';
import * as path from 'path';
import ora, { Ora } from 'ora';

export interface DocOptions {
  output: string;
  template: string;
  apiKey?: string;
  format?: OutputFormat;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface GenerationResult {
  readme: string;
  apiDocs: string;
  readmeHtml?: string;
  apiDocsHtml?: string;
  filesWritten: string[];
  codeStructure: CodeStructure;
  githubInfo?: GitHubInfo;
}

async function withSpinner<T>(spinner: Ora, text: string, fn: () => Promise<T>): Promise<T> {
  spinner.start(text);
  try {
    const result = await fn();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

export async function generateDocs(inputPath: string, options: DocOptions): Promise<GenerationResult> {
  const spinner = ora({ color: 'cyan' });
  let cleanup: (() => void) | null = null;
  let resolvedPath = inputPath;
  let githubInfo: GitHubInfo | undefined;

  const fileConfig = await loadConfig(inputPath);
  const mergedConfig = mergeConfigWithDefaults(fileConfig);
  
  const outputDir = options.output || mergedConfig.output;
  const format = options.format || mergedConfig.format as OutputFormat;
  const dryRun = options.dryRun || false;

  if (isGitHubUrl(inputPath)) {
    const info = parseGitHubUrl(inputPath);
    if (info) {
      githubInfo = info;
    }
    const cloneResult = await withSpinner(spinner, 'Cloning repository...', () => 
      cloneGitHubRepo(inputPath)
    );
    resolvedPath = cloneResult.path;
    cleanup = cloneResult.cleanup;
  } else {
    resolvedPath = await validatePath(inputPath);
  }

  let codeStructure: CodeStructure;
  try {
    codeStructure = await withSpinner(spinner, 'Parsing codebase...', () =>
      parseCodebase(resolvedPath, mergedConfig.excludePatterns)
    );

    if (codeStructure.files.length === 0) {
      throw new Error('No source files found. Check your input path or exclude patterns.');
    }

    spinner.info(`Found ${codeStructure.files.length} files, ${codeStructure.exports.length} exports`);

    const readme = await withSpinner(spinner, 'Generating README...', () =>
      generateReadme(codeStructure, options.apiKey, mergedConfig.badges, mergedConfig.sections, mergedConfig.ai)
    );

    const apiDocs = await withSpinner(spinner, 'Generating API documentation...', () =>
      generateApiDocs(codeStructure, options.apiKey, mergedConfig.ai)
    );

    const result: GenerationResult = {
      readme,
      apiDocs,
      filesWritten: [],
      codeStructure,
      githubInfo,
    };

    if (format === 'html' || format === 'both') {
      const projectName = codeStructure.packageInfo?.name || 'Documentation';
      result.readmeHtml = await withSpinner(spinner, 'Converting to HTML...', () =>
        markdownToHtml(readme, `${projectName} - Documentation`)
      );
      result.apiDocsHtml = await markdownToHtml(apiDocs, `${projectName} - API Reference`);
    }

    if (!dryRun) {
      await fs.mkdir(outputDir, { recursive: true });
      
      const readmePath = path.join(outputDir, format === 'html' ? 'README.html' : 'README.md');
      const apiDocsPath = path.join(outputDir, format === 'html' ? 'API.html' : 'API.md');
      
      await withSpinner(spinner, 'Writing documentation files...', async () => {
        if (format === 'markdown' || format === 'both') {
          await fs.writeFile(readmePath, readme);
          result.filesWritten.push(readmePath);
          await fs.writeFile(apiDocsPath, apiDocs);
          result.filesWritten.push(apiDocsPath);
        }
        
        if (format === 'html' || format === 'both') {
          const htmlReadmePath = path.join(outputDir, 'README.html');
          const htmlApiPath = path.join(outputDir, 'API.html');
          if (result.readmeHtml) {
            await fs.writeFile(htmlReadmePath, result.readmeHtml);
            result.filesWritten.push(htmlReadmePath);
          }
          if (result.apiDocsHtml) {
            await fs.writeFile(htmlApiPath, result.apiDocsHtml);
            result.filesWritten.push(htmlApiPath);
          }
        }
      });
    } else {
      spinner.info('Dry run mode - no files written');
    }

    return result;
  } finally {
    if (cleanup) {
      cleanup();
    }
  }
}

export async function previewDocs(inputPath: string, options: DocOptions): Promise<void> {
  const result = await generateDocs(inputPath, { ...options, dryRun: true });
  
  console.log('\n' + '='.repeat(60));
  console.log('README PREVIEW');
  console.log('='.repeat(60) + '\n');
  console.log(result.readme.slice(0, 2000) + (result.readme.length > 2000 ? '\n\n... (truncated)' : ''));
  
  console.log('\n' + '='.repeat(60));
  console.log('API DOCS PREVIEW');
  console.log('='.repeat(60) + '\n');
  console.log(result.apiDocs.slice(0, 1500) + (result.apiDocs.length > 1500 ? '\n\n... (truncated)' : ''));
}
