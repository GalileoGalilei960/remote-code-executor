import { IsEnum, IsString } from 'class-validator';
import { IsTypeMatch } from 'src/common/decorators/is-type-match.decorator';

export enum ParamTypes {
    INT = 'INT',
    FLOAT = 'FLOAT',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    INT_ARRAY = 'INT_ARRAY',
    FLOAT_ARRAY = 'FLOAT_ARRAY',
    STRING_ARRAY = 'STRING_ARRAY',
    BOOLEAN_ARRAY = 'BOOLEAN_ARRAY',
}

export class CreateTestCaseIODto {
    @IsString()
    name: string;

    @IsEnum(ParamTypes)
    type: ParamTypes;

    @IsString()
    @IsTypeMatch()
    value: string;
}
