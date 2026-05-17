import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTestCaseDto } from '../test-cases/dto/create-test-case.dto';
import { TestCasesService } from '../test-cases/test-cases.service';
import { AccessTokenGuard } from '../auth/guards/auth.guard';
import {
    ApiCreateTask,
    ApiGetAllTasks,
    ApiGetTaskById,
    ApiUpdateTask,
    ApiDeleteTask,
    ApiGetTaskTestCases,
    ApiCreateTaskTestCase,
} from './tasks.swagger';
// import { UpdateTestCaseDto } from '../test-cases/dto/update-test-case.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
        private readonly testCasesService: TestCasesService,
    ) {}

    @ApiCreateTask()
    @UseGuards(AccessTokenGuard)
    @Post()
    create(@Body() createTaskDto: CreateTaskDto) {
        return this.tasksService.create(createTaskDto);
    }

    @ApiGetAllTasks()
    @Get()
    findAll() {
        return this.tasksService.findAll();
    }

    @ApiGetTaskById()
    @Get(':taskId')
    findOne(@Param('taskId', ParseIntPipe) taskId: number) {
        return this.tasksService.findOne(taskId);
    }

    @ApiUpdateTask()
    @UseGuards(AccessTokenGuard)
    @Patch(':taskId')
    update(@Param('taskId') id: number, @Body() updateTaskDto: UpdateTaskDto) {
        return this.tasksService.update(id, updateTaskDto);
    }

    @ApiDeleteTask()
    @UseGuards(AccessTokenGuard)
    @Delete(':taskId')
    remove(@Param('taskId') taskId: number) {
        return this.tasksService.remove(taskId);
    }

    @ApiGetTaskTestCases()
    @Get(':taskId/test-cases')
    getAllTestCases(@Param('taskId', ParseIntPipe) taskId: number) {
        return this.testCasesService.findAllForTask(taskId);
    }

    @ApiCreateTaskTestCase()
    @Post(':taskId/test-cases')
    createTestCase(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body() createTestCaseDto: CreateTestCaseDto,
    ) {
        return this.testCasesService.create(taskId, createTestCaseDto);
    }
}
