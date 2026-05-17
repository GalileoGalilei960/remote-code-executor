import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';

export function ApiCreateSubmission() {
    return applyDecorators(
        ApiOperation({
            summary: 'Create Code Submission',
            description:
                'Create a new code submission for a task. Requires authentication.',
        }),
        ApiResponse({
            status: 201,
            description: 'Submission created successfully',
            schema: {
                example: {
                    id: 1,
                    code: 'console.log("Hello");',
                    language: 'JavaScript',
                    taskId: 1,
                    userId: 1,
                    createdAt: '2024-01-01T00:00:00Z',
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Validation error',
        }),
    );
}

export function ApiGetAllSubmissions() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get All Submissions',
            description:
                'Retrieve all code submissions. Requires authentication.',
        }),
        ApiResponse({
            status: 200,
            description: 'Submissions retrieved successfully',
            isArray: true,
            schema: {
                example: [
                    {
                        id: 1,
                        code: 'console.log("Hello");',
                        language: 'JavaScript',
                        taskId: 1,
                        userId: 1,
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
            },
        }),
    );
}

export function ApiGetSubmissionById() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get Submission by ID',
            description: 'Retrieve a specific code submission by ID',
        }),
        ApiParam({
            name: 'id',
            description: 'Submission ID',
            type: Number,
        }),
        ApiResponse({
            status: 200,
            description: 'Submission found and returned',
        }),
        ApiResponse({
            status: 404,
            description: 'Submission not found',
        }),
    );
}

export function ApiUpdateSubmission() {
    return applyDecorators(
        ApiOperation({
            summary: 'Update Submission',
            description:
                'Update a code submission. Requires authentication.',
        }),
        ApiParam({
            name: 'id',
            description: 'Submission ID',
            type: Number,
        }),
        ApiResponse({
            status: 200,
            description: 'Submission updated successfully',
        }),
        ApiResponse({
            status: 404,
            description: 'Submission not found',
        }),
    );
}

export function ApiDeleteSubmission() {
    return applyDecorators(
        ApiOperation({
            summary: 'Delete Submission',
            description:
                'Delete a code submission. Requires authentication.',
        }),
        ApiParam({
            name: 'id',
            description: 'Submission ID',
            type: Number,
        }),
        ApiResponse({
            status: 200,
            description: 'Submission deleted successfully',
        }),
        ApiResponse({
            status: 404,
            description: 'Submission not found',
        }),
    );
}
