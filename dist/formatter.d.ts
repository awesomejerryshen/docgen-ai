export type OutputFormat = 'markdown' | 'html' | 'both';
export declare function formatMarkdown(content: string): string;
export declare function markdownToHtml(markdown: string, title?: string): Promise<string>;
export declare function generateBadgeHtml(alt: string, src: string, href?: string): string;
//# sourceMappingURL=formatter.d.ts.map