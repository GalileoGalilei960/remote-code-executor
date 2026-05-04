import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../auth.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(private jwt: JwtService) {}
    async canActivate(ctx: ExecutionContext) {
        const req = ctx.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(req);

        if (!token) throw new UnauthorizedException('Missing access token');

        try {
            const payload = await this.jwt.verifyAsync<JwtPayload>(token);

            req['user'] = payload;

            return true;
        } catch {
            throw new UnauthorizedException(
                'Access token is invalid or expired',
            );
        }
    }

    extractTokenFromHeader(req: Request) {
        const [type, token] = req.headers.authorization?.split(' ') ?? [];

        return type === 'Bearer' ? token : undefined;
    }
}
