import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';

describe('ExecutionController(e2e)', () => {
    let app: INestApplication;
    let pgContainer: StartedPostgreSqlContainer;
    let redisContainer: StartedRedisContainer;

    beforeAll(async () => {
        pgContainer = await new PostgreSqlContainer(
            'postgres:18.1-alpine',
        ).start();
        redisContainer = await new RedisContainer('redis:alpine').start();

        process.env.DATABASE_URL = pgContainer.getConnectionUri();
        process.env.REDIS_HOST = redisContainer.getHost();
        process.env.REDIS_PORT = redisContainer.getPort().toString();

        execSync('pnpm dlx prisma db push', {
            env: process.env,
            stdio: 'inherit',
        });

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    }, 60000);

    afterAll(async () => {
        await app.close();
        await pgContainer.stop();
        await redisContainer.stop();
    });

    it('Should be defined', () => {
        expect(app).toBeDefined();
    });
});
