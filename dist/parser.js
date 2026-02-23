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
async function parseCodebase(rootPath) {
    // Find all JS/TS files
    const files = await (0, glob_1.glob)('**/*.{js,jsx,ts,tsx}', {
        cwd: rootPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**'],
    });
    const parsedFiles = [];
    const allExports = [];
    const dependencies = [];
    for (const file of files) {
        const filePath = path.join(rootPath, file);
        const parsed = await parseFile(filePath);
        if (parsed) {
            parsedFiles.push(parsed);
            // Collect exports
            parsed.functions
                .filter(f => f.isExported)
                .forEach(f => allExports.push({
                name: f.name,
                type: 'function',
                file: file,
            }));
            parsed.classes
                .filter(c => c.isExported)
                .forEach(c => allExports.push({
                name: c.name,
                type: 'class',
                file: file,
            }));
        }
    }
    // Try to parse package.json for dependencies
    try {
        const packageJsonPath = path.join(rootPath, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        dependencies.push(...Object.keys(packageJson.dependencies || {}), ...Object.keys(packageJson.devDependencies || {}));
    }
    catch {
        // No package.json or parsing error, skip
    }
    return {
        files: parsedFiles,
        dependencies,
        exports: allExports,
    };
}
async function parseFile(filePath) {
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
            ],
        });
        const functions = [];
        const classes = [];
        const imports = [];
        (0, traverse_1.default)(ast, {
            FunctionDeclaration(path) {
                if (path.node.id) {
                    functions.push({
                        name: path.node.id.name,
                        params: path.node.params.map(p => p.type === 'Identifier' ? p.name : 'param'),
                        isExported: path.parent.type === 'ExportNamedDeclaration',
                    });
                }
            },
            ClassDeclaration(path) {
                if (path.node.id) {
                    classes.push({
                        name: path.node.id.name,
                        methods: [],
                        properties: [],
                        isExported: path.parent.type === 'ExportNamedDeclaration',
                    });
                }
            },
            ImportDeclaration(path) {
                const source = path.node.source.value;
                if (typeof source === 'string') {
                    imports.push(source);
                }
            },
        });
        return {
            path: filePath,
            functions,
            classes,
            imports,
        };
    }
    catch (error) {
        console.error(`Failed to parse ${filePath}:`, error);
        return null;
    }
}
//# sourceMappingURL=parser.js.map