import { AppModule } from '@/app.module';
import { JwtPayload } from '@/modules/auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ParamTypes } from '@/common/types/param.types';
import {
    languages,
    status_codes,
    task_difficulties,
} from 'generated/prisma/enums';
import { JsonValue } from '@prisma/client/runtime/client';
import supertest from 'supertest';
import { App } from 'supertest/types';
import { AddressInfo } from 'net';
import { ExecutionService } from '@/modules/execution/execution.service';
import { Queue } from 'bullmq';
import {
    connectAuthenticatedSocket,
    resolveDockerSocketPath,
    waitForExecutionQueueIdle,
    waitForSocketJobDone,
    waitForSocketLog,
    warmUpNodeExecutionImage,
} from './execution-e2e.helpers';

describe('ExecutionController(e2e)', () => {
    let app: INestApplication;
    let pgContainer: StartedPostgreSqlContainer;
    let redisContainer: StartedRedisContainer;
    let prisma: PrismaService;
    let jwtService: JwtService;
    let configService: ConfigService;
    let moduleFixture: TestingModule;
    let executionQueue: Queue | undefined;
    let user: {
        username: string;
        email: string;
        password: string;
        createdAt: Date;
        updatedAt: Date | null;
        id: number;
    };
    let jwtPayload: JwtPayload;
    let sessionId: string;
    let jwtAT: string;
    let jwtRT: string;
    let task: {
        id: number;
        createdAt: Date;
        updatedAt: Date | null;
        title: string;
        description: string;
        difficulty: task_difficulties;
        isPublished: boolean;
        memoryLimit: number;
        timeLimit: number;
        inputType: JsonValue;
        expectedOutputType: JsonValue;
    };
    let memoryStressTask: typeof task;
    let wsUrl: string;

    beforeAll(async () => {
        pgContainer = await new PostgreSqlContainer(
            'postgres:18.1-alpine',
        ).start();
        redisContainer = await new RedisContainer('redis:alpine').start();

        process.env.DATABASE_URL = pgContainer.getConnectionUri();
        process.env.REDIS_HOST = redisContainer.getHost();
        process.env.REDIS_PORT = redisContainer.getPort().toString();
        process.env.DOCKER_SOCKET_PATH = resolveDockerSocketPath();

        warmUpNodeExecutionImage();

        execSync('pnpm dlx prisma db push', {
            env: process.env,
            stdio: 'inherit',
        });

        moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        await app.listen(0); // Listen on any available port

        const httpServer = app.getHttpServer() as import('http').Server;
        const address = httpServer.address() as AddressInfo;

        if (!address || typeof address === 'string') {
            throw new Error('Server address is invalid');
        }
        wsUrl = `ws://127.0.0.1:${address.port}`;

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        jwtService = moduleFixture.get<JwtService>(JwtService);
        configService = moduleFixture.get<ConfigService>(ConfigService);

        // Get the execution queue from the ExecutionService
        const executionService =
            moduleFixture.get<ExecutionService>(ExecutionService);
        // @ts-expect-error - accessing private property for testing purposes
        if (executionService && executionService.executionQueue) {
            // @ts-expect-error - accessing private property for testing purposes
            executionQueue = executionService.executionQueue;
        } else {
            console.warn('Could not get execution queue from ExecutionService');
        }

        user = await prisma.user.create({
            data: {
                email: 'test@test.io',
                password:
                    '$2a$08$a.3/oCwVCc72x6twTocaY.xjIEHv5dqW7fIiK39alGT7M5.ELYBBu', // testpassword
                username: 'test',
            },
        });

        sessionId = crypto.randomUUID();

        jwtPayload = { sub: user.id, email: user.email, sessionId: sessionId };

        jwtAT = await jwtService.signAsync(jwtPayload);
        jwtRT = await jwtService.signAsync(jwtPayload, {
            secret: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });

        await prisma.session.create({
            data: {
                device: 'testdevice',
                ip: 'testip',
                userAgent: 'testagent',
                expiresAt: new Date(Date.now() + 15 * 60 * 60 * 1000),
                refreshToken: await bcrypt.hash(jwtRT, 10),
                userId: user.id,
            },
        });

        /* Solution :
            const map = new Map();
            for (let i = 0; i < nums.length; i++) {
                const complement = target - nums[i];
                if (map.has(complement)) {
                    return [map.get(complement), i];
                }
                map.set(nums[i], i);
            }
        */

        task = await prisma.task.create({
            data: {
                title: 'Two Sum',
                description: 'Return indices of the two numbers...',
                difficulty: 'Easy',
                memoryLimit: 128,
                timeLimit: 15.0,
                inputType: [
                    { type: ParamTypes.INT_ARRAY, name: 'nums' },
                    { type: ParamTypes.INT, name: 'target' },
                ],
                expectedOutputType: {
                    type: ParamTypes.INT_ARRAY,
                    name: 'result',
                },
            },
        });

        await prisma.testCase.createMany({
            data: [
                {
                    taskId: task.id,
                    isSample: true,
                    input: [[2, 7, 11, 15], 9], // nums = [2,7,11,15], target = 9
                    expectedOutput: [0, 1], // 2 + 7 = 9 (indices 0 and 1)
                },
                {
                    taskId: task.id,
                    isSample: true,
                    input: [[3, 2, 4], 6], // nums = [3,2,4], target = 6
                    expectedOutput: [1, 2], // 2 + 4 = 6 (indices 1 and 2)
                },
                {
                    taskId: task.id,
                    isSample: false,
                    input: [[3, 3], 6], // nums = [3,3], target = 6
                    expectedOutput: [0, 1], // 3 + 3 = 6 (indices 0 and 1)
                },
            ],
        });

        memoryStressTask = await prisma.task.create({
            data: {
                title: 'Memory stress',
                description: 'OOM test task',
                difficulty: 'Easy',
                memoryLimit: 64,
                timeLimit: 15.0,
                inputType: [
                    { type: ParamTypes.INT_ARRAY, name: 'nums' },
                    { type: ParamTypes.INT, name: 'target' },
                ],
                expectedOutputType: {
                    type: ParamTypes.INT_ARRAY,
                    name: 'result',
                },
            },
        });

        await prisma.testCase.create({
            data: {
                taskId: memoryStressTask.id,
                isSample: true,
                input: [[1], 1],
                expectedOutput: [0],
            },
        });
    }, 180000);

    afterEach(async () => {
        if (executionQueue != null) {
            await waitForExecutionQueueIdle(executionQueue);
        }
    }, 120_000);

    afterAll(async () => {
        // Wait for the execution queue to drain all jobs before closing
        // This ensures that onFailed/onCompleted handlers complete their database updates
        // before the Prisma connection is terminated
        if (executionQueue != null) {
            try {
                await executionQueue.drain();
            } catch (e) {
                console.warn('Error draining queue:', e);
            }
        }

        // Give a small grace period for any remaining async operations
        await new Promise((resolve) => setTimeout(resolve, 500));

        await app.close();
        await pgContainer.stop();
        await redisContainer.stop();
    }, 30000);

    it('Should be defined', () => {
        expect(app).toBeDefined();
    });

    it('Should not let execute code without authorization', async () => {
        await supertest(app.getHttpServer() as App)
            .post(`/execution/${task.id}`)
            .send({ language: languages.JavaScript, code: '"Hello word!"' })
            .expect(401);
    });

    it('Should let execute code with authorization but fail on wrong logic', async () => {
        const socket = await connectAuthenticatedSocket(wsUrl, jwtAT);
        const socketPromise = waitForSocketLog(
            socket,
            (log) => log.includes('WRONG_ANSWER'),
            30_000,
        );

        const response = await supertest(app.getHttpServer() as App)
            .post(`/execution/${task.id}`)
            .set('Authorization', `Bearer ${jwtAT}`)
            .send({
                language: languages.JavaScript,
                code: 'console.log("Hello word!")',
            })
            .expect(202);

        expect(response.body).toHaveProperty('submissionId');
        const submissionId = (response.body as { submissionId: number })
            .submissionId;

        await socketPromise;

        // Allow time for job processing and database update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify submission was created and properly updated
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        });
        expect(submission).toBeDefined();
        expect(submission?.userId).toBe(user.id);
        expect(submission?.taskId).toBe(task.id);
        expect(submission?.language).toBe(languages.JavaScript);
        expect(submission?.status).toBe(status_codes.WRONG_ANSWER);

        socket.disconnect();
    }, 60_000);

    it('Should not let execute code with invalid dto', async () => {
        await supertest(app.getHttpServer() as App)
            .post(`/execution/${task.id}`)
            .set('Authorization', `Bearer ${jwtAT}`)
            .send({ language: languages.JavaScript })
            .expect(400);
    });

    it('Should successfully execute code and emit JobDone event', async () => {
        const socket = await connectAuthenticatedSocket(wsUrl, jwtAT);
        const socketPromise = waitForSocketJobDone(socket, 30_000);

        const response = await supertest(app.getHttpServer() as App)
            .post(`/execution/${task.id}`)
            .set('Authorization', `Bearer ${jwtAT}`)
            .send({
                language: languages.JavaScript,
                code: `            const map = new Map();
            for (let i = 0; i < nums.length; i++) {
                const complement = target - nums[i];
                if (map.has(complement)) {
                    return [map.get(complement), i];
                }
                map.set(nums[i], i);}`,
            })
            .expect(202);

        const submissionId = (response.body as { submissionId: number })
            .submissionId;
        const wsResult = await socketPromise;

        expect(wsResult).toBeTruthy();

        // Allow time for job processing and database update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify submission was created and properly updated
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        });
        expect(submission).toBeDefined();
        expect(submission?.userId).toBe(user.id);
        expect(submission?.taskId).toBe(task.id);
        expect(submission?.language).toBe(languages.JavaScript);
        expect(submission?.status).toBe(status_codes.ACCEPTED);
        expect(submission?.time).toBeTruthy(); // time is Decimal type
        expect(submission?.memoryUsed).toBeGreaterThan(0);

        socket.disconnect();
    }, 60_000);

    it('Should throw TIME_LIMIT_EXCEEDED if code runs for to long', async () => {
        const socket = await connectAuthenticatedSocket(wsUrl, jwtAT);
        const socketPromise = waitForSocketLog(
            socket,
            (log) => log.includes('TIME_LIMIT_EXCEEDED'),
            25_000,
        );

        const response = await supertest(app.getHttpServer() as App)
            .post(`/execution/${task.id}`)
            .set('Authorization', `Bearer ${jwtAT}`)
            .send({
                language: languages.JavaScript,
                code: `while (true) {}`,
            })
            .expect(202);

        const submissionId = (response.body as { submissionId: number })
            .submissionId;
        const wsResult = await socketPromise;

        expect(wsResult).toEqual({
            log: 'Error: TIME_LIMIT_EXCEEDED',
        });

        // Allow time for job processing and database update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify submission was created and properly updated
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        });
        expect(submission).toBeDefined();
        expect(submission?.userId).toBe(user.id);
        expect(submission?.taskId).toBe(task.id);
        expect(submission?.language).toBe(languages.JavaScript);
        expect(submission?.status).toBe(status_codes.TIME_LIMIT_EXCEEDED);

        socket.disconnect();
    }, 50_000);

    it('Should throw MEMORY_LIMIT_EXCEEDED if code runs uses to much memory', async () => {
        const socket = await connectAuthenticatedSocket(wsUrl, jwtAT);
        const socketPromise = waitForSocketLog(
            socket,
            (log) => log.includes('MEMORY_LIMIT_EXCEEDED'),
            45_000,
        );

        const response = await supertest(app.getHttpServer() as App)
            .post(`/execution/${memoryStressTask.id}`)
            .set('Authorization', `Bearer ${jwtAT}`)
            .send({
                language: languages.JavaScript,
                code: `const chunks = [];
while (true) {
    chunks.push(Buffer.alloc(8 * 1024 * 1024));
}`,
            })
            .expect(202);

        const submissionId = (response.body as { submissionId: number })
            .submissionId;
        const wsResult = await socketPromise;

        expect(wsResult).toEqual({
            log: 'Error: MEMORY_LIMIT_EXCEEDED',
        });

        // Allow time for job processing and database update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify submission was created and properly updated
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        });
        expect(submission).toBeDefined();
        expect(submission?.userId).toBe(user.id);
        expect(submission?.taskId).toBe(memoryStressTask.id);
        expect(submission?.language).toBe(languages.JavaScript);
        expect(submission?.status).toBe(status_codes.MEMORY_LIMIT_EXCEEDED);

        socket.disconnect();
    }, 60_000);
    it('Should throw RUNTIME_ERROR if code runs with error', async () => {
        const socket = await connectAuthenticatedSocket(wsUrl, jwtAT);
        const socketPromise = waitForSocketLog(
            socket,
            (log) => log.includes('runtime error'),
            30_000,
        );

        const response = await supertest(app.getHttpServer() as App)
            .post(`/execution/${task.id}`)
            .set('Authorization', `Bearer ${jwtAT}`)
            .send({
                language: languages.JavaScript,
                code: `throw new Error("I have no idea what I am doing");`,
            })
            .expect(202);

        const submissionId = (response.body as { submissionId: number })
            .submissionId;
        const wsResult = await socketPromise;

        expect(wsResult.log).toContain(
            'ERROR: Testcase 1 crashed with runtime error: Error - I have no idea what I am doing',
        );

        // Allow time for job processing and database update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify submission was created and properly updated
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        });
        expect(submission).toBeDefined();
        expect(submission?.userId).toBe(user.id);
        expect(submission?.taskId).toBe(task.id);
        expect(submission?.language).toBe(languages.JavaScript);
        expect(submission?.status).toBe(status_codes.RUNTIME_ERROR);

        socket.disconnect();
    }, 30000);
    it('Should throw RUNTIME_ERROR if code tries to use network', async () => {
        const socket = await connectAuthenticatedSocket(wsUrl, jwtAT);
        const socketPromise = waitForSocketLog(socket, () => true, 30_000);

        const response = await supertest(app.getHttpServer() as App)
            .post(`/execution/${task.id}`)
            .set('Authorization', `Bearer ${jwtAT}`)
            .send({
                language: languages.JavaScript,
                code: `fetch('https://google.com')
    .then(res => console.log(res.status))
    .catch(err => console.error(err));`,
            })
            .expect(202);

        const submissionId = (response.body as { submissionId: number })
            .submissionId;
        const wsResult = await socketPromise;

        // Network restrictions can cause various error types depending on environment
        const statusString = String(status_codes.RUNTIME_ERROR);
        expect(
            wsResult.log.includes(statusString) ||
                wsResult.log.includes('Error:'),
        ).toBeTruthy();

        // Allow time for job processing and database update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify submission was created and properly updated
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        });
        expect(submission).toBeDefined();
        expect(submission?.userId).toBe(user.id);
        expect(submission?.taskId).toBe(task.id);
        expect(submission?.language).toBe(languages.JavaScript);
        expect(submission?.status).toBe(status_codes.RUNTIME_ERROR);

        socket.disconnect();
    }, 30000);
});
