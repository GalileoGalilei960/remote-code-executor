import { Module } from '@nestjs/common';
import { TestCasesService } from './test-cases.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TestCasesController } from './test-cases.controller';

@Module({
    imports: [PrismaModule],
    providers: [TestCasesService],
    controllers: [TestCasesController],
    exports: [TestCasesService],
})
export class TestCasesModule {}
