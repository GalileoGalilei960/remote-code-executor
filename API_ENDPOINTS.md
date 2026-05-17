# API Endpoints Quick Reference

## Base URL

```
http://localhost:3000
```

## Authentication Endpoints

| Method | Endpoint        | Description          | Auth Required |
| ------ | --------------- | -------------------- | ------------- |
| POST   | `/auth/signup`  | Register new user    | ❌ No         |
| POST   | `/auth/signin`  | User login           | ❌ No         |
| POST   | `/auth/signout` | User logout          | ✅ Yes        |
| POST   | `/auth/refresh` | Refresh access token | ❌ No         |

## User Endpoints

| Method | Endpoint     | Description    | Auth Required |
| ------ | ------------ | -------------- | ------------- |
| POST   | `/users`     | Create user    | ❌ No         |
| GET    | `/users`     | Get all users  | ❌ No         |
| GET    | `/users/:id` | Get user by ID | ❌ No         |
| PATCH  | `/users/:id` | Update user    | ✅ Yes        |
| DELETE | `/users/:id` | Delete user    | ✅ Yes        |

## Task Endpoints

| Method | Endpoint                    | Description         | Auth Required |
| ------ | --------------------------- | ------------------- | ------------- |
| POST   | `/tasks`                    | Create new task     | ✅ Yes        |
| GET    | `/tasks`                    | Get all tasks       | ❌ No         |
| GET    | `/tasks/:taskId`            | Get task by ID      | ❌ No         |
| PATCH  | `/tasks/:taskId`            | Update task         | ✅ Yes        |
| DELETE | `/tasks/:taskId`            | Delete task         | ✅ Yes        |
| GET    | `/tasks/:taskId/test-cases` | Get task test cases | ❌ No         |

## Test Case Endpoints

| Method | Endpoint          | Description         | Auth Required |
| ------ | ----------------- | ------------------- | ------------- |
| GET    | `/test-cases/:id` | Get test case by ID | ❌ No         |
| PATCH  | `/test-cases/:id` | Update test case    | ✅ Yes        |
| DELETE | `/test-cases/:id` | Delete test case    | ✅ Yes        |

## Execution Endpoints

| Method | Endpoint             | Description           | Auth Required |
| ------ | -------------------- | --------------------- | ------------- |
| POST   | `/execution/:taskId` | Execute code for task | ✅ Yes        |

## Submission Endpoints

| Method | Endpoint           | Description          | Auth Required |
| ------ | ------------------ | -------------------- | ------------- |
| POST   | `/submissions`     | Create submission    | ✅ Yes        |
| GET    | `/submissions`     | Get all submissions  | ✅ Yes        |
| GET    | `/submissions/:id` | Get submission by ID | ✅ Yes        |
| PATCH  | `/submissions/:id` | Update submission    | ✅ Yes        |
| DELETE | `/submissions/:id` | Delete submission    | ✅ Yes        |

## Response Status Codes

### 2xx - Success

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing

### 4xx - Client Error

- `400 Bad Request` - Invalid request format or parameters
- `401 Unauthorized` - Authentication required or invalid token
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists

### 5xx - Server Error

- `500 Internal Server Error` - Server error occurred

## Common Request Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Common Response Headers

```
Content-Type: application/json
X-Total-Count: <number>  (for list endpoints)
```

## Example Requests

### 1. Sign Up

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Response:

```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Sign In

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Get All Tasks

```bash
curl -X GET http://localhost:3000/tasks
```

### 4. Create Task (Requires Auth)

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Two Sum Problem",
    "description": "Find two numbers that add up to target",
    "difficulty": "Easy",
    "timeLimit": 5,
    "memoryLimit": 256,
    "isPublished": true,
    "inputType": [{"name": "arr", "type": "INT_ARRAY"}, {"name": "target", "type": "INT"}],
    "expectedOutputType": {"name": "result", "type": "INT"}
  }'
```

### 5. Execute Code

```bash
curl -X POST http://localhost:3000/execution/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function sum(a,b) { return a+b; }\nconsole.log(sum(2,3));",
    "language": "JavaScript"
  }'
```

## Data Types

### Languages (Enum)

- `JavaScript`
- `TypeScript`
- `Python`
- `C`
- `C++`
- `Ruby`
- `Java`
- `C#`

### Task Difficulties (Enum)

- `Easy`
- `Medium`
- `Hard`

### Parameter Types (Enum)

- `INT` - Integer type
- `FLOAT` - Floating point type
- `STRING` - String/Text type
- `BOOLEAN` - Boolean type
- `INT_ARRAY` - Array of integers
- `FLOAT_ARRAY` - Array of floats
- `STRING_ARRAY` - Array of strings
- `BOOLEAN_ARRAY` - Array of booleans

## Error Response Format

```json
{
    "statusCode": 400,
    "message": ["validation error details"],
    "error": "Bad Request"
}
```

## WebSocket Events (If Applicable)

Execution updates are emitted via WebSocket in real-time:

- `execution:started` - Code execution started
- `execution:output` - Output received
- `execution:completed` - Code execution completed
- `execution:error` - Execution error occurred

---

**For full interactive API documentation, visit**: `http://localhost:3000/api`
