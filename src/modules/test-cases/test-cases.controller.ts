import {
    Controller,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Get,
} from '@nestjs/common';
import { TestCasesService } from './test-cases.service';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';

@Controller('test-cases')
export class TestCasesController {
    constructor(private readonly testCasesService: TestCasesService) {}

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.testCasesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTestCaseDto: UpdateTestCaseDto,
    ) {
        return this.testCasesService.update(id, updateTestCaseDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.testCasesService.remove(id);
    }
}
