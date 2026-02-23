export interface GitHubInfo {
    owner: string;
    repo: string;
    url: string;
}
export declare function isGitHubUrl(input: string): boolean;
export declare function parseGitHubUrl(input: string): GitHubInfo | null;
export declare function isLocalPath(input: string): boolean;
export declare function resolvePath(input: string): string;
export declare function cloneGitHubRepo(githubUrl: string): Promise<{
    path: string;
    cleanup: () => void;
}>;
export declare function validatePath(inputPath: string): Promise<string>;
//# sourceMappingURL=github.d.ts.map