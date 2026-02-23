import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

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

export async function parseCodebase(rootPath: string): Promise<CodeStructure> {
  // Find all JS/TS files
  const files = await glob('**/*.{js,jsx,ts,tsx}', {
    cwd: rootPath,
    ignore: ['node_modules/**', 'dist/**', 'build/**'],
  });

  const parsedFiles: ParsedFile[] = [];
  const allExports: ExportInfo[] = [];
  const dependencies: string[] = [];

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
    dependencies.push(
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {})
    );
  } catch {
    // No package.json or parsing error, skip
  }

  return {
    files: parsedFiles,
    dependencies,
    exports: allExports,
  };
}

async function parseFile(filePath: string): Promise<ParsedFile | null> {
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

    const functions: FunctionInfo[] = [];
    const classes: ClassInfo[] = [];
    const imports: string[] = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id) {
          functions.push({
            name: path.node.id.name,
            params: path.node.params.map(p => 
              p.type === 'Identifier' ? p.name : 'param'
            ),
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
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}
