import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmptyObject,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested,
} from 'class-validator';
import { task_difficulties } from 'generated/prisma/enums';
import { Type } from 'class-transformer';
import { CreateTaskIODto } from './create-task-IO.dto';

export class CreateTaskDto {
    @IsString()
    title!: string;

    @IsString()
    description!: string;

    @IsEnum(task_difficulties)
    difficulty!: task_difficulties;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    timeLimit!: number;

    @IsInt()
    @IsPositive()
    memoryLimit!: number;

    @IsBoolean()
    @IsOptional()
    isPublished!: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTaskIODto)
    inputType!: CreateTaskIODto[];

    @IsNotEmptyObject()
    @ValidateNested({ each: true })
    @Type(() => CreateTaskIODto)
    expectedOutputType!: CreateTaskIODto;
}
