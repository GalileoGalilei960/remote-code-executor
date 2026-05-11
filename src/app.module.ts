import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { TasksModule } from './modules/tasks/tasks.module';
import { TestCasesModule } from './modules/test-cases/test-cases.module';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionModule } from './modules/execution/execution.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ContainersModule } from './modules/containers/containers.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from './modules/sessions/sessions.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
            isGlobal: true,
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.getOrThrow<string>('REDIS_HOST'),
                    port: Number(
                        configService.getOrThrow<string>('REDIS_PORT'),
                    ),
                },
            }),
        }),
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return {
                    secret: configService.getOrThrow<string>(
                        'JWT_ACCESS_SECRET',
                    ),
                };
            },
        }),
        PrismaModule,
        UsersModule,
        TasksModule,
        TestCasesModule,
        ExecutionModule,
        SubmissionsModule,
        EventEmitterModule.forRoot(),
        ContainersModule,
        AuthModule,
        SessionsModule,
    ],
    providers: [
        { provide: APP_FILTER, useClass: PrismaClientExceptionFilter },
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({ whitelist: true }),
        },
    ],
})
export class AppModule {}
