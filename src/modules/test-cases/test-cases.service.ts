import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { instanceToPlain } from 'class-transformer';
import { Prisma } from 'generated/prisma/client';
import { typeMatchMap } from '@/common/utils/type-match.map';
import { CreateTaskIODto } from '../tasks/dto/create-task-IO.dto';

@Injectable()
export class TestCasesService {
    constructor(private prisma: PrismaService) {}

    private async validateTestCaseIO(
        taskId: number,
        data: { input?: string[]; expectedOutput?: string },
    ) {
        const task = await this.prisma.task.findUniqueOrThrow({
            where: { id: taskId },
        });

        const inputTypes = task.inputType as unknown as CreateTaskIODto[];
        const expectedOutputType =
            task.expectedOutputType as unknown as CreateTaskIODto;

        if (data.input) {
            if (inputTypes.length !== data.input.length)
                throw new BadRequestException(
                    `Number of input parameters doesn't match the number required by task. Got ${data.input.length} Should be ${inputTypes.length}`,
                );

            inputTypes.forEach((inputType, i) => {
                if (!typeMatchMap[inputType.type](data.input![i]))
                    throw new BadRequestException('Wrong Input');
            });
        }

        if (data.expectedOutput) {
            if (!typeMatchMap[expectedOutputType.type](data.expectedOutput))
                throw new BadRequestException('Wrong Output');
        }
        return true;
    }

    async create(taskId: number, createTestCaseDto: CreateTestCaseDto) {
        await this.validateTestCaseIO(taskId, createTestCaseDto);

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

    async update(id: number, updateTestCaseDto: UpdateTestCaseDto) {
        const { taskId } = await this.prisma.testCase.findUniqueOrThrow({
            where: { id },
            select: { taskId: true },
        });

        await this.validateTestCaseIO(taskId, updateTestCaseDto);

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
