import { Injectable } from '@nestjs/common';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { instanceToPlain } from 'class-transformer';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class TestCasesService {
    constructor(private prisma: PrismaService) {}

    create(taskId: number, createTestCaseDto: CreateTestCaseDto) {
        const plainData = instanceToPlain(
            createTestCaseDto,
        ) as Prisma.TestCaseUncheckedCreateInput;

        return this.prisma.testCase.create({
            data: { ...plainData, taskId },
        });
    }

    findAll() {
        return this.prisma.testCase.findMany({ where: {} });
    }

    findAllForTask(taskId: number) {
        return this.prisma.testCase.findMany({ where: { taskId } });
    }

    findOne(id: number) {
        return this.prisma.testCase.findUnique({ where: { id } });
    }

    update(id: number, updateTestCaseDto: UpdateTestCaseDto) {
        const plainData = instanceToPlain(updateTestCaseDto);
        return this.prisma.testCase.update({
            data: plainData,
            where: { id },
        });
    }

    async remove(id: number) {
        const removedTestCase = await this.prisma.testCase.delete({
            where: { id },
        });

        const testCasesCount = await this.prisma.testCase.count({
            where: { taskId: removedTestCase.taskId },
        });
        if (!testCasesCount)
            await this.prisma.task.update({
                data: { isPublished: false },
                where: { id: removedTestCase.taskId },
            });

        return removedTestCase;
    }
}
