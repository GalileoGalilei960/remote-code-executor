import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionProcessor } from './execution.processor';
import { SubmissionsModule } from '../submissions/submissions.module';
import { ExecutionGateway } from './execution.gateway';
import { ContainersModule } from '../containers/containers.module';

@Module({
    imports: [
        BullModule.registerQueue({ name: 'execution' }),
        SubmissionsModule,
        ContainersModule,
    ],
    controllers: [ExecutionController],
    providers: [ExecutionService, ExecutionProcessor, ExecutionGateway],
})
export class ExecutionModule {}
