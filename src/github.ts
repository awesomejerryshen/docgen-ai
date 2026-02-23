import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as tmp from 'tmp';
import * as os from 'os';

tmp.setGracefulCleanup();

const GITHUB_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/;
const GITHUB_SHORT_PATTERN = /^github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/;
const GITHUB_SSH_PATTERN = /^git@github\.com:([^/]+)\/([^/]+)(?:\.git)?$/;

export interface GitHubInfo {
  owner: string;
  repo: string;
  url: string;
}

export function isGitHubUrl(input: string): boolean {
  return GITHUB_PATTERN.test(input) || GITHUB_SHORT_PATTERN.test(input) || GITHUB_SSH_PATTERN.test(input);
}

export function parseGitHubUrl(input: string): GitHubInfo | null {
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

export function isLocalPath(input: string): boolean {
  return input.startsWith('./') || input.startsWith('../') || input.startsWith('/') || input.startsWith('~');
}

export function resolvePath(input: string): string {
  if (input.startsWith('~')) {
    return path.join(os.homedir(), input.slice(1));
  }
  return path.resolve(input);
}

export async function cloneGitHubRepo(githubUrl: string): Promise<{ path: string; cleanup: () => void }> {
  const info = parseGitHubUrl(githubUrl);
  if (!info) {
    throw new Error(`Invalid GitHub URL: ${githubUrl}`);
  }

  const tempDir = tmp.dirSync({ unsafeCleanup: true });
  const repoPath = path.join(tempDir.name, info.repo);
  
  try {
    execSync(`git clone --depth 1 https://github.com/${info.owner}/${info.repo}.git "${repoPath}"`, {
      stdio: 'pipe',
      timeout: 120000,
    });
  } catch (error) {
    tempDir.removeCallback();
    throw new Error(`Failed to clone repository: ${info.owner}/${info.repo}`);
  }
  
  return {
    path: repoPath,
    cleanup: () => tempDir.removeCallback(),
  };
}

export async function validatePath(inputPath: string): Promise<string> {
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
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Directory does not exist: ${resolved}`);
    }
    throw error;
  }
}
