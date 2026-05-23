import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExecutionJobData } from './execution.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { status_codes } from 'generated/prisma/enums';
import EventEmitter2 from 'eventemitter2';
import { ContainersService } from '../containers/containers.service';
import { Subscription } from 'rxjs';
import { GetCodeParserFactory } from './code-parser/get-code-parser.factory';

const executionWorkerConcurrency = Number.parseInt(
    process.env.EXECUTION_WORKER_CONCURRENCY ?? '5',
    10,
);

@Injectable()
@Processor('execution', {
    concurrency: Number.isNaN(executionWorkerConcurrency)
        ? 5
        : executionWorkerConcurrency,
})
export class ExecutionProcessor extends WorkerHost {
    constructor(
        private submissionsService: SubmissionsService,
        private containersService: ContainersService,
        private eventEmitter: EventEmitter2,
        private getCodeParserFactory: GetCodeParserFactory,
    ) {
        super();
    }

    async process(job: Job<ExecutionJobData>): Promise<{
        executionTime: number;
        maxMemory: number;
    }> {
        console.log(`job ${job.id} is being done!`);

        let containerId: string | undefined;
        let replayOutputSubscription: Subscription | undefined;
        let replayErrorSubscription: Subscription | undefined;
        let timeout: NodeJS.Timeout | undefined;

        const codeParser = this.getCodeParserFactory.getCodeParser(
            job.data.language,
        );
        let outputLogs = '';
        let errorLogs = '';
        let successFlag = false;
        let metrics: { time: number; memory: number } = { time: 0, memory: 0 };
        let successToken = '';

        const submission = await this.submissionsService.findOne(
            job.data.submissionId,
        );

        try {
            containerId = await this.containersService.createContainer(
                codeParser.getContainerImage(),
                codeParser.getStartCMD(),
                { memoryLimitMb: submission.task.memoryLimit },
            );

            const [replayError, replayOutput] =
                await this.containersService.getContainerLogs(containerId);

            replayErrorSubscription = replayError.subscribe((log: string) => {
                this.eventEmitter.emit('log', { log, userId: job.data.userId });

                errorLogs += log;
                if (errorLogs.length > 2000) errorLogs = errorLogs.slice(-2000);
            });
            replayOutputSubscription = replayOutput.subscribe((log: string) => {
                this.eventEmitter.emit('log', { log, userId: job.data.userId });

                outputLogs += log;
                if (outputLogs.length > 2000)
                    outputLogs = outputLogs.slice(-2000);

                if (outputLogs.includes(successToken)) successFlag = true;

                const metricsString = outputLogs.match(/###METRICS###(.*?)###/);
                if (metricsString) {
                    metrics = JSON.parse(metricsString[1]) as {
                        time: number;
                        memory: number;
                    };
                }
            });
            const { code, key } = await codeParser.parseCode(
                job.data.code,
                submission.taskId,
                { archive: true },
            );

            // codeParser.validateCode();

            successToken = key;

            await this.containersService.putArchive(
                containerId,
                code as Buffer,
            );

            // Running container
            await this.containersService.runContainer(containerId);

            const timeoutPromise = new Promise((_, reject) => {
                timeout = setTimeout(() => {
                    if (containerId) {
                        void this.containersService
                            .stopContainer(containerId)
                            .catch((reason) => {
                                console.log(
                                    `stopping container aborted because ${reason}`,
                                );
                            });
                    }
                    reject(new Error('TIME_LIMIT_EXCEEDED'));
                }, submission.task.timeLimit * 1000);
            });

            const raceResult = (await Promise.race([
                timeoutPromise,
                this.containersService.awaitContainer(containerId),
            ])) as { StatusCode: number };

            await this.submissionsService.update(job.data.submissionId, {
                result: { exitCode: raceResult.StatusCode },
            });

            if (raceResult?.StatusCode !== 0) {
                switch (raceResult.StatusCode) {
                    case 137: {
                        throw new Error(status_codes.MEMORY_LIMIT_EXCEEDED);
                    }
                    case 2: {
                        throw new Error(status_codes.WRONG_ANSWER);
                    }
                    case 1: {
                        throw new Error(status_codes.RUNTIME_ERROR);
                    }
                }
                throw new Error(
                    `Something went wrong in the container: Exit code ${raceResult?.StatusCode}`,
                );
            }

            // If everything is OK signaling that job is done
            if (successFlag) {
                this.eventEmitter.emit('jobDone', {
                    job: job.id,
                    submissionId: job.data.submissionId,
                    userId: job.data.userId,
                    executionTime: metrics.time,
                    maxMemory: metrics.memory,
                });
                return {
                    executionTime: metrics.time,
                    maxMemory: metrics.memory,
                };
            }

            // If we are here then the solution is wrong
            throw new Error('WRONG_ANSWER');
        } catch (err) {
            const failureStatus = this.resolveFailedStatus(String(err));

            await this.submissionsService.update(job.data.submissionId, {
                logs: errorLogs,
                errorMessage: String(err),
                status: failureStatus,
            });

            console.log('catched error', err);
            this.eventEmitter.emit('log', {
                log: String(err),
                userId: job.data.userId,
            });
            throw err;
        } finally {
            if (replayOutputSubscription)
                replayOutputSubscription.unsubscribe();

            if (replayErrorSubscription) replayErrorSubscription.unsubscribe();

            if (timeout) clearTimeout(timeout);

            if (containerId) {
                await this.containersService.removeContainer(containerId);
            }
        }
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job) {
        const submissionId = parseInt(job.id?.split('-')[1] ?? '0');
        const returnValue = job.returnvalue as
            | { executionTime?: number; maxMemory?: number }
            | undefined;

        await this.submissionsService.update(submissionId, {
            status: status_codes.ACCEPTED,
            time: returnValue?.executionTime ?? 0,
            memoryUsed: returnValue?.maxMemory ?? 0,
        });

        console.log(`job ${job.id} is done!!!`);
    }

    private resolveFailedStatus(failedReason: string | undefined): status_codes {
        if (!failedReason) {
            return status_codes.RUNTIME_ERROR;
        }

        const normalized = failedReason.replace(/^Error:\s*/, '');
        if (normalized in status_codes) {
            return status_codes[normalized as status_codes];
        }

        for (const code of Object.values(status_codes)) {
            if (failedReason.includes(code)) {
                return code;
            }
        }

        return status_codes.RUNTIME_ERROR;
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job) {
        // Status is set in process() catch; avoid overwriting with BullMQ failedReason here.
        console.log(`job ${job.id} was unlucky`);
    }
}
