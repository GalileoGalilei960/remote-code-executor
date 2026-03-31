import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) {}

    create(createTaskDto: CreateTaskDto) {
        const { testCases, ...taskData } = createTaskDto;

        return this.prisma.task.create({
            data: {
                ...taskData,
                testCases: {
                    createMany: {
                        data: instanceToPlain(testCases) as any[],
                    },
                },
            },
            include: { testCases: true },
        });
    }

    findAll() {
        return this.prisma.task.findMany({
            where: {},
            include: { testCases: true },
        });
    }

    findOne(id: number) {
        return this.prisma.task.findUnique({
            where: { id },
            include: { testCases: true },
        });
    }

    update(id: number, updateTaskDto: UpdateTaskDto) {
        return this.prisma.task.update({
            where: { id },
            data: {
                ...updateTaskDto,
            },
        });
    }

    remove(id: number) {
        return this.prisma.task.delete({
            where: { id },
            include: { testCases: true },
        });
    }
}
