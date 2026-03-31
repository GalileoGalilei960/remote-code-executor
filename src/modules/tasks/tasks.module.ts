import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TestCasesModule } from '../test-cases/test-cases.module';

@Module({
    imports: [PrismaModule, TestCasesModule],
    controllers: [TasksController],
    providers: [TasksService],
})
export class TasksModule {}
