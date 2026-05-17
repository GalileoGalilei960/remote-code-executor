import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';

export function ApiExecuteCode() {
    return applyDecorators(
        ApiOperation({
            summary: 'Execute Code',
            description:
                'Submit and execute user code for a specific task. Returns a job ID for tracking execution status.',
        }),
        ApiParam({
            name: 'taskId',
            description: 'The ID of the task to execute code for',
            type: Number,
        }),
        ApiResponse({
            status: 202,
            description:
                'Code execution queued successfully. Returns job ID for status tracking.',
            schema: {
                example: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    data: {
                        output: null,
                        status: 'pending',
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Bad request - invalid code or language',
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - valid JWT token required',
        }),
        ApiResponse({
            status: 404,
            description: 'Task not found',
        }),
        ApiBearerAuth('access-token'),
    );
}
