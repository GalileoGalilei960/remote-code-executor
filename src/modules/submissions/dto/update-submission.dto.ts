import { PartialType } from '@nestjs/mapped-types';
import { CreateSubmissionDto } from './create-submission.dto';
import { status_codes } from 'generated/prisma/enums';
import {
    IsEnum,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
    @IsOptional()
    @IsEnum(status_codes)
    status?: status_codes;

    @IsOptional()
    @IsNumber()
    time?: number;

    @IsOptional()
    @IsNumber()
    memoryUsed?: number;

    @IsOptional()
    @IsString()
    logs?: string;

    @IsOptional()
    @IsString()
    errorMessage?: string;

    @IsOptional()
    @IsObject()
    result?: object;
}
