import { ParamTypes } from '@/common/types/param.types';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskIODto {
    @ApiProperty({
        description: 'Parameter name for input/output',
        example: 'userAge',
    })
    @IsString()
    name!: string;

    @ApiProperty({
        description: 'Data type of the parameter',
        enum: ParamTypes,
        example: 'INT',
    })
    @IsEnum(ParamTypes)
    type!: ParamTypes;
}
