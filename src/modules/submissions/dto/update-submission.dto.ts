import { PartialType } from '@nestjs/mapped-types';
import { CreateSubmissionDto } from './create-submission.dto';
import { status_codes } from 'generated/prisma/enums';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
    @IsOptional()
    @IsEnum(status_codes)
    status!: status_codes;

    @IsOptional()
    @IsNumber()
    time?: number;

    @IsOptional()
    @IsNumber()
    memoryUsed?: number;
}
