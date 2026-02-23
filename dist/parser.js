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
exports.parseCodebase = parseCodebase;
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const FRAMEWORK_SIGNATURES = {
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
async function parseCodebase(rootPath, excludePatterns = []) {
    const defaultExcludes = ['node_modules/**', 'dist/**', 'build/**', '**/*.test.ts', '**/*.spec.ts', '**/*.test.js', '**/*.spec.js'];
    const ignores = [...defaultExcludes, ...excludePatterns];
    const files = await (0, glob_1.glob)('**/*.{js,jsx,ts,tsx}', {
        cwd: rootPath,
        ignore: ignores,
    });
    const parsedFiles = [];
    const allExports = [];
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
async function parsePackageJson(rootPath) {
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
    }
    catch {
        return undefined;
    }
}
async function analyzeDependencies(rootPath) {
    const dependencies = {
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
    }
    catch {
        // No package.json
    }
    return dependencies;
}
function detectFrameworks(dependencies) {
    const allDeps = { ...dependencies.production, ...dependencies.dev };
    const frameworks = [];
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
async function parseFile(filePath, relativePath) {
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
        const functions = [];
        const classes = [];
        const imports = [];
        const interfaces = [];
        const types = [];
        const exportedNames = new Set();
        (0, traverse_1.default)(ast, {
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
                    const methods = [];
                    const properties = [];
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
                    const specifiers = [];
                    let isDefault = false;
                    path.node.specifiers.forEach(spec => {
                        if (spec.type === 'ImportDefaultSpecifier') {
                            isDefault = true;
                            specifiers.push(spec.local.name);
                        }
                        else if (spec.type === 'ImportSpecifier') {
                            specifiers.push(spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value);
                        }
                    });
                    imports.push({ source, specifiers, isDefault });
                }
            },
            TSInterfaceDeclaration(path) {
                if (path.node.id) {
                    const name = path.node.id.name;
                    const properties = [];
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
    }
    catch (error) {
        return null;
    }
}
function extractParamInfo(param) {
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
function extractTypeAnnotation(annotation) {
    if (!annotation)
        return 'unknown';
    const typeAnnotation = annotation.typeAnnotation || annotation;
    if (typeAnnotation.type === 'TSStringKeyword')
        return 'string';
    if (typeAnnotation.type === 'TSNumberKeyword')
        return 'number';
    if (typeAnnotation.type === 'TSBooleanKeyword')
        return 'boolean';
    if (typeAnnotation.type === 'TSVoidKeyword')
        return 'void';
    if (typeAnnotation.type === 'TSAnyKeyword')
        return 'any';
    if (typeAnnotation.type === 'TSUnknownKeyword')
        return 'unknown';
    if (typeAnnotation.type === 'TSNullKeyword')
        return 'null';
    if (typeAnnotation.type === 'TSUndefinedKeyword')
        return 'undefined';
    if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {
        if (typeAnnotation.typeName.type === 'Identifier') {
            return typeAnnotation.typeName.name;
        }
    }
    if (typeAnnotation.type === 'TSArrayType') {
        return `${extractTypeAnnotation(typeAnnotation.elementType)}[]`;
    }
    if (typeAnnotation.type === 'TSUnionType') {
        return typeAnnotation.types.map((t) => extractTypeAnnotation(t)).join(' | ');
    }
    if (typeAnnotation.type === 'TSFunctionType') {
        return 'Function';
    }
    return 'unknown';
}
function extractDefaultValue(node) {
    if (node.type === 'StringLiteral')
        return `"${node.value}"`;
    if (node.type === 'NumericLiteral')
        return String(node.value);
    if (node.type === 'BooleanLiteral')
        return String(node.value);
    if (node.type === 'NullLiteral')
        return 'null';
    if (node.type === 'Identifier')
        return node.name;
    return undefined;
}
//# sourceMappingURL=parser.js.map