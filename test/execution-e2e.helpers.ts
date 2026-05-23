import { execSync } from 'child_process';
import { Queue } from 'bullmq';
import { io, Socket as ClientSocket } from 'socket.io-client';

export function resolveDockerSocketPath(): string {
    if (process.env.DOCKER_SOCKET_PATH) {
        return process.env.DOCKER_SOCKET_PATH;
    }

    const uid = typeof process.getuid === 'function' ? process.getuid() : 1000;
    return `/run/user/${uid}/podman/podman.sock`;
}

export function warmUpNodeExecutionImage(): void {
    const socketPath = resolveDockerSocketPath();
    const dockerHost = `unix://${socketPath}`;

    for (const cmd of [
        `docker pull node:20-alpine`,
        `podman pull docker.io/library/node:20-alpine`,
    ]) {
        try {
            execSync(cmd, {
                env: { ...process.env, DOCKER_HOST: dockerHost },
                stdio: 'pipe',
            });
            return;
        } catch {
            // try next pull command
        }
    }
}

export function connectAuthenticatedSocket(
    wsUrl: string,
    jwtAT: string,
): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
        const socket = io(wsUrl, {
            auth: { token: `Bearer ${jwtAT}` },
            transports: ['websocket'],
            forceNew: true,
            reconnection: false,
        });

        const timeout = setTimeout(() => {
            socket.disconnect();
            reject(new Error('Socket connect timeout'));
        }, 15_000);

        socket.once('connect', () => {
            clearTimeout(timeout);
            resolve(socket);
        });

        socket.once('connect_error', (err) => {
            clearTimeout(timeout);
            reject(new Error(`Socket connection error: ${err.message}`));
        });
    });
}

export async function waitForExecutionQueueIdle(
    queue: Queue,
    timeoutMs = 120_000,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const [active, waiting, delayed] = await Promise.all([
            queue.getActiveCount(),
            queue.getWaitingCount(),
            queue.getDelayedCount(),
        ]);

        if (active === 0 && waiting === 0 && delayed === 0) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    throw new Error('Execution queue did not become idle in time');
}

export function waitForSocketLog(
    socket: ClientSocket,
    predicate: (log: string) => boolean,
    timeoutMs: number,
): Promise<{ log: string }> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Socket event timeout - log event not received'));
        }, timeoutMs);

        const onLog = (data: { log: string }) => {
            if (!predicate(data.log)) {
                return;
            }

            clearTimeout(timeout);
            socket.off('log', onLog);
            socket.off('error', onError);
            resolve(data);
        };

        const onError = (err: unknown) => {
            clearTimeout(timeout);
            socket.off('log', onLog);
            reject(new Error(`Socket error: ${String(err)}`));
        };

        socket.on('log', onLog);
        socket.on('error', onError);
    });
}

export function waitForSocketJobDone(
    socket: ClientSocket,
    timeoutMs: number,
): Promise<{ job: string; submissionId: number }> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(
                new Error('Socket event timeout - JobDone event not received'),
            );
        }, timeoutMs);

        const onJobDone = (data: { job: string; submissionId: number }) => {
            clearTimeout(timeout);
            socket.off('jobDone', onJobDone);
            socket.off('error', onError);
            resolve(data);
        };

        const onError = (err: unknown) => {
            clearTimeout(timeout);
            socket.off('jobDone', onJobDone);
            reject(new Error(`Socket error: ${String(err)}`));
        };

        socket.on('jobDone', onJobDone);
        socket.on('error', onError);
    });
}
