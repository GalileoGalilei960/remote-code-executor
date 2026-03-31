import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { task_difficulties } from 'generated/prisma/enums';

export class UpdateTaskDto {
    @IsOptional()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsEnum(task_difficulties)
    difficulty: task_difficulties;

    @IsOptional()
    @IsNumber()
    timeLimit: number;

    @IsOptional()
    @IsNumber()
    memoryLimit: number;

    @IsBoolean()
    @IsOptional()
    isPublished: boolean;
}
