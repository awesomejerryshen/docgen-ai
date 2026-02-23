"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocs = generateDocs;
exports.previewDocs = previewDocs;
const parser_1 = require("./parser");
const ai_writer_1 = require("./ai-writer");
const config_1 = require("./config");
const github_1 = require("./github");
const formatter_1 = require("./formatter");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const ora_1 = __importDefault(require("ora"));
async function withSpinner(spinner, text, fn) {
    spinner.start(text);
    try {
        const result = await fn();
        spinner.succeed();
        return result;
    }
    catch (error) {
        spinner.fail();
        throw error;
    }
}
async function generateDocs(inputPath, options) {
    const spinner = (0, ora_1.default)({ color: 'cyan' });
    let cleanup = null;
    let resolvedPath = inputPath;
    let githubInfo;
    const fileConfig = await (0, config_1.loadConfig)(inputPath);
    const mergedConfig = (0, config_1.mergeConfigWithDefaults)(fileConfig);
    const outputDir = options.output || mergedConfig.output;
    const format = options.format || mergedConfig.format;
    const dryRun = options.dryRun || false;
    if ((0, github_1.isGitHubUrl)(inputPath)) {
        const info = (0, github_1.parseGitHubUrl)(inputPath);
        if (info) {
            githubInfo = info;
        }
        const cloneResult = await withSpinner(spinner, 'Cloning repository...', () => (0, github_1.cloneGitHubRepo)(inputPath));
        resolvedPath = cloneResult.path;
        cleanup = cloneResult.cleanup;
    }
    else {
        resolvedPath = await (0, github_1.validatePath)(inputPath);
    }
    let codeStructure;
    try {
        codeStructure = await withSpinner(spinner, 'Parsing codebase...', () => (0, parser_1.parseCodebase)(resolvedPath, mergedConfig.excludePatterns));
        if (codeStructure.files.length === 0) {
            throw new Error('No source files found. Check your input path or exclude patterns.');
        }
        spinner.info(`Found ${codeStructure.files.length} files, ${codeStructure.exports.length} exports`);
        const readme = await withSpinner(spinner, 'Generating README...', () => (0, ai_writer_1.generateReadme)(codeStructure, options.apiKey, mergedConfig.badges, mergedConfig.sections, mergedConfig.ai));
        const apiDocs = await withSpinner(spinner, 'Generating API documentation...', () => (0, ai_writer_1.generateApiDocs)(codeStructure, options.apiKey, mergedConfig.ai));
        const result = {
            readme,
            apiDocs,
            filesWritten: [],
            codeStructure,
            githubInfo,
        };
        if (format === 'html' || format === 'both') {
            const projectName = codeStructure.packageInfo?.name || 'Documentation';
            result.readmeHtml = await withSpinner(spinner, 'Converting to HTML...', () => (0, formatter_1.markdownToHtml)(readme, `${projectName} - Documentation`));
            result.apiDocsHtml = await (0, formatter_1.markdownToHtml)(apiDocs, `${projectName} - API Reference`);
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
        }
        else {
            spinner.info('Dry run mode - no files written');
        }
        return result;
    }
    finally {
        if (cleanup) {
            cleanup();
        }
    }
}
async function previewDocs(inputPath, options) {
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
//# sourceMappingURL=generator.js.map