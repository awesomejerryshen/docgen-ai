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
exports.DEFAULT_CONFIG = void 0;
exports.loadConfig = loadConfig;
exports.mergeConfigWithDefaults = mergeConfigWithDefaults;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_FILES = ['.docgenrc', '.docgenrc.json', 'docgen.config.json'];
async function loadConfig(projectPath) {
    const config = {};
    if (projectPath) {
        for (const configFile of CONFIG_FILES) {
            const configPath = path.join(projectPath, configFile);
            try {
                const content = await fs.readFile(configPath, 'utf-8');
                const parsed = JSON.parse(content);
                Object.assign(config, parsed);
                break;
            }
            catch {
                continue;
            }
        }
    }
    const globalConfigPath = path.join(os.homedir(), '.docgenrc');
    try {
        const content = await fs.readFile(globalConfigPath, 'utf-8');
        const parsed = JSON.parse(content);
        Object.assign(config, parsed);
    }
    catch {
        // No global config, that's fine
    }
    return config;
}
function mergeConfigWithDefaults(config) {
    return {
        output: config.output || './docs',
        format: config.format || 'markdown',
        template: config.template || 'default',
        includePrivate: config.includePrivate || false,
        excludePatterns: config.excludePatterns || ['node_modules/**', 'dist/**', 'build/**', '**/*.test.ts', '**/*.spec.ts'],
        badges: {
            npm: config.badges?.npm ?? true,
            github: config.badges?.github ?? true,
            license: config.badges?.license ?? true,
            coverage: config.badges?.coverage ?? false,
            custom: config.badges?.custom || [],
        },
        sections: {
            installation: config.sections?.installation ?? true,
            usage: config.sections?.usage ?? true,
            api: config.sections?.api ?? true,
            contributing: config.sections?.contributing ?? true,
            changelog: config.sections?.changelog ?? false,
        },
        ai: {
            model: config.ai?.model || 'gpt-4-turbo-preview',
            temperature: config.ai?.temperature ?? 0.7,
            maxTokens: config.ai?.maxTokens || 2000,
        },
    };
}
exports.DEFAULT_CONFIG = {
    output: './docs',
    format: 'markdown',
    template: 'default',
    includePrivate: false,
    excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
    badges: {
        npm: true,
        github: true,
        license: true,
        coverage: false,
        custom: [],
    },
    sections: {
        installation: true,
        usage: true,
        api: true,
        contributing: true,
        changelog: false,
    },
    ai: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 2000,
    },
};
//# sourceMappingURL=config.js.map