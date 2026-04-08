import { OnEvent } from '@nestjs/event-emitter';
import {
    OnGatewayConnection,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ExecutionGateway implements OnGatewayConnection {
    @WebSocketServer()
    server!: Server;

    // TODO implement cookies here
    async handleConnection(client: Socket) {
        if (client.handshake.headers?.cookie !== '1') client.disconnect();
        await client.join(client.handshake.headers?.cookie ?? 'nullRoom');
    }

    @OnEvent('jobDone')
    sendResult(payload: { job: string; submissionId: number; userId: number }) {
        console.log('event catched');

        this.server.to(`${payload.userId}`).emit('jobDone', {
            job: payload.job,
            submissionId: payload.submissionId,
        });

        this.server.in(`${payload.userId}`).disconnectSockets(true);
    }
}
