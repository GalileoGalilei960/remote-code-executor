import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { languages } from 'generated/prisma/enums';

export class ExecuteCodeDto {
    @ApiProperty({
        description: 'Source code to execute',
        example: `function sum(a, b) { return a + b; }\nconsole.log(sum(2, 3));`,
    })
    @IsString()
    code!: string;

    @ApiProperty({
        description: 'Programming language of the code',
        enum: languages,
        example: 'JavaScript',
    })
    @IsEnum(languages)
    language!: languages;
}
