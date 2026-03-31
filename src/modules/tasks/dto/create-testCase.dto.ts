import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNotEmptyObject,
    ValidateNested,
} from 'class-validator';
import { CreateTestCaseIODto } from './create-testCase-IO.dto';
import { Type } from 'class-transformer';

export class CreateTestCaseDto {
    @IsBoolean()
    isSample: boolean;

    @IsArray()
    @ArrayMinSize(1, {
        message: 'Test case must have at least one input parameter',
    })
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateTestCaseIODto)
    input: CreateTestCaseIODto[];

    @IsNotEmpty({ message: 'Test case must have expected output' })
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => CreateTestCaseIODto)
    expectedOutput: CreateTestCaseIODto;
}
