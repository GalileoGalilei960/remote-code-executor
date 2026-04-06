import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionProcessor } from './execution.processor';
import { SubmissionsModule } from '../submissions/submissions.module';

@Module({
    imports: [
        BullModule.registerQueue({ name: 'execution' }),
        SubmissionsModule,
    ],
    controllers: [ExecutionController],
    providers: [ExecutionService, ExecutionProcessor],
})
export class ExecutionModule {}
