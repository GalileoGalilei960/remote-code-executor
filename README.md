# Remote Code Executor

A NestJS backend for a coding-challenge platform: users authenticate, browse tasks, submit solutions, and run code in isolated containers with real-time log streaming over WebSockets.

**Repository:** [github.com/GalileoGalilei960/remote-code-executor](https://github.com/GalileoGalilei960/remote-code-executor)

## Features

- **User accounts** — registration, JWT access tokens, HTTP-only refresh cookies, and revocable sessions (device, IP, user agent).
- **Tasks & test cases** — CRUD for challenges with difficulty, time/memory limits, typed I/O schemas, and hidden or sample tests.
- **Submissions** — persist code, language, status, runtime metrics, and execution logs.
- **Sandboxed execution** — jobs queued in Redis (BullMQ), processed in ephemeral Docker/Podman containers with network disabled and resource limits.
- **Live feedback** — Socket.IO streams execution logs; `jobDone` notifies when a run finishes.
- **API docs** — interactive OpenAPI UI at `/api`.

## Architecture

```mermaid
flowchart LR
    Client[Client / Frontend]
    API[NestJS API]
    PG[(PostgreSQL)]
    Redis[(Redis)]
    Worker[BullMQ Worker]
    Docker[Docker / Podman]

    Client -->|REST + JWT| API
    Client -->|WebSocket| API
    API --> PG
    API --> Redis
    Redis --> Worker
    Worker --> Docker
    Worker --> PG
```

1. Client submits code via `POST /execution/:taskId` (creates a submission and enqueues a job).
2. `ExecutionProcessor` spins up a language-specific container, injects a tar archive of user code + test harness, and collects stdout/stderr.
3. Results update the submission; events push logs and completion to the user's Socket.IO room.

## Tech stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 22, TypeScript |
| Framework | NestJS 11 |
| Database | PostgreSQL 18, Prisma 7 |
| Queue | Redis 7, BullMQ |
| Containers | Dockerode (Docker or Podman socket) |
| Real-time | Socket.IO |
| API docs | Swagger / OpenAPI |

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) (Corepack: `corepack enable pnpm`)
- [Docker](https://docs.docker.com/) or [Podman](https://podman.io/) with a reachable socket (required for code execution and e2e tests)
- PostgreSQL and Redis (local via Compose, or your own instances)

## Getting started

### 1. Install dependencies

```bash
git clone https://github.com/GalileoGalilei960/remote-code-executor.git
cd remote-code-executor
pnpm install
```

### 2. Start infrastructure

For local development, Postgres and Redis are defined in `development.docker-compose.yaml`:

```bash
podman compose -f development.docker-compose.yaml up -d
# or: docker compose -f development.docker-compose.yaml up -d
```

Default database credentials (from the compose file):

| Variable | Value |
| --- | --- |
| User | `code_engine` |
| Password | `code_engine_password` |
| Database | `code_engine` |
| Port | `5432` |

Redis listens on `6379`.

### 3. Configure environment

The app loads env files by `NODE_ENV`:

| `NODE_ENV` | File |
| --- | --- |
| `development` | `.env.development` |
| `test` | `.env.test` |
| otherwise | `.env` |

Create `.env.development` (and `.env` for production/Compose) with at least:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (match your Postgres setup)
DATABASE_URL=postgresql://code_engine:code_engine_password@localhost:5432/code_engine

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (use long random secrets in production)
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_REFRESH_DAYS=7

# Container runtime (adjust for your user / socket)
DOCKER_SOCKET_PATH=/var/run/docker.sock
# Podman example:
# DOCKER_SOCKET_PATH=/run/user/1000/podman/podman.sock
```

For `docker-compose.yaml`, also set Postgres variables used by the `postgres` service (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) in `.env`.

### 4. Database migrations & Prisma client

```bash
pnpm dlx prisma generate
pnpm dlx prisma migrate deploy
```

During active schema work, use `pnpm dlx prisma migrate dev` instead.

### 5. Run the API

```bash
# development with watch (see package.json for Podman socket override)
pnpm run start:dev

# or without watch
pnpm run start
```

The server listens on `http://0.0.0.0:3000` (or `PORT`).

**Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)  
**OpenAPI JSON:** [http://localhost:3000/api-json](http://localhost:3000/api-json)

## Running with Docker Compose (full stack)

`docker-compose.yaml` builds the API image and runs API + Postgres + Redis. The API container mounts the container socket so it can spawn execution sandboxes:

```bash
# Create .env with the variables from the section above
podman compose up --build -d
podman exec -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 RCE_api pnpm dlx prisma migrate deploy
```

Adjust the socket volume in `docker-compose.yaml` if you use Podman on a different UID path.

## Authentication

| Endpoint | Description |
| --- | --- |
| `POST /auth/signup` | Register; returns access token, sets `refreshToken` cookie |
| `POST /auth/signin` | Login |
| `POST /auth/signout` | Logout (requires Bearer token) |
| `POST /auth/refresh` | New access token from refresh cookie |

Protected REST routes expect:

```http
Authorization: Bearer <access_token>
```

## Code execution & WebSockets

**Run code for a task**

```http
POST /execution/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "def solve(nums, target): ...",
  "language": "Python"
}
```

Connect to Socket.IO with the same JWT (Bearer in `Authorization` header or `auth.token` in the handshake). Events:

| Event | Direction | Payload |
| --- | --- | --- |
| `log` | server → client | `{ log: string }` — streamed stdout/stderr |
| `jobDone` | server → client | `{ job, submissionId }` — run finished |

Rooms are keyed by user id (`sub` from the JWT).

## Supported languages

The schema defines several languages; **execution parsers are implemented for:**

| Language | Container image |
| --- | --- |
| JavaScript | `node:20-alpine` |
| Python | `python:3.11-alpine` |

Other enum values currently fall back to the JavaScript parser until dedicated parsers are added.

Submission status codes include `ACCEPTED`, `WRONG_ANSWER`, `RUNTIME_ERROR`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, and `SYNTAX_ERROR`.

## Testing

```bash
# unit tests
pnpm test

# e2e (Testcontainers for Postgres/Redis; requires container socket)
pnpm run test:e2e

# coverage
pnpm run test:cov
```

E2e execution tests set `DOCKER_HOST` to the Podman socket by default (see `package.json`). Ensure Docker/Podman is running before `test:e2e`.

## Deployment

Pushes to `main` trigger [.github/workflows/deploy.yaml](.github/workflows/deploy.yaml): SSH to the VPS, `git pull`, `podman compose up --build`, then `prisma migrate deploy` inside the API container.

Production API (from Swagger config): `http://164.92.249.66:3000`

## Project structure

```
src/
├── main.ts                 # Bootstrap, cookies, Swagger
├── app.module.ts           # Root module & global config
├── config/                 # Swagger setup
├── prisma/                 # Prisma service
└── modules/
    ├── auth/               # JWT auth & guards
    ├── users/
    ├── sessions/           # Refresh token sessions
    ├── tasks/
    ├── test-cases/
    ├── submissions/
    ├── execution/          # Queue, processor, parsers, gateway
    └── containers/         # Dockerode wrapper
prisma/
├── schema.prisma
└── migrations/
```

## Additional documentation

- [API_ENDPOINTS.md](API_ENDPOINTS.md) — endpoint quick reference and curl examples
- [SWAGGER_DOCUMENTATION.md](SWAGGER_DOCUMENTATION.md) — how Swagger is set up in this repo

## Scripts

| Command | Description |
| --- | --- |
| `pnpm run start:dev` | Dev server with watch |
| `pnpm run build` | Compile to `dist/` |
| `pnpm run start:prod` | Run compiled app |
| `pnpm run lint` | ESLint |
| `pnpm run format` | Prettier |

## License

UNLICENSED — private project. See [package.json](package.json).

## Author

[GalileoGalilei960](https://github.com/GalileoGalilei960)
