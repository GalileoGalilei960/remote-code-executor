import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { languages } from 'generated/prisma/enums';

export interface ExecutionJobData {
    code: string;
    language: languages;
    submissionId: number;
    userId: number;
}

@Injectable()
export class ExecutionService {
    constructor(
        @InjectQueue('execution')
        private executionQueue: Queue<ExecutionJobData>,
    ) {}
    async createJob(
        code: string,
        language: languages,
        submissionId: number,
        userId: number,
    ) {
        const job = await this.executionQueue.add(
            'executionJob',
            {
                code,
                language,
                submissionId,
                userId,
            },
            {
                jobId: `submission-${submissionId}`,
                removeOnComplete: true,
                removeOnFail: { age: 24 * 3600, count: 1000 },
            },
        );

        return job;
    }
}
