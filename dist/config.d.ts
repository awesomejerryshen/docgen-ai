export interface DocgenConfig {
    output?: string;
    format?: 'markdown' | 'html' | 'both';
    template?: string;
    includePrivate?: boolean;
    excludePatterns?: string[];
    badges?: BadgeConfig;
    sections?: SectionConfig;
    ai?: AIConfig;
}
export interface BadgeConfig {
    npm?: boolean;
    github?: boolean;
    license?: boolean;
    coverage?: boolean;
    custom?: string[];
}
export interface SectionConfig {
    installation?: boolean;
    usage?: boolean;
    api?: boolean;
    contributing?: boolean;
    changelog?: boolean;
}
export interface AIConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export declare function loadConfig(projectPath?: string): Promise<DocgenConfig>;
export declare function mergeConfigWithDefaults(config: DocgenConfig): Required<DocgenConfig>;
export declare const DEFAULT_CONFIG: DocgenConfig;
//# sourceMappingURL=config.d.ts.map