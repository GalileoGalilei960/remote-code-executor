import { IsEnum, IsNumber, IsString } from 'class-validator';
import { languages } from 'generated/prisma/enums';

export class CreateSubmissionDto {
    @IsString()
    code!: string;

    @IsEnum(languages)
    language!: languages;

    @IsNumber()
    userId!: number;

    @IsNumber()
    taskId!: number;
}
