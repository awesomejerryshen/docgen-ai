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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocs = generateDocs;
const parser_1 = require("./parser");
const ai_writer_1 = require("./ai-writer");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
async function generateDocs(inputPath, options) {
    // Step 1: Parse codebase
    console.log('📖 Parsing codebase...');
    const codeStructure = await (0, parser_1.parseCodebase)(inputPath);
    // Step 2: Generate documentation using AI
    console.log('🤖 Generating documentation...');
    const readme = await (0, ai_writer_1.generateReadme)(codeStructure, options.apiKey);
    const apiDocs = await (0, ai_writer_1.generateApiDocs)(codeStructure, options.apiKey);
    // Step 3: Write output files
    console.log('📝 Writing documentation files...');
    await fs.mkdir(options.output, { recursive: true });
    await fs.writeFile(path.join(options.output, 'README.md'), readme);
    await fs.writeFile(path.join(options.output, 'API.md'), apiDocs);
    return {
        readme: path.join(options.output, 'README.md'),
        apiDocs: path.join(options.output, 'API.md'),
    };
}
//# sourceMappingURL=generator.js.map