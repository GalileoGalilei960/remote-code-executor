import { Module } from '@nestjs/common';
import { TestCasesService } from './test-cases.service';
import { TestCasesController } from './test-cases.controller';

@Module({
  controllers: [TestCasesController],
  providers: [TestCasesService],
})
export class TestCasesModule {}
