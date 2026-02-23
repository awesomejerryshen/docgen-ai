import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

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

const FRAMEWORK_SIGNATURES: Record<string, { deps: string[]; category: FrameworkInfo['category'] }> = {
  react: { deps: ['react', 'react-dom'], category: 'frontend' },
  vue: { deps: ['vue'], category: 'frontend' },
  angular: { deps: ['@angular/core'], category: 'frontend' },
  svelte: { deps: ['svelte'], category: 'frontend' },
  next: { deps: ['next'], category: 'frontend' },
  nuxt: { deps: ['nuxt'], category: 'frontend' },
  express: { deps: ['express'], category: 'backend' },
  fastify: { deps: ['fastify'], category: 'backend' },
  koa: { deps: ['koa'], category: 'backend' },
  nestjs: { deps: ['@nestjs/core'], category: 'backend' },
  hapi: { deps: ['@hapi/hapi'], category: 'backend' },
  jest: { deps: ['jest'], category: 'testing' },
  vitest: { deps: ['vitest'], category: 'testing' },
  mocha: { deps: ['mocha'], category: 'testing' },
  webpack: { deps: ['webpack'], category: 'build' },
  vite: { deps: ['vite'], category: 'build' },
  rollup: { deps: ['rollup'], category: 'build' },
  esbuild: { deps: ['esbuild'], category: 'build' },
  typescript: { deps: ['typescript'], category: 'utility' },
  lodash: { deps: ['lodash'], category: 'utility' },
  axios: { deps: ['axios'], category: 'utility' },
  prisma: { deps: ['prisma', '@prisma/client'], category: 'backend' },
  graphql: { deps: ['graphql'], category: 'backend' },
  trpc: { deps: ['@trpc/server'], category: 'backend' },
  tailwindcss: { deps: ['tailwindcss'], category: 'frontend' },
  electron: { deps: ['electron'], category: 'frontend' },
};

export async function parseCodebase(rootPath: string, excludePatterns: string[] = []): Promise<CodeStructure> {
  const defaultExcludes = ['node_modules/**', 'dist/**', 'build/**', '**/*.test.ts', '**/*.spec.ts', '**/*.test.js', '**/*.spec.js'];
  const ignores = [...defaultExcludes, ...excludePatterns];
  
  const files = await glob('**/*.{js,jsx,ts,tsx}', {
    cwd: rootPath,
    ignore: ignores,
  });

  const parsedFiles: ParsedFile[] = [];
  const allExports: ExportInfo[] = [];
  const packageInfo = await parsePackageJson(rootPath);
  const dependencies = await analyzeDependencies(rootPath);
  const frameworks = detectFrameworks(dependencies);

  for (const file of files) {
    const filePath = path.join(rootPath, file);
    const parsed = await parseFile(filePath, file);
    
    if (parsed) {
      parsedFiles.push(parsed);
      
      parsed.functions
        .filter(f => f.isExported)
        .forEach(f => allExports.push({
          name: f.name,
          type: 'function',
          file: file,
          description: f.description,
        }));
      
      parsed.classes
        .filter(c => c.isExported)
        .forEach(c => allExports.push({
          name: c.name,
          type: 'class',
          file: file,
          description: c.description,
        }));

      parsed.interfaces
        .filter(i => i.isExported)
        .forEach(i => allExports.push({
          name: i.name,
          type: 'interface',
          file: file,
        }));
    }
  }

  return {
    files: parsedFiles,
    dependencies,
    exports: allExports,
    frameworks,
    packageInfo,
  };
}

async function parsePackageJson(rootPath: string): Promise<PackageInfo | undefined> {
  try {
    const packageJsonPath = path.join(rootPath, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      license: pkg.license,
      author: typeof pkg.author === 'string' ? pkg.author : pkg.author?.name,
      repository: typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url,
      homepage: pkg.homepage,
      keywords: pkg.keywords,
      main: pkg.main,
      bin: pkg.bin,
      scripts: pkg.scripts,
      private: pkg.private,
    };
  } catch {
    return undefined;
  }
}

async function analyzeDependencies(rootPath: string): Promise<DependencyInfo> {
  const dependencies: DependencyInfo = {
    production: {},
    dev: {},
    peer: {},
  };

  try {
    const packageJsonPath = path.join(rootPath, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    
    dependencies.production = pkg.dependencies || {};
    dependencies.dev = pkg.devDependencies || {};
    dependencies.peer = pkg.peerDependencies || {};
  } catch {
    // No package.json
  }

  return dependencies;
}

function detectFrameworks(dependencies: DependencyInfo): FrameworkInfo[] {
  const allDeps = { ...dependencies.production, ...dependencies.dev };
  const frameworks: FrameworkInfo[] = [];

  for (const [frameworkName, signature] of Object.entries(FRAMEWORK_SIGNATURES)) {
    const matchedDeps = signature.deps.filter(dep => allDeps[dep]);
    if (matchedDeps.length > 0) {
      frameworks.push({
        name: frameworkName,
        version: allDeps[matchedDeps[0]]?.replace(/[^0-9.]/g, ''),
        category: signature.category,
        confidence: matchedDeps.length / signature.deps.length,
      });
    }
  }

  return frameworks.sort((a, b) => b.confidence - a.confidence);
}

async function parseFile(filePath: string, relativePath: string): Promise<ParsedFile | null> {
  try {
    const code = await fs.readFile(filePath, 'utf-8');
    
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'optionalChaining',
        'nullishCoalescingOperator',
        'exportDefaultFrom',
        'dynamicImport',
      ],
    });

    const functions: FunctionInfo[] = [];
    const classes: ClassInfo[] = [];
    const imports: ImportInfo[] = [];
    const interfaces: InterfaceInfo[] = [];
    const types: TypeInfo[] = [];
    const exportedNames = new Set<string>();

    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
            exportedNames.add(path.node.declaration.id.name);
          }
          if (path.node.declaration.type === 'ClassDeclaration' && path.node.declaration.id) {
            exportedNames.add(path.node.declaration.id.name);
          }
          if (path.node.declaration.type === 'VariableDeclaration') {
            path.node.declaration.declarations.forEach(dec => {
              if (dec.id.type === 'Identifier') {
                exportedNames.add(dec.id.name);
              }
            });
          }
        }
      },
      
      FunctionDeclaration(path) {
        if (path.node.id) {
          const name = path.node.id.name;
          functions.push({
            name,
            params: path.node.params.map(p => extractParamInfo(p)),
            returnType: path.node.returnType ? extractTypeAnnotation(path.node.returnType) : undefined,
            isExported: exportedNames.has(name),
            isAsync: path.node.async,
            isPrivate: name.startsWith('_') || name.startsWith('#'),
          });
        }
      },
      
      ClassDeclaration(path) {
        if (path.node.id) {
          const name = path.node.id.name;
          const methods: FunctionInfo[] = [];
          const properties: PropertyInfo[] = [];
          
          path.node.body.body.forEach(member => {
            if (member.type === 'ClassMethod' && member.kind !== 'constructor') {
              if (member.key.type === 'Identifier') {
                methods.push({
                  name: member.key.name,
                  params: member.params.map(p => extractParamInfo(p)),
                  returnType: member.returnType ? extractTypeAnnotation(member.returnType) : undefined,
                  isExported: true,
                  isAsync: member.async,
                  isPrivate: member.key.name.startsWith('_') || member.key.name.startsWith('#') || member.accessibility === 'private',
                });
              }
            }
            if (member.type === 'ClassProperty' && member.key.type === 'Identifier') {
              properties.push({
                name: member.key.name,
                type: member.typeAnnotation ? extractTypeAnnotation(member.typeAnnotation) : undefined,
                isStatic: member.static,
                isPrivate: member.key.name.startsWith('_') || member.key.name.startsWith('#') || member.accessibility === 'private',
              });
            }
          });
          
          classes.push({
            name,
            methods,
            properties,
            isExported: exportedNames.has(name),
            extends: path.node.superClass && path.node.superClass.type === 'Identifier' ? path.node.superClass.name : undefined,
          });
        }
      },
      
      ImportDeclaration(path) {
        const source = path.node.source.value;
        if (typeof source === 'string') {
          const specifiers: string[] = [];
          let isDefault = false;
          
          path.node.specifiers.forEach(spec => {
            if (spec.type === 'ImportDefaultSpecifier') {
              isDefault = true;
              specifiers.push(spec.local.name);
            } else if (spec.type === 'ImportSpecifier') {
              specifiers.push(spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value);
            }
          });
          
          imports.push({ source, specifiers, isDefault });
        }
      },

      TSInterfaceDeclaration(path) {
        if (path.node.id) {
          const name = path.node.id.name;
          const properties: PropertyInfo[] = [];
          
          if (path.node.body.type === 'TSInterfaceBody') {
            path.node.body.body.forEach(member => {
              if (member.type === 'TSPropertySignature' && member.key.type === 'Identifier') {
                properties.push({
                  name: member.key.name,
                  type: member.typeAnnotation ? extractTypeAnnotation(member.typeAnnotation) : undefined,
                  isStatic: false,
                  isPrivate: false,
                });
              }
            });
          }
          
          interfaces.push({
            name,
            properties,
            isExported: exportedNames.has(name),
          });
        }
      },

      TSTypeAliasDeclaration(path) {
        if (path.node.id) {
          types.push({
            name: path.node.id.name,
            isExported: exportedNames.has(path.node.id.name),
          });
        }
      },
    });

    return {
      path: filePath,
      relativePath,
      functions,
      classes,
      imports,
      interfaces,
      types,
    };
  } catch (error) {
    return null;
  }
}

function extractParamInfo(param: any): ParamInfo {
  if (param.type === 'Identifier') {
    return {
      name: param.name,
      type: param.typeAnnotation ? extractTypeAnnotation(param.typeAnnotation) : undefined,
      isOptional: param.optional || false,
    };
  }
  if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
    return {
      name: param.left.name,
      type: param.left.typeAnnotation ? extractTypeAnnotation(param.left.typeAnnotation) : undefined,
      isOptional: true,
      defaultValue: extractDefaultValue(param.right),
    };
  }
  if (param.type === 'RestElement' && param.argument.type === 'Identifier') {
    return {
      name: `...${param.argument.name}`,
      type: param.typeAnnotation ? extractTypeAnnotation(param.typeAnnotation) : undefined,
      isOptional: false,
    };
  }
  return { name: 'param', isOptional: false };
}

function extractTypeAnnotation(annotation: any): string {
  if (!annotation) return 'unknown';
  
  const typeAnnotation = annotation.typeAnnotation || annotation;
  
  if (typeAnnotation.type === 'TSStringKeyword') return 'string';
  if (typeAnnotation.type === 'TSNumberKeyword') return 'number';
  if (typeAnnotation.type === 'TSBooleanKeyword') return 'boolean';
  if (typeAnnotation.type === 'TSVoidKeyword') return 'void';
  if (typeAnnotation.type === 'TSAnyKeyword') return 'any';
  if (typeAnnotation.type === 'TSUnknownKeyword') return 'unknown';
  if (typeAnnotation.type === 'TSNullKeyword') return 'null';
  if (typeAnnotation.type === 'TSUndefinedKeyword') return 'undefined';
  if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {
    if (typeAnnotation.typeName.type === 'Identifier') {
      return typeAnnotation.typeName.name;
    }
  }
  if (typeAnnotation.type === 'TSArrayType') {
    return `${extractTypeAnnotation(typeAnnotation.elementType)}[]`;
  }
  if (typeAnnotation.type === 'TSUnionType') {
    return typeAnnotation.types.map((t: any) => extractTypeAnnotation(t)).join(' | ');
  }
  if (typeAnnotation.type === 'TSFunctionType') {
    return 'Function';
  }
  
  return 'unknown';
}

function extractDefaultValue(node: any): string | undefined {
  if (node.type === 'StringLiteral') return `"${node.value}"`;
  if (node.type === 'NumericLiteral') return String(node.value);
  if (node.type === 'BooleanLiteral') return String(node.value);
  if (node.type === 'NullLiteral') return 'null';
  if (node.type === 'Identifier') return node.name;
  return undefined;
}
