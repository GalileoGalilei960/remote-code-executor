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

@Injectable()
@Processor('execution', { concurrency: 5 })
export class ExecutionProcessor extends WorkerHost {
    constructor(
        private submissionsService: SubmissionsService,
        private containersService: ContainersService,
        private eventEmitter: EventEmitter2,
        private getCodeParserFactory: GetCodeParserFactory,
    ) {
        super();
    }

    async process(job: Job<ExecutionJobData>) {
        console.log(`job ${job.id} is being done!`);

        let containerId: string | undefined;
        let replayOutputSubscription: Subscription | undefined;
        let replayErrorSubscription: Subscription | undefined;
        let timeout: NodeJS.Timeout | undefined;

        const codeParser = this.getCodeParserFactory.getCodeParser(
            job.data.language,
        );
        let outputLogs = '';
        let successFlag = false;
        let metrics: { time?: number; memory?: number } = {};
        let successToken = '';

        try {
            // Creating container
            containerId = await this.containersService.createContainer(
                codeParser.getContainerImage(),
                ['node', 'index.js'],
            );

            // Receiving logs from continer and sending them to the socket
            const [replayError, replayOutput] =
                await this.containersService.getContainerLogs(containerId);

            replayErrorSubscription = replayError.subscribe((log: string) => {
                this.eventEmitter.emit('log', { log, userId: job.data.userId });
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
                        time?: number;
                        memory?: number;
                    };
                }
            });

            // Inserting archive
            const submission = await this.submissionsService.findOne(
                job.data.submissionId,
            );
            codeParser.validateCode(job.data.code);
            const { code, key } = await codeParser.parseCode(
                job.data.code,
                submission.taskId,
                { archive: true },
            );

            successToken = key;

            await this.containersService.putArchive(
                containerId,
                code as Buffer,
            );

            // Running container
            await this.containersService.runContainer(containerId);

            const timeoutPromise = new Promise((_, reject) => {
                timeout = setTimeout(() => {
                    if (containerId)
                        this.containersService

                            .stopContainer(containerId)
                            .then(() => {
                                reject(new Error('TIME_LIMIT_EXCEEDED'));
                            })
                            .catch((reason) => {
                                console.log(
                                    `stopping container aborted because ${reason}`,
                                );
                            });
                }, 10000);
            });

            const raceResult = (await Promise.race([
                timeoutPromise,
                this.containersService.awaitContainer(containerId),
            ])) as { StatusCode: number };

            if (raceResult?.StatusCode !== 0)
                throw new Error(
                    `Something went wrong in the container: Exit code ${raceResult?.StatusCode}`,
                );

            // If everything is OK signaling that job is done
            if (successFlag) {
                this.eventEmitter.emit('jobDone', {
                    job: job.id,
                    submissionId: job.data.submissionId,
                    userId: job.data.userId,
                });
                return metrics;
            }

            // If we are here then the solution is wrong
            throw new Error('WRONG_ANSWER');
        } catch (err) {
            console.log('catched error', err);
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
        await this.submissionsService.update(submissionId, {
            status: status_codes.ACCEPTED,
        });

        console.log(`job ${job.id} is done!!!`);
    }

    @OnWorkerEvent('failed')
    async onFailed(job: Job) {
        const submissionId = parseInt(job.id?.split('-')[1] ?? '0');
        await this.submissionsService.update(submissionId, {
            status:
                status_codes[job.failedReason as status_codes] ||
                status_codes.WRONG_ANSWER,
        });
        // console.log('failed reason', job.failedReason, 'failed reason');

        console.log(`job ${job.id} was unlucky`);
    }
}
