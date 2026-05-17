import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';

export function ApiCreateTask() {
    return applyDecorators(
        ApiOperation({
            summary: 'Create a New Task',
            description:
                'Create a new coding task/challenge. Requires authentication.',
        }),
        ApiResponse({ status: 201, description: 'Task created successfully' }),
        ApiResponse({ status: 400, description: 'Validation error' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiBearerAuth('access-token'),
    );
}

export function ApiGetAllTasks() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get All Tasks',
            description: 'Retrieve a list of all available coding tasks',
        }),
        ApiResponse({
            status: 200,
            description: 'Tasks retrieved successfully',
            isArray: true,
        }),
    );
}

export function ApiGetTaskById() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get Task by ID',
            description: 'Retrieve detailed information about a specific task',
        }),
        ApiParam({ name: 'taskId', description: 'Task ID', type: Number }),
        ApiResponse({ status: 200, description: 'Task found and returned' }),
        ApiResponse({ status: 404, description: 'Task not found' }),
    );
}

export function ApiUpdateTask() {
    return applyDecorators(
        ApiOperation({
            summary: 'Update Task',
            description:
                'Update an existing task details. Requires authentication.',
        }),
        ApiParam({ name: 'taskId', description: 'Task ID', type: Number }),
        ApiResponse({ status: 200, description: 'Task updated successfully' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiResponse({ status: 404, description: 'Task not found' }),
        ApiBearerAuth('access-token'),
    );
}

export function ApiDeleteTask() {
    return applyDecorators(
        ApiOperation({
            summary: 'Delete Task',
            description:
                'Delete a task and all associated test cases. Requires authentication.',
        }),
        ApiParam({ name: 'taskId', description: 'Task ID', type: Number }),
        ApiResponse({ status: 200, description: 'Task deleted successfully' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiResponse({ status: 404, description: 'Task not found' }),
        ApiBearerAuth('access-token'),
    );
}

export function ApiGetTaskTestCases() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get Task Test Cases',
            description:
                'Retrieve all test cases associated with a specific task',
        }),
        ApiParam({ name: 'taskId', description: 'Task ID', type: Number }),
        ApiResponse({
            status: 200,
            description: 'Test cases retrieved successfully',
            isArray: true,
        }),
        ApiResponse({ status: 404, description: 'Task not found' }),
    );
}

export function ApiCreateTaskTestCase() {
    return applyDecorators(
        ApiOperation({
            summary: 'Create Test Case for Task',
            description: 'Create a new test case for a specific task',
        }),
        ApiParam({ name: 'taskId', description: 'Task ID', type: Number }),
        ApiResponse({
            status: 201,
            description: 'Test case created successfully',
        }),
        ApiResponse({ status: 400, description: 'Validation error' }),
        ApiResponse({ status: 404, description: 'Task not found' }),
    );
}
