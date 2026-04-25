import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) {}

    create(createTaskDto: CreateTaskDto) {
        const { inputType, expectedOutputType, ...taskData } = createTaskDto;

        return this.prisma.task.create({
            data: {
                ...taskData,
                inputType: instanceToPlain(inputType),
                expectedOutputType: instanceToPlain(expectedOutputType),
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
        return this.prisma.task.findUniqueOrThrow({
            where: { id },
            include: { testCases: true },
        });
    }

    update(id: number, updateTaskDto: UpdateTaskDto) {
        const { inputType, expectedOutputType, ...taskData } = updateTaskDto;
        return this.prisma.task.update({
            where: { id },
            data: {
                ...taskData,
                inputType: instanceToPlain(inputType),
                expectedOutputType: instanceToPlain(expectedOutputType),
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
