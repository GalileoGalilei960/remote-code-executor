import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(PrismaService.name);

    constructor(private configService: ConfigService) {
        const adapter = new PrismaPg({
            connectionString: configService.get<string>('DATABASE_URL'),
        });

        super({ adapter });
    }

    async onModuleInit() {
        try {
            const startTime = performance.now();
            await this.$connect();
            await this.$executeRawUnsafe('SELECT 1');

            const stopTime = performance.now();
            const duration = Math.round(stopTime - startTime);

            this.logger.log(`Database connected \x1b[33m+${duration}ms\x1b[0m`);
        } catch (e) {
            this.logger.error('DATABASE CONNECTION FAILED');
            console.log(e);

            process.exit(1);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
