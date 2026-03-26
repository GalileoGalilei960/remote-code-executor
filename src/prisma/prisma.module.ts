import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply();
    }
}
