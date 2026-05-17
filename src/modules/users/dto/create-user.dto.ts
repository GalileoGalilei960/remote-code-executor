import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({
        description: 'Unique username for the account',
        example: 'john_doe',
        minLength: 1,
    })
    @IsString()
    username!: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john@example.com',
        format: 'email',
    })
    @IsEmail()
    @IsString()
    email!: string;

    @ApiProperty({
        description: 'Account password (minimum 8 characters)',
        example: 'SecurePassword123',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    password!: string;
}
