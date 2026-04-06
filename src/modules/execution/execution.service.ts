import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { languages } from 'generated/prisma/enums';

export interface ExecutionJobData {
    code: string;
    language: languages;
}

@Injectable()
export class ExecutionService {
    constructor(
        @InjectQueue('execution')
        private executionQueue: Queue<ExecutionJobData>,
    ) {}
    async createJob(code: string, language: languages, submissionId: number) {
        const job = await this.executionQueue.add(
            'executionJob',
            {
                code,
                language,
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
