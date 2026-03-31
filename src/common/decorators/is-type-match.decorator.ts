import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { CreateTestCaseIODto } from 'src/modules/test-cases/dto/create-test-case-IO.dto';
import * as z from 'zod';

export const typeMatchMap = {
    INT: (value: string): boolean => {
        try {
            z.coerce.number().int().parse(JSON.parse(value));
            return true;
        } catch {
            return false;
        }
    },
    FLOAT: (value: string): boolean => {
        try {
            z.coerce.number().parse(JSON.parse(value));
            return true;
        } catch {
            return false;
        }
    },
    STRING: (value: string): boolean => {
        try {
            z.string().parse(JSON.parse(value));
            return true;
        } catch {
            return false;
        }
    },
    BOOLEAN: (value: string): boolean => {
        try {
            z.boolean().parse(JSON.parse(value));
            return true;
        } catch {
            return false;
        }
    },
    INT_ARRAY: (value: string): boolean => {
        try {
            z.array(z.coerce.number().int()).parse(JSON.parse(value));
            return true;
        } catch {
            return false;
        }
    },
    FLOAT_ARRAY: (value: string): boolean => {
        try {
            z.array(z.coerce.number()).parse(JSON.parse(value));
            return true;
        } catch {
            return false;
        }
    },
    STRING_ARRAY: (value: string): boolean => {
        try {
            z.array(z.string()).parse(JSON.parse(value));
            return true;
        } catch {
            return false;
        }
    },
    BOOLEAN_ARRAY: (value: string): boolean => {
        try {
            z.array(z.boolean()).parse(JSON.parse(value));
            return true;
        } catch {
            return false;
        }
    },
};

@ValidatorConstraint({ name: 'IsTypeMatch', async: false })
export class IsTypeMatchConstrain implements ValidatorConstraintInterface {
    validate(
        value: string,
        validationArguments?: ValidationArguments,
    ): boolean {
        try {
            const object = validationArguments?.object as CreateTestCaseIODto;

            if (!typeMatchMap[object.type]) return false;

            const stringifiedValue =
                typeof value === 'string' ? value : JSON.stringify(value);

            const typeMatchFunc = typeMatchMap[object.type];
            return typeMatchFunc(stringifiedValue);
        } catch {
            return false;
        }
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        const object = validationArguments?.object as CreateTestCaseIODto;
        const expectedType = object?.type || 'unknown';

        return `The value does not match the expected type: ${expectedType}`;
    }
}

export function IsTypeMatch(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            validator: IsTypeMatchConstrain,
            options: validationOptions,
        });
    };
}
