import {
    Controller,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Get,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TestCasesService } from './test-cases.service';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { AccessTokenGuard } from '../auth/guards/auth.guard';
import {
    ApiGetTestCaseById,
    ApiUpdateTestCase,
    ApiDeleteTestCase,
} from './test-cases.swagger';

@ApiTags('Test Cases')
@Controller('test-cases')
export class TestCasesController {
    constructor(private readonly testCasesService: TestCasesService) {}

    @ApiGetTestCaseById()
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.testCasesService.findOne(id);
    }

    @ApiUpdateTestCase()
    @UseGuards(AccessTokenGuard)
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTestCaseDto: UpdateTestCaseDto,
    ) {
        return this.testCasesService.update(id, updateTestCaseDto);
    }

    @ApiDeleteTestCase()
    @UseGuards(AccessTokenGuard)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.testCasesService.remove(id);
    }
}
