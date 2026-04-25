import { Injectable } from '@nestjs/common';
import {
    CodeParser,
    ParseCodeOptions,
    ParseCodeResult,
} from '../code-parser.interface';
import { TestCasesService } from '@/modules/test-cases/test-cases.service';
import { TasksService } from '@/modules/tasks/tasks.service';
import { CreateTaskIODto } from '@/modules/tasks/dto/create-task-IO.dto';
import * as crypto from 'crypto';
import * as tar from 'tar-stream';

@Injectable()
export class JavaScriptParser implements CodeParser {
    constructor(
        private testCasesService: TestCasesService,
        private tasksService: TasksService,
    ) {}
    getContainerImage(): string {
        return 'node:20-alpine';
    }

    streamToBuffer(stream: tar.Pack): Promise<Buffer> {
        return new Promise((res, rej) => {
            const buffer: Buffer[] = [];
            stream.on('data', (chunk: Buffer) => {
                buffer.push(chunk);
            });
            stream.on('end', () => {
                res(Buffer.concat(buffer));
            });
            stream.on('error', (err) => {
                rej(err);
            });
        });
    }

    async parseCode(
        code: string,
        taskId: number,
        options?: ParseCodeOptions,
    ): Promise<ParseCodeResult> {
        const task = await this.tasksService.findOne(taskId);
        const testCases = await this.testCasesService.findAllForTask(taskId);

        const parsedTestCases = JSON.stringify(testCases);

        const functionParameters =
            task.inputType as unknown as CreateTaskIODto[];
        const parsedFunctionParameters = functionParameters
            .map((param) => param.name)
            .join(', ');

        const parsedFunction = `async function testedFunction(${parsedFunctionParameters}){
        ${code}}`;

        const successToken = crypto.randomUUID();

        const parsedCode = `
const {performance} = require('perf_hooks');
const assert = require('assert');

const testCases = ${parsedTestCases};

${parsedFunction}

async function run() {
    const start = performance.now();
    
    for (let i = 0; i < testCases.length; i++) {
        let result;
        let output;
        
        try {
            const tc = testCases[i];
            const args = tc.input.map((arg) => JSON.parse(arg));
            output = JSON.parse(tc.expectedOutput);
            
            result = await testedFunction(...args);
            assert.deepStrictEqual(result, output);
        } catch (err) {
            console.error(\`Testcase \${i+1} failed. Expected \${JSON.stringify(output)}, recieved \${JSON.stringify(result)}\`);
            process.exit(1);
        }
    }

    const end = performance.now();
    const usage = process.resourceUsage();

    const metrics = {
        time: end - start,
        memory: usage.maxRSS / 1024
    };

    console.log('###METRICS###' + JSON.stringify(metrics) + '###');
    console.log('${successToken}');
    process.exit(0);
}

run().catch(err => {
    console.error('Fatal Error: ' + err.message);
    process.exit(1);
});
`;

        if (options?.archive) {
            const pack = tar.pack();

            pack.entry({ name: 'index.js' }, parsedCode);
            pack.finalize();

            const buffer = await this.streamToBuffer(pack);

            return { key: successToken, code: buffer };
        }

        return { key: successToken, code: parsedCode };
    }

    validateCode(code: string): boolean {
        return code ? true : false;
    }
}
