import { ValidateIf } from 'class-validator';
import { CreateTestCaseIODto, ParamTypes } from './create-test-case-IO.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateTestCaseIODto extends PartialType(CreateTestCaseIODto) {
    @ValidateIf((o: UpdateTestCaseIODto) => o.value !== undefined, {
        message: 'Type must be provided along with value',
    })
    type: ParamTypes;

    @ValidateIf((o: UpdateTestCaseIODto) => o.type !== undefined, {
        message: 'Value must be provided along with type',
    })
    value: string;
}
