import { IsEnum, IsString } from 'class-validator';
import { languages } from 'generated/prisma/enums';

export class ExecuteCodeDto {
    @IsString()
    code!: string;

    @IsEnum(languages)
    language!: languages;
}
