import { IsBoolean, ValidateNested } from 'class-validator';
import { CreateTestCaseIODto } from './create-testCase-IO.dto';
import { Type } from 'class-transformer';

export class CreateTestCaseDto {
    @IsBoolean()
    isSample: boolean;

    @ValidateNested({ each: true })
    @Type(() => CreateTestCaseIODto)
    input: CreateTestCaseIODto[];

    @Type(() => CreateTestCaseIODto)
    expectedOutput: CreateTestCaseIODto;
}
