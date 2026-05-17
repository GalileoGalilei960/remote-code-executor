import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('Remote Code Executor API')
        .setDescription(
            'A comprehensive API for executing and managing code submissions with support for multiple programming languages, task management, and real-time execution monitoring.',
        )
        .setVersion('1.0.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter JWT access token',
            },
            'access-token',
        )
        .addCookieAuth('refreshToken', {
            type: 'apiKey',
            in: 'cookie',
            description:
                'Refresh token stored in HTTP-only cookie for session management',
        })
        .addTag(
            'Auth',
            'Authentication endpoints for user registration and login',
        )
        .addTag('Users', 'User management endpoints')
        .addTag('Tasks', 'Code task and challenge management')
        .addTag('Test Cases', 'Test case management for tasks')
        .addTag(
            'Execution',
            'Code execution and submission processing endpoints',
        )
        .addTag('Submissions', 'Code submission history and tracking')
        .addServer('http://localhost:3000', 'Development server')
        .addServer('http://164.92.249.66:3000', 'Production server')
        .setContact(
            'GalileoGalilei960',
            'https://github.com/GalileoGalilei960',
            'support@example.com',
        )
        .setLicense('UNLICENSED', 'https://example.com/license')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            displayOperationId: true,
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
        },
        customCss: `
            .swagger-ui .info .title { font-size: 32px; color: #1a202c; }
            .topbar { background-color: #2d3748; }
            .model-toggle:after { background-color: #4299e1; }
        `,
    });
}
