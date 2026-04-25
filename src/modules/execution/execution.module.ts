import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionProcessor } from './execution.processor';
import { SubmissionsModule } from '../submissions/submissions.module';
import { ExecutionGateway } from './execution.gateway';
import { ContainersModule } from '../containers/containers.module';
import { JavaScriptParser } from './code-parser/parsers/java-script.parser';
import { GetCodeParserFactory } from './code-parser/get-code-parser.factory';
import { TestCasesModule } from '../test-cases/test-cases.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
    imports: [
        BullModule.registerQueue({ name: 'execution' }),
        SubmissionsModule,
        ContainersModule,
        TestCasesModule,
        TasksModule,
    ],
    controllers: [ExecutionController],
    providers: [
        ExecutionService,
        ExecutionProcessor,
        ExecutionGateway,
        GetCodeParserFactory,
        JavaScriptParser,
    ],
})
export class ExecutionModule {}
