import { PartialType } from '@nestjs/mapped-types';
import { CreateSubmissionDto } from './create-submission.dto';
import { status_codes } from 'generated/prisma/enums';
import { IsEnum } from 'class-validator';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
    @IsEnum(status_codes)
    status!: status_codes;
}
