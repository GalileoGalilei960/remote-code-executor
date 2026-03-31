import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTestCaseDto } from './create-test-case.dto';
import { UpdateTestCaseIODto } from './update-test-case-IO.dto';

export class UpdateTestCaseDto extends PartialType(
    OmitType(CreateTestCaseDto, ['input', 'expectedOutput']),
) {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateTestCaseIODto)
    input: UpdateTestCaseIODto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateTestCaseIODto)
    expectedOutput: UpdateTestCaseIODto;
}
