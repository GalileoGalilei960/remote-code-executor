import { ParamTypes } from '@/common/types/param.types';
import { IsEnum, IsString } from 'class-validator';

export class CreateTaskIODto {
    @IsString()
    name!: string;

    @IsEnum(ParamTypes)
    type!: ParamTypes;
}
