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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { AccessTokenGuard } from '../auth/guards/auth.guard';
import {
    ApiCreateSubmission,
    ApiGetAllSubmissions,
    ApiGetSubmissionById,
    ApiUpdateSubmission,
    ApiDeleteSubmission,
} from './submissions.swagger';

@ApiTags('Submissions')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth('access-token')
@Controller('submissions')
export class SubmissionsController {
    constructor(private readonly submissionsService: SubmissionsService) {}

    @ApiCreateSubmission()
    @Post()
    create(@Body() createSubmissionDto: CreateSubmissionDto) {
        return this.submissionsService.create(createSubmissionDto);
    }

    @ApiGetAllSubmissions()
    @Get()
    findAll() {
        return this.submissionsService.findAll();
    }

    @ApiGetSubmissionById()
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.submissionsService.findOne(id);
    }

    @ApiUpdateSubmission()
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSubmissionDto: UpdateSubmissionDto,
    ) {
        return this.submissionsService.update(id, updateSubmissionDto);
    }

    @ApiDeleteSubmission()
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.submissionsService.remove(id);
    }
}
