import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { task_difficulties } from 'generated/prisma/enums';
import { CreateTestCaseDto } from './create-testCase.dto';
import { Type } from 'class-transformer';

export class CreateTaskDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsEnum(task_difficulties)
    difficulty: task_difficulties;

    @ValidateNested({ each: true })
    @Type(() => CreateTestCaseDto)
    testCases: CreateTestCaseDto[];
}
