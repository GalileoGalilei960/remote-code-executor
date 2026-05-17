import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiSignUp() {
    return applyDecorators(
        ApiOperation({
            summary: 'User Registration',
            description:
                'Register a new user account. Creates a new user and returns JWT access token with refresh token in cookie.',
        }),
        ApiResponse({
            status: 201,
            description:
                'User successfully registered. Access token returned, refresh token set in HTTP-only cookie.',
            schema: {
                example: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Bad request - validation failed',
            schema: {
                example: {
                    message: ['password must be at least 8 characters'],
                    error: 'Bad Request',
                    statusCode: 400,
                },
            },
        }),
        ApiResponse({
            status: 409,
            description: 'User with this email already exists',
        }),
    );
}

export function ApiSignIn() {
    return applyDecorators(
        ApiOperation({
            summary: 'User Login',
            description:
                'Authenticate user with email and password. Returns JWT access token and refresh token in cookie.',
        }),
        ApiResponse({
            status: 200,
            description:
                'Login successful. Access token returned, refresh token set in HTTP-only cookie.',
            schema: {
                example: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
            },
        }),
        ApiResponse({ status: 401, description: 'Invalid email or password' }),
    );
}

export function ApiSignOut() {
    return applyDecorators(
        ApiOperation({
            summary: 'User Logout',
            description:
                'Logout the current user. Invalidates the session and clears refresh token cookie.',
        }),
        ApiResponse({ status: 200, description: 'Logout successful' }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - no valid token provided',
        }),
    );
}

export function ApiRefreshToken() {
    return applyDecorators(
        ApiOperation({
            summary: 'Refresh Access Token',
            description:
                'Get a new access token using the refresh token from cookie.',
        }),
        ApiResponse({
            status: 200,
            description: 'New access token issued',
            schema: {
                example: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Invalid or expired refresh token',
        }),
    );
}
