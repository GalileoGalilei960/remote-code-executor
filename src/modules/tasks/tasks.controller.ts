import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTestCaseDto } from '../test-cases/dto/create-test-case.dto';
import { TestCasesService } from '../test-cases/test-cases.service';
import { UpdateTestCaseDto } from '../test-cases/dto/update-test-case.dto';

@Controller('tasks')
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
        private readonly testCasesService: TestCasesService,
    ) {}

    @Post()
    create(@Body() createTaskDto: CreateTaskDto) {
        return this.tasksService.create(createTaskDto);
    }

    @Post(':taskId/test-cases')
    createTestCase(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body() createTestCaseDto: CreateTestCaseDto,
    ) {
        return this.testCasesService.create(taskId, createTestCaseDto);
    }

    @Get()
    findAll() {
        return this.tasksService.findAll();
    }

    @Get(':taskId')
    findOne(@Param('taskId', ParseIntPipe) taskId: number) {
        return this.tasksService.findOne(taskId);
    }

    @Get(':taskId/test-cases')
    getAllTestCases(@Param('taskId', ParseIntPipe) taskId: number) {
        return this.testCasesService.findAllForTask(taskId);
    }

    @Patch(':taskId')
    update(@Param('taskId') id: number, @Body() updateTaskDto: UpdateTaskDto) {
        return this.tasksService.update(id, updateTaskDto);
    }

    @Patch('test-cases/:testCaseId')
    updateTestCases(
        @Param('testCaseId', ParseIntPipe) testCaseId: number,
        @Body() updateTestCase: UpdateTestCaseDto,
    ) {
        return this.testCasesService.update(testCaseId, updateTestCase);
    }

    @Delete(':taskId')
    remove(@Param('taskId') taskId: number) {
        return this.tasksService.remove(taskId);
    }

    @Delete('test-cases/:testCaseId')
    removeTestCase(@Param('testCaseId', ParseIntPipe) testCaseId: number) {
        return this.testCasesService.remove(testCaseId);
    }
}
