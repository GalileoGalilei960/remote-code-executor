import { Injectable } from '@nestjs/common';
import Dockerode from 'dockerode';
import { PassThrough } from 'node:stream';
import { fromEvent, map, ReplaySubject } from 'rxjs';

@Injectable()
export class ContainersService {
    private docker = new Dockerode({
        socketPath: '/run/user/1000/podman/podman.sock',
    });

    async createContainer(code: string) {
        const container = await this.docker.createContainer({
            Image: 'docker.io/library/node:20-alpine',
            AttachStdout: true,
            AttachStderr: true,
            StopTimeout: 15,
            Cmd: ['node', '-e', code],
            HostConfig: {
                PidsLimit: 10,
                NanoCpus: 50000000,
                Memory: 128 * 1024 * 1024,
            },
            NetworkDisabled: true,
        });

        return container.id;
    }

    async runContainer(containerId: string) {
        const container = this.docker.getContainer(containerId);

        await container.start();
    }

    async awaitContainer(containerId: string) {
        const container = this.docker.getContainer(containerId);

        return (await container.wait({ condition: 'not-running' })) as {
            StatusCode: number;
        };
    }

    async getContainerLogs(containerId: string) {
        const container = this.docker.getContainer(containerId);
        const stdOutOutput = new PassThrough();
        const stdErrOutput = new PassThrough();
        const replayOutput = new ReplaySubject<string>(1000);
        const replayError = new ReplaySubject<string>(1000);

        const logsStream = await container.attach({
            stream: true,
            hijack: true,
            logs: true,
            stdout: true,
            stderr: true,
        });

        this.docker.modem.demuxStream(logsStream, stdOutOutput, stdErrOutput);

        const observeStdOutOutput = fromEvent(stdOutOutput, 'data').pipe(
            map((log: unknown) => {
                const receivedLog =
                    `${new Date().getTime()} ${log as string}`.trimEnd();

                console.log('recieved log', receivedLog);

                return receivedLog;
            }),
        );
        const observeStdErrOutput = fromEvent(stdErrOutput, 'data').pipe(
            map((log: unknown) => {
                return `Error: ${Date.now()} ${log as string}`.trimEnd();
            }),
        );

        observeStdOutOutput.subscribe(replayOutput);
        observeStdErrOutput.subscribe(replayError);

        return [replayError, replayOutput];
    }

    async stopContainer(containerId: string) {
        const container = this.docker.getContainer(containerId);

        await container.stop();
    }

    async removeContainer(containerId: string) {
        const container = this.docker.getContainer(containerId);
        await container.remove();
    }
}
