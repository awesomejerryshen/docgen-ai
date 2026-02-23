export interface CodeStructure {
    files: ParsedFile[];
    dependencies: DependencyInfo;
    exports: ExportInfo[];
    frameworks: FrameworkInfo[];
    packageInfo?: PackageInfo;
}
export interface ParsedFile {
    path: string;
    relativePath: string;
    functions: FunctionInfo[];
    classes: ClassInfo[];
    imports: ImportInfo[];
    interfaces: InterfaceInfo[];
    types: TypeInfo[];
}
export interface FunctionInfo {
    name: string;
    params: ParamInfo[];
    returnType?: string;
    description?: string;
    isExported: boolean;
    isAsync: boolean;
    isPrivate: boolean;
}
export interface ParamInfo {
    name: string;
    type?: string;
    isOptional: boolean;
    defaultValue?: string;
}
export interface ClassInfo {
    name: string;
    methods: FunctionInfo[];
    properties: PropertyInfo[];
    description?: string;
    isExported: boolean;
    extends?: string;
    implements?: string[];
}
export interface PropertyInfo {
    name: string;
    type?: string;
    isStatic: boolean;
    isPrivate: boolean;
}
export interface InterfaceInfo {
    name: string;
    properties: PropertyInfo[];
    isExported: boolean;
}
export interface TypeInfo {
    name: string;
    isExported: boolean;
}
export interface ImportInfo {
    source: string;
    specifiers: string[];
    isDefault: boolean;
}
export interface ExportInfo {
    name: string;
    type: 'function' | 'class' | 'constant' | 'interface' | 'type';
    file: string;
    description?: string;
}
export interface DependencyInfo {
    production: Record<string, string>;
    dev: Record<string, string>;
    peer: Record<string, string>;
}
export interface FrameworkInfo {
    name: string;
    version?: string;
    category: 'frontend' | 'backend' | 'testing' | 'build' | 'utility';
    confidence: number;
}
export interface PackageInfo {
    name: string;
    version: string;
    description?: string;
    license?: string;
    author?: string;
    repository?: string;
    homepage?: string;
    keywords?: string[];
    main?: string;
    bin?: Record<string, string>;
    scripts?: Record<string, string>;
    private?: boolean;
}
export declare function parseCodebase(rootPath: string, excludePatterns?: string[]): Promise<CodeStructure>;
//# sourceMappingURL=parser.d.ts.map