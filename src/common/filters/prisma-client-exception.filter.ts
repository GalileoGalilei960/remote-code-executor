import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { Prisma } from 'generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
    catch(
        exception: Prisma.PrismaClientKnownRequestError,
        host: ArgumentsHost,
    ): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        switch (exception.code) {
            case 'P2002': {
                const status = HttpStatus.CONFLICT;
                response.status(status).json({
                    status,
                    message: `Duplication field value:${String(exception.meta?.target)}`,
                    error: 'Conflict',
                });
                break;
            }
            case 'P2025': {
                const status = HttpStatus.NOT_FOUND;
                response.status(status).json({
                    statusCode: status,
                    message: exception.meta?.cause || 'Record not found',
                    error: 'Not Found',
                });
                break;
            }
            case 'P2003': {
                const status = HttpStatus.BAD_REQUEST;
                response.status(status).json({
                    statusCode: status,
                    message: 'Foreign key constraint failed',
                    error: 'Bad Request',
                });
                break;
            }
            default: {
                const status = HttpStatus.INTERNAL_SERVER_ERROR;
                response.status(status).json({
                    status,
                    message: 'Database problems',
                    error: 'Prisma error',
                    exceptionCode: exception.code,
                });
            }
        }
    }
}
