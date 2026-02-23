import { CodeStructure } from './parser';
import { BadgeConfig, SectionConfig, AIConfig } from './config';
export declare function generateReadme(structure: CodeStructure, apiKey?: string, badges?: BadgeConfig, sections?: SectionConfig, aiConfig?: AIConfig): Promise<string>;
export declare function generateApiDocs(structure: CodeStructure, apiKey?: string, aiConfig?: AIConfig): Promise<string>;
export declare function generateSummary(structure: CodeStructure, apiKey?: string): Promise<string>;
//# sourceMappingURL=ai-writer.d.ts.map