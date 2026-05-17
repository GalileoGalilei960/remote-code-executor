import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { languages } from 'generated/prisma/enums';

export class CreateSubmissionDto {
    @ApiProperty({
        description: 'Source code of the submission',
        example: 'function hello() { console.log("Hello"); }',
    })
    @IsString()
    code!: string;

    @ApiProperty({
        description: 'Programming language used',
        enum: languages,
        example: 'JavaScript',
    })
    @IsEnum(languages)
    language!: languages;

    @ApiProperty({
        description: 'User ID who made the submission',
        example: 1,
    })
    @IsNumber()
    userId!: number;

    @ApiProperty({
        description: 'Task ID for this submission',
        example: 1,
    })
    @IsNumber()
    taskId!: number;
}
