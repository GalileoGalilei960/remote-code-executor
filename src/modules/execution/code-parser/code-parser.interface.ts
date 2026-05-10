export interface CodeParser {
    parseCode(
        code: string,
        taskId: number,
        options?: ParseCodeOptions,
    ): Promise<ParseCodeResult>;
    getContainerImage(): string;
    validateCode(code: string): boolean;
    getStartCMD(): string[];
}

export interface ParseCodeOptions {
    archive: boolean;
}

export interface ParseCodeResult {
    key: string;
    code: string | Buffer;
}
