import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { TasksModule } from './modules/tasks/tasks.module';
import { TestCasesModule } from './modules/test-cases/test-cases.module';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionModule } from './modules/execution/execution.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
        BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
        PrismaModule,
        UsersModule,
        TasksModule,
        TestCasesModule,
        ExecutionModule,
        SubmissionsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        { provide: APP_FILTER, useClass: PrismaClientExceptionFilter },
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({ whitelist: true }),
        },
    ],
})
export class AppModule {}
