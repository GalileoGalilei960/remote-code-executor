import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';

export function ApiCreateUser() {
    return applyDecorators(
        ApiOperation({
            summary: 'Create New User',
            description:
                'Create a new user account (typically used via signup)',
        }),
        ApiResponse({ status: 201, description: 'User created successfully' }),
        ApiResponse({ status: 400, description: 'Validation error' }),
    );
}

export function ApiGetAllUsers() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get All Users',
            description: 'Retrieve a list of all users in the system',
        }),
        ApiResponse({
            status: 200,
            description: 'Users retrieved successfully',
            isArray: true,
        }),
    );
}

export function ApiGetUserById() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get User by ID',
            description: 'Retrieve a specific user by their ID',
        }),
        ApiParam({ name: 'id', description: 'User ID', type: Number }),
        ApiResponse({ status: 200, description: 'User found and returned' }),
        ApiResponse({ status: 404, description: 'User not found' }),
    );
}

export function ApiUpdateUser() {
    return applyDecorators(
        ApiOperation({
            summary: 'Update User',
            description:
                'Update user information. Only the authenticated user can update their own profile.',
        }),
        ApiParam({ name: 'id', description: 'User ID', type: Number }),
        ApiResponse({ status: 200, description: 'User updated successfully' }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - can only update own profile',
        }),
        ApiResponse({ status: 404, description: 'User not found' }),
        ApiBearerAuth('access-token'),
    );
}

export function ApiDeleteUser() {
    return applyDecorators(
        ApiOperation({
            summary: 'Delete User',
            description:
                'Delete a user account. Only the authenticated user can delete their own account.',
        }),
        ApiParam({ name: 'id', description: 'User ID', type: Number }),
        ApiResponse({ status: 200, description: 'User deleted successfully' }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - can only delete own account',
        }),
        ApiResponse({ status: 404, description: 'User not found' }),
        ApiBearerAuth('access-token'),
    );
}
