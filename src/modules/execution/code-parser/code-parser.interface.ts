export interface CodeParser {
    parseCode(
        code: string,
        taskId: number,
        options?: ParseCodeOptions,
    ): Promise<ParseCodeResult>;
    getContainerImage(): string;
    validateCode(code: string): boolean;
}

export interface ParseCodeOptions {
    archive: boolean;
}

export interface ParseCodeResult {
    key: string;
    code: string | Buffer;
}
