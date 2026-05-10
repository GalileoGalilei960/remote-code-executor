import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
    OnGatewayConnection,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/auth.service';

@WebSocketGateway()
export class ExecutionGateway implements OnGatewayConnection {
    constructor(private jwt: JwtService) {}

    @WebSocketServer()
    server!: Server;

    async handleConnection(client: Socket) {
        try {
            const token = this.getToken(client);

            if (!token) throw new Error('Missing Authentication token');

            const jwtPayload = await this.jwt.verifyAsync<JwtPayload>(token);

            await client.join(`${jwtPayload.sub}`);
        } catch (err) {
            console.log(err);
            client.disconnect(true);
        }
    }

    @OnEvent('jobDone')
    sendResult(payload: { job: string; submissionId: number; userId: number }) {
        console.log('event jobDone catched');

        this.server.to(`${payload.userId}`).emit('jobDone', {
            job: payload.job,
            submissionId: payload.submissionId,
        });

        // this.server.in(`${payload.userId}`).disconnectSockets(true);
    }

    @OnEvent('log')
    sendLog(payload: { log: string; userId: number }) {
        this.server.to(`${payload.userId}`).emit('log', { log: payload.log });
    }

    getToken(client: Socket) {
        const authPayload = client.handshake.auth?.token as string | undefined;
        const authHeader = client.handshake.headers.authorization;

        const rawToken = authHeader || authPayload;

        const [type, token] = rawToken?.split(' ') || [];

        return type === 'Bearer' ? token : undefined;
    }
}
