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
exports.isGitHubUrl = isGitHubUrl;
exports.parseGitHubUrl = parseGitHubUrl;
exports.isLocalPath = isLocalPath;
exports.resolvePath = resolvePath;
exports.cloneGitHubRepo = cloneGitHubRepo;
exports.validatePath = validatePath;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const tmp = __importStar(require("tmp"));
const os = __importStar(require("os"));
tmp.setGracefulCleanup();
const GITHUB_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/;
const GITHUB_SHORT_PATTERN = /^github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/;
const GITHUB_SSH_PATTERN = /^git@github\.com:([^/]+)\/([^/]+)(?:\.git)?$/;
function isGitHubUrl(input) {
    return GITHUB_PATTERN.test(input) || GITHUB_SHORT_PATTERN.test(input) || GITHUB_SSH_PATTERN.test(input);
}
function parseGitHubUrl(input) {
    let match = input.match(GITHUB_PATTERN);
    if (match) {
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, ''),
            url: `https://github.com/${match[1]}/${match[2].replace(/\.git$/, '')}`,
        };
    }
    match = input.match(GITHUB_SHORT_PATTERN);
    if (match) {
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, ''),
            url: `https://github.com/${match[1]}/${match[2].replace(/\.git$/, '')}`,
        };
    }
    match = input.match(GITHUB_SSH_PATTERN);
    if (match) {
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, ''),
            url: `https://github.com/${match[1]}/${match[2].replace(/\.git$/, '')}`,
        };
    }
    return null;
}
function isLocalPath(input) {
    return input.startsWith('./') || input.startsWith('../') || input.startsWith('/') || input.startsWith('~');
}
function resolvePath(input) {
    if (input.startsWith('~')) {
        return path.join(os.homedir(), input.slice(1));
    }
    return path.resolve(input);
}
async function cloneGitHubRepo(githubUrl) {
    const info = parseGitHubUrl(githubUrl);
    if (!info) {
        throw new Error(`Invalid GitHub URL: ${githubUrl}`);
    }
    const tempDir = tmp.dirSync({ unsafeCleanup: true });
    const repoPath = path.join(tempDir.name, info.repo);
    try {
        (0, child_process_1.execSync)(`git clone --depth 1 https://github.com/${info.owner}/${info.repo}.git "${repoPath}"`, {
            stdio: 'pipe',
            timeout: 120000,
        });
    }
    catch (error) {
        tempDir.removeCallback();
        throw new Error(`Failed to clone repository: ${info.owner}/${info.repo}`);
    }
    return {
        path: repoPath,
        cleanup: () => tempDir.removeCallback(),
    };
}
async function validatePath(inputPath) {
    if (isGitHubUrl(inputPath)) {
        return inputPath;
    }
    const resolved = resolvePath(inputPath);
    try {
        const stat = await fs.stat(resolved);
        if (!stat.isDirectory()) {
            throw new Error(`Path is not a directory: ${resolved}`);
        }
        return resolved;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Directory does not exist: ${resolved}`);
        }
        throw error;
    }
}
//# sourceMappingURL=github.js.map