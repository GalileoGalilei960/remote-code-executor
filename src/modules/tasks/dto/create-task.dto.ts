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
import { ApiProperty } from '@nestjs/swagger';
import { CreateTaskIODto } from './create-task-IO.dto';

export class CreateTaskDto {
    @ApiProperty({
        description: 'Title of the coding task',
        example: 'Two Sum Problem',
    })
    @IsString()
    title!: string;

    @ApiProperty({
        description: 'Detailed description of what the task requires',
        example:
            'Given an array of integers, find two numbers that add up to a target sum.',
    })
    @IsString()
    description!: string;

    @ApiProperty({
        description: 'Difficulty level of the task',
        enum: task_difficulties,
        example: 'Easy',
    })
    @IsEnum(task_difficulties)
    difficulty!: task_difficulties;

    @ApiProperty({
        description: 'Time limit for execution in seconds',
        example: 5,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    timeLimit!: number;

    @ApiProperty({
        description: 'Memory limit in MB',
        example: 256,
    })
    @IsInt()
    @IsPositive()
    memoryLimit!: number;

    @ApiProperty({
        description: 'Whether the task is published and visible to users',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isPublished!: boolean;

    @ApiProperty({
        description: 'Input type definitions for the task',
        type: [CreateTaskIODto],
        example: [{ name: 'numbers', type: 'INT_ARRAY' }],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTaskIODto)
    inputType!: CreateTaskIODto[];

    @ApiProperty({
        description: 'Expected output type for the task',
        type: CreateTaskIODto,
        example: { name: 'result', type: 'INT' },
    })
    @IsNotEmptyObject()
    @ValidateNested({ each: true })
    @Type(() => CreateTaskIODto)
    expectedOutputType!: CreateTaskIODto;
}
