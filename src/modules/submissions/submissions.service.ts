import { Injectable } from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { status_codes } from 'generated/prisma/enums';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

@Injectable()
export class SubmissionsService {
    constructor(private prisma: PrismaService) {}

    create(createSubmissionDto: CreateSubmissionDto) {
        const { code, language, taskId, userId } = createSubmissionDto;

        return this.prisma.submission.create({
            data: {
                code,
                language,
                taskId,
                userId,
                status: status_codes.PENDING,
            },
        });
    }

    findAll() {
        return this.prisma.submission.findMany({ where: {} });
    }

    findOne(id: number) {
        return this.prisma.submission.findUniqueOrThrow({ where: { id } });
    }

    update(id: number, updateSubmissionDto: UpdateSubmissionDto) {
        return this.prisma.submission.update({
            where: { id },
            data: updateSubmissionDto,
        });
    }

    remove(id: number) {
        return this.prisma.submission.delete({ where: { id } });
    }
}
