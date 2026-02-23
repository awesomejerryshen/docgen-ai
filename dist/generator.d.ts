export interface DocOptions {
    output: string;
    template: string;
    apiKey?: string;
}
export declare function generateDocs(inputPath: string, options: DocOptions): Promise<{
    readme: string;
    apiDocs: string;
}>;
//# sourceMappingURL=generator.d.ts.map