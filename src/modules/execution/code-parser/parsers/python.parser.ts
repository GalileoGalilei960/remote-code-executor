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
export class PythonParser implements CodeParser {
    constructor(
        private testCasesService: TestCasesService,
        private tasksService: TasksService,
    ) {}

    getContainerImage(): string {
        return 'python:3.11-alpine';
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

        // Python relies on indentation. We must indent the user's raw code block
        // to fit inside the generated function definition.
        const indentedCode = code
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n');

        const parsedFunction = `def testedFunction(${parsedFunctionParameters}):\n${indentedCode}`;

        const successToken = crypto.randomUUID();

        // Python Wrapper Injection
        const parsedCode = `
import time
import resource
import json
import sys

# Load test cases safely via raw string to prevent quote escaping issues
test_cases_json = r'''${parsedTestCases}'''
test_cases = json.loads(test_cases_json)

${parsedFunction}

def run():
    start_time = time.perf_counter()
    
    for i, tc in enumerate(test_cases):
        try:
            args = [json.loads(arg) for arg in tc['input']]
            expected_output = json.loads(tc['expectedOutput'])
            
            result = testedFunction(*args)
            
            if result != expected_output:
                sys.stderr.write(f"Testcase {i + 1} failed. Expected {json.dumps(expected_output)}, received {json.dumps(result)}\\n")
                sys.exit(2)
                
        except Exception as e:
            sys.stderr.write(f"Testcase {i + 1} crashed with runtime error: {type(e).__name__} - {str(e)}\\n")
            sys.exit(1)

    end_time = time.perf_counter()
    usage = resource.getrusage(resource.RUSAGE_SELF)

    metrics = {
        "time": (end_time - start_time) * 1000, # Convert seconds to ms
        "memory": usage.ru_maxrss # ru_maxrss is already in KB on Linux
    }

    print("###METRICS###" + json.dumps(metrics) + "###")
    print("${successToken}")
    sys.exit(0)

if __name__ == '__main__':
    run()
`;

        this.validateCode();

        // console.log(parsedCode);

        if (options?.archive) {
            const pack = tar.pack();
            // Naming it main.py for Python convention
            pack.entry({ name: 'main.py' }, parsedCode);
            pack.finalize();

            const buffer = await this.streamToBuffer(pack);

            return { key: successToken, code: buffer };
        }

        return { key: successToken, code: parsedCode };
    }

    validateCode(): boolean {
        // We cannot use vm.Script here because vm is a V8 (JavaScript) engine module.
        // Node.js cannot natively parse Python AST without spawning a child process.
        // For a sandboxed RCE, it's safer and faster to return true and let the
        // Python interpreter inside the Podman container throw the SyntaxError
        // during execution, which will be caught by the stderr stream.
        return true;
    }

    getStartCMD(): string[] {
        return ['python', 'main.py'];
    }
}
