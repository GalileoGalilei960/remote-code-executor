import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExecutionService } from './execution.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { AccessTokenGuard } from '../auth/guards/auth.guard';
import { ApiExecuteCode } from './execution.swagger';
import type { Request } from 'express';

@ApiTags('Execution')
@Controller('execution')
export class ExecutionController {
    constructor(
        private readonly executionService: ExecutionService,
        private readonly submissionsService: SubmissionsService,
    ) {}

    @ApiExecuteCode()
    @UseGuards(AccessTokenGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    @Post(':taskId')
    async executeCode(
        @Param('taskId', ParseIntPipe) taskId: number,
        @Req() req: Request,
        @Body() executeCodeDto: ExecuteCodeDto,
    ) {
        const userId = req.user?.sub;

        if (!userId) throw new BadRequestException('Invalid Access Token');

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
            userId,
        );

        return job.data;
    }
}
