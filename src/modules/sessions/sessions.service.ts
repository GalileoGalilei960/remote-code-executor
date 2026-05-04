import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SessionsService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {}
    async create(createSessionDto: CreateSessionDto) {
        const rtExpiresInDays = Number(
            this.configService.getOrThrow<string>('JWT_REFRESH_DAYS'),
        );
        const rtExpirationDate = new Date(
            Date.now() + rtExpiresInDays * 24 * 60 * 60 * 1000,
        );

        const { refreshToken, ...data } = createSessionDto;

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

        return this.prisma.session.create({
            data: {
                refreshToken: hashedRefreshToken,
                expiresAt: rtExpirationDate,
                ...data,
            },
        });
    }

    findAllByUserId(userId: number) {
        return this.prisma.session.findMany({ where: { userId } });
    }

    findOne(id: string) {
        return this.prisma.session.findUniqueOrThrow({ where: { id } });
    }

    async update(id: string, updateSessionDto: UpdateSessionDto) {
        const { refreshToken, ...updateData } = updateSessionDto;
        let hashedRefreshToken: string | undefined;

        if (refreshToken)
            hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
        return this.prisma.session.update({
            where: { id },
            data: { refreshToken: hashedRefreshToken, ...updateData },
        });
    }

    remove(id: string) {
        return this.prisma.session.delete({ where: { id } });
    }
}
