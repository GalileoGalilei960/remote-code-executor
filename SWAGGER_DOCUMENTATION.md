# Swagger API Documentation Setup

## Overview

Complete Swagger/OpenAPI documentation has been implemented for the Remote Code Executor API. The documentation is automatically generated based on your NestJS controllers and decorators.

## Accessing the Documentation

- **Swagger UI**: Available at `http://localhost:3000/api`
- **OpenAPI JSON**: Available at `http://localhost:3000/api-json`

## Architecture

### Configuration File

The main Swagger configuration is in [src/config/swagger.config.ts](src/config/swagger.config.ts):

- Sets up the base documentation metadata
- Configures authentication schemes (JWT Bearer token)
- Defines API tags for grouping endpoints
- Customizes the Swagger UI appearance

### Controllers Documentation

All controllers have been annotated with Swagger decorators:

1. **[Auth Controller](src/modules/auth/auth.controller.ts)** - Authentication endpoints
    - `POST /auth/signup` - Register new user
    - `POST /auth/signin` - User login
    - `POST /auth/signout` - User logout
    - `POST /auth/refresh` - Refresh access token

2. **[Users Controller](src/modules/users/users.controller.ts)** - User management
    - `POST /users` - Create user
    - `GET /users` - Get all users
    - `GET /users/:id` - Get user by ID
    - `PATCH /users/:id` - Update user
    - `DELETE /users/:id` - Delete user

3. **[Tasks Controller](src/modules/tasks/tasks.controller.ts)** - Task management
    - `POST /tasks` - Create new task
    - `GET /tasks` - Get all tasks
    - `GET /tasks/:taskId` - Get task by ID
    - `PATCH /tasks/:taskId` - Update task
    - `DELETE /tasks/:taskId` - Delete task
    - `GET /tasks/:taskId/test-cases` - Get task's test cases

4. **[Execution Controller](src/modules/execution/execution.controller.ts)** - Code execution
    - `POST /execution/:taskId` - Execute code for a task

5. **[Submissions Controller](src/modules/submissions/submissions.controller.ts)** - Submission tracking
    - `POST /submissions` - Create submission
    - `GET /submissions` - Get all submissions
    - `GET /submissions/:id` - Get submission by ID
    - `PATCH /submissions/:id` - Update submission
    - `DELETE /submissions/:id` - Delete submission

6. **[Test Cases Controller](src/modules/test-cases/test-cases.controller.ts)** - Test case management
    - `GET /test-cases/:id` - Get test case by ID
    - `PATCH /test-cases/:id` - Update test case
    - `DELETE /test-cases/:id` - Delete test case

### DTOs Documentation

All Data Transfer Objects have been annotated with `@ApiProperty` decorators for better documentation:

- [CreateUserDto](src/modules/users/dto/create-user.dto.ts) - User registration data
- [SignInDto](src/modules/auth/dto/sign-in.dto.ts) - Login credentials
- [ExecuteCodeDto](src/modules/execution/dto/execute-code.dto.ts) - Code execution payload (supports: JavaScript, TypeScript, Python, C, C++, Ruby, Java, C#)
- [CreateTaskDto](src/modules/tasks/dto/create-task.dto.ts) - Task creation data (difficulties: Easy, Medium, Hard)
- [CreateTaskIODto](src/modules/tasks/dto/create-task-IO.dto.ts) - Task input/output type definitions
- [CreateSubmissionDto](src/modules/submissions/dto/create-submission.dto.ts) - Submission data

## Features

### Authentication

- **JWT Bearer Token**: For protected endpoints
- **Cookie-based Refresh Token**: HTTP-only cookies for secure token refresh
- All protected endpoints clearly marked with `@ApiBearerAuth('access-token')`

### Response Documentation

- Each endpoint includes documented response codes:
    - 2xx Success responses with examples
    - 4xx Client error responses
    - Clear descriptions of each response type

### Request/Response Examples

- All request bodies include example values
- Response schemas shown in the UI
- Parameter descriptions clearly defined

### API Tags

Endpoints grouped by functionality:

- Auth
- Users
- Tasks
- Test Cases
- Execution
- Submissions

## Using the Documentation

### Testing Endpoints

1. Open `http://localhost:3000/api` in your browser
2. Click on an endpoint to expand its details
3. For protected endpoints, click "Authorize" button and enter your JWT token
4. Click "Try it out" to test the endpoint
5. Enter request parameters and body
6. Click "Execute" to send the request

### Authentication Flow

1. Register a new user: `POST /auth/signup`
2. Receive JWT access token in response
3. Click "Authorize" and paste the token
4. Access protected endpoints with the token

### Features in Swagger UI

- **Persist Authorization**: Selected by default - token stays across requests
- **Operation IDs**: Displayed for easy reference
- **Model Expansion**: First level expanded for quick overview
- **Custom Styling**: Dark theme for better readability

## Development

### Adding New Endpoints

When creating new endpoints, follow this pattern:

```typescript
@ApiOperation({
  summary: 'Brief endpoint description',
  description: 'Longer description of what the endpoint does',
})
@ApiResponse({
  status: 200,
  description: 'Success response description',
})
@ApiResponse({
  status: 400,
  description: 'Error response description',
})
@ApiBearerAuth('access-token')  // if authentication required
@UseGuards(AccessTokenGuard)     // if authentication required
@Post('endpoint-name')
async methodName(@Body() dto: YourDto) {
  // implementation
}
```

### Adding Properties to DTOs

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class YourDto {
    @ApiProperty({
        description: 'Property description',
        example: 'example value',
        type: String,
        required: true,
    })
    @IsString()
    propertyName!: string;
}
```

## API Metadata

- **Title**: Remote Code Executor API
- **Version**: 1.0.0
- **Description**: A comprehensive API for executing and managing code submissions with support for multiple programming languages, task management, and real-time execution monitoring
- **Contact**: GalileoGalilei960
- **Servers**:
    - Development: http://localhost:3000
    - Production: https://api.example.com (configure as needed)

## Generated Files

The Swagger setup includes:

- [Swagger Configuration](src/config/swagger.config.ts) - Main configuration
- Modified controllers with `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators
- Enhanced DTOs with `@ApiProperty` decorators
- Updated [main.ts](src/main.ts) with Swagger initialization

## Troubleshooting

### Swagger UI Not Loading

1. Ensure the application is running: `pnpm start:dev`
2. Check that port 3000 is accessible
3. Clear browser cache and try again
4. Check browser console for errors

### Missing Response Examples

- Ensure DTOs have `@ApiProperty` decorators
- Verify NestJS Swagger package is installed: `npm list @nestjs/swagger`
- Restart the development server after changes

### Authorization Not Working

1. Generate a valid JWT token from signup/signin endpoint
2. Copy the full token (including "Bearer" prefix if needed)
3. Click "Authorize" in Swagger UI
4. Paste the token in the authorization modal
5. Try accessing a protected endpoint

## Resources

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

## Next Steps

1. Update server URLs in `swagger.config.ts` for production
2. Add examples for complex response types
3. Document any WebSocket endpoints if needed
4. Consider adding API versioning to the documentation
5. Set up API documentation deployment to API portal

---

**Last Updated**: May 17, 2026
