import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { ExecuteCodeDto } from './dto/execute-code.dto';

@Controller('execution')
export class ExecutionController {
    constructor(
        private readonly executionService: ExecutionService,
        private readonly submissionsService: SubmissionsService,
    ) {}

    //TODO implement getCurrentUser decorator
    @HttpCode(HttpStatus.ACCEPTED)
    @Post(':taskId/:userId')
    async executeCode(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Body() executeCodeDto: ExecuteCodeDto,
    ) {
        const { code, language } = executeCodeDto;
        const { id: submissionId } = await this.submissionsService.create({
            code,
            language,
            taskId,
            userId,
        });

        const job = await this.executionService.createJob(
            code,
            language,
            submissionId,
        );

        return job.data;
    }
}
