import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}
    async create(createUserDto: CreateUserDto) {
        const { username, email, password } = createUserDto;
        const hashedPassword = await bcrypt.hash(password, 16);
        const user = await this.prisma.user.create({
            data: { username, email, password: hashedPassword },
        });

        return user;
    }

    findAll() {
        return this.prisma.user.findMany({
            where: {},
            omit: { password: true },
        });
    }

    findOne(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return this.prisma.user.update({
            data: updateUserDto,
            where: { id },
            omit: { password: true },
        });
    }

    remove(id: number) {
        return this.prisma.user.delete({
            where: { id },
            omit: { password: true },
        });
    }
}
