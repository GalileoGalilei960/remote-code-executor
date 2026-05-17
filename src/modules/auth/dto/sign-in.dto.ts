import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john@example.com',
        format: 'email',
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        description: 'User account password',
        example: 'SecurePassword123',
    })
    @IsString()
    password!: string;
}
