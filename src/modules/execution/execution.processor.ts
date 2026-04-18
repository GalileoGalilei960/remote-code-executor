import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExecutionJobData } from './execution.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { status_codes } from 'generated/prisma/enums';
import EventEmitter2 from 'eventemitter2';
import { ContainersService } from '../containers/containers.service';
import { Subscription } from 'rxjs';

@Injectable()
@Processor('execution', { concurrency: 5 })
export class ExecutionProcessor extends WorkerHost {
    constructor(
        private submissionsService: SubmissionsService,
        private containersService: ContainersService,
        private eventEmitter: EventEmitter2,
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

        try {
            // Creating container
            containerId = await this.containersService.createContainer(
                job.data.code,
            );

            // Receiving logs from continer and sending them to the socket
            const [replayError, replayOutput] =
                await this.containersService.getContainerLogs(containerId);

            replayErrorSubscription = replayError.subscribe((log: string) => {
                this.eventEmitter.emit('log', { log, userId: job.data.userId });
            });
            replayOutputSubscription = replayOutput.subscribe((log: string) => {
                this.eventEmitter.emit('log', { log, userId: job.data.userId });
            });

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

            const containerInspection =
                await this.containersService.getContainerInspection(
                    containerId,
                );
            const containerStats =
                await this.containersService.getContainerStats(containerId);

            const containerExecutionTime =
                new Date(containerInspection.State.FinishedAt).getTime() -
                new Date(containerInspection.State.StartedAt).getTime();
            const maxConsumedMemoryMB =
                containerStats.memory_stats?.max_usage / 1024 / 1024;

            this.eventEmitter // If everything is OK signaling that job is done
                .emit('jobDone', {
                    job: job.id,
                    submissionId: job.data.submissionId,
                    userId: job.data.userId,
                    executionTime: containerExecutionTime,
                    maxMemory: maxConsumedMemoryMB,
                });

            return {
                executionTime: containerExecutionTime,
                maxMemory: maxConsumedMemoryMB,
            };
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
            time: job.returnvalue?.executionTime as number,
            memoryUsed: job.returnvalue?.maxMemory as number,
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
