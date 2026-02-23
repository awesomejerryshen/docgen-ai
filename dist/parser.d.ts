export interface CodeStructure {
    files: ParsedFile[];
    dependencies: string[];
    exports: ExportInfo[];
}
export interface ParsedFile {
    path: string;
    functions: FunctionInfo[];
    classes: ClassInfo[];
    imports: string[];
}
export interface FunctionInfo {
    name: string;
    params: string[];
    returnType?: string;
    description?: string;
    isExported: boolean;
}
export interface ClassInfo {
    name: string;
    methods: FunctionInfo[];
    properties: string[];
    description?: string;
    isExported: boolean;
}
export interface ExportInfo {
    name: string;
    type: 'function' | 'class' | 'constant' | 'interface';
    file: string;
}
export declare function parseCodebase(rootPath: string): Promise<CodeStructure>;
//# sourceMappingURL=parser.d.ts.map