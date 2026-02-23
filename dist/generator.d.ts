import { CodeStructure } from './parser';
import { GitHubInfo } from './github';
import { OutputFormat } from './formatter';
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
export declare function generateDocs(inputPath: string, options: DocOptions): Promise<GenerationResult>;
export declare function previewDocs(inputPath: string, options: DocOptions): Promise<void>;
//# sourceMappingURL=generator.d.ts.map