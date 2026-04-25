import {
    // ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    // IsNotEmpty,
    IsNotEmptyObject,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested,
} from 'class-validator';
import { task_difficulties } from 'generated/prisma/enums';
// import { CreateTestCaseDto } from '../../test-cases/dto/create-test-case.dto';
import { Type } from 'class-transformer';
import { CreateTaskIODto } from './create-task-IO.dto';

export class CreateTaskDto {
    @IsString()
    title!: string;

    @IsString()
    description!: string;

    @IsEnum(task_difficulties)
    difficulty!: task_difficulties;

    // @IsArray()
    // @ArrayMinSize(1, { message: 'Task must have at least one test case' })
    // @IsNotEmpty()
    // @ValidateNested({ each: true })
    // @Type(() => CreateTestCaseDto)
    // testCases!: CreateTestCaseDto[];

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
