import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
    providers: [SessionsService],
    imports: [PrismaModule],
    exports: [SessionsService],
})
export class SessionsModule {}
