import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SessionsService } from '../sessions/sessions.service';

export type JwtPayload = {
    sub: number;
    email: string;
    sessionId: string;
    iat?: number;
    exp?: number;
};

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private configService: ConfigService,
        private sessionsService: SessionsService,
        private jwt: JwtService,
    ) {}
    async signUp(
        userDto: CreateUserDto,
        device: string,
        userAgent: string,
        ip: string,
    ) {
        const user = await this.usersService.create(userDto);
        const sessionId = crypto.randomUUID();

        const jwtPayload = {
            sub: user.id,
            email: user.email,
            sessionId,
        };

        const accessToken = await this.jwt.signAsync(jwtPayload, {
            expiresIn: '15m',
        });
        const refreshToken = await this.jwt.signAsync(jwtPayload, {
            expiresIn: '7d',
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        });
        await this.sessionsService.create({
            id: sessionId,
            device,
            ip,
            refreshToken,
            userAgent,
            userId: user.id,
        });

        return { accessToken, refreshToken };
    }

    async signIn(
        email: string,
        password: string,
        device: string,
        userAgent: string,
        ip: string,
    ) {
        const user = await this.usersService.findOneByEmail(email);

        if (!user) {
            await bcrypt.compare(
                'time delay',
                '$2a$10$i74cM9C/aYrCoPk56CN7VupnV5xN9xxnGt0HqbtY1gPyhe7phJAtO',
            );
            crypto.randomUUID();
            await this.jwt.signAsync('dummy payload');
            await this.jwt.signAsync('to decept hackers');
            throw new BadRequestException('Wrong credentials');
        }

        if (!(await bcrypt.compare(password, user.password))) {
            crypto.randomUUID();
            await this.jwt.signAsync('dummy payload');
            await this.jwt.signAsync('to decept hackers');

            throw new BadRequestException('Wrong credentials');
        }

        const sessionId = crypto.randomUUID();

        const jwtPayload = {
            sub: user.id,
            email: user.email,
            sessionId,
        };

        const accessToken = await this.jwt.signAsync(jwtPayload, {
            expiresIn: '15m',
        });
        const refreshToken = await this.jwt.signAsync(jwtPayload, {
            expiresIn: '7d',
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        });

        await this.sessionsService.create({
            id: sessionId,
            device,
            ip,
            refreshToken,
            userAgent,
            userId: user.id,
        });

        return { accessToken, refreshToken };
    }

    signOut(sessionId: string) {
        return this.sessionsService.remove(sessionId);
    }

    async refreshTokens(refreshToken: string) {
        const { email, sub, sessionId } =
            await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            });

        const newAccessToken = await this.jwt.signAsync(
            { email, sub, sessionId },
            {
                expiresIn: '15m',
            },
        );

        const newRefreshToken = await this.jwt.signAsync(
            { email, sub, sessionId },
            {
                expiresIn: '7d',
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            },
        );

        await this.sessionsService.update(sessionId, {
            refreshToken: newRefreshToken,
            expiresAt: new Date(
                Date.now() +
                    Number(
                        this.configService.getOrThrow<string>(
                            'JWT_REFRESH_DAYS',
                        ),
                    ) *
                        24 *
                        60 *
                        60 *
                        1000,
            ),
        });

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
}
