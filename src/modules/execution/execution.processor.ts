import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExecutionJobData } from './execution.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { status_codes } from 'generated/prisma/enums';

@Injectable()
@Processor('execution')
export class ExecutionProcessor extends WorkerHost {
    constructor(private submissionsService: SubmissionsService) {
        super();
    }

    async process(job: Job<ExecutionJobData>) {
        console.log(`job ${job.id} is being done!`);

        const rand = Math.random();

        if (rand > 0.5) throw new Error('you are unlucky');

        await Promise.resolve();
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
            status: status_codes.WRONG_ANSWER,
        });
        console.log(`job ${job.id} was unlucky`);
    }
}
