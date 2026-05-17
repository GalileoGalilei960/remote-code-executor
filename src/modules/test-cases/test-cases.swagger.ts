import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';

export function ApiGetTestCaseById() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get Test Case by ID',
            description: 'Retrieve a specific test case by its ID',
        }),
        ApiParam({
            name: 'id',
            description: 'Test Case ID',
            type: Number,
        }),
        ApiResponse({
            status: 200,
            description: 'Test case found and returned',
        }),
        ApiResponse({
            status: 404,
            description: 'Test case not found',
        }),
    );
}

export function ApiUpdateTestCase() {
    return applyDecorators(
        ApiOperation({
            summary: 'Update Test Case',
            description:
                'Update a test case for a task. Requires authentication.',
        }),
        ApiParam({
            name: 'id',
            description: 'Test Case ID',
            type: Number,
        }),
        ApiResponse({
            status: 200,
            description: 'Test case updated successfully',
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized',
        }),
        ApiResponse({
            status: 404,
            description: 'Test case not found',
        }),
        ApiBearerAuth('access-token'),
    );
}

export function ApiDeleteTestCase() {
    return applyDecorators(
        ApiOperation({
            summary: 'Delete Test Case',
            description: 'Delete a test case. Requires authentication.',
        }),
        ApiParam({
            name: 'id',
            description: 'Test Case ID',
            type: Number,
        }),
        ApiResponse({
            status: 200,
            description: 'Test case deleted successfully',
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized',
        }),
        ApiResponse({
            status: 404,
            description: 'Test case not found',
        }),
        ApiBearerAuth('access-token'),
    );
}
