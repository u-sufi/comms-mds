/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';

@Injectable()
export class CallsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(dto: CreateCallDto) {
    return this.prismaService.call.create({ data: dto });
  }

  findAll() {
    return this.prismaService.call.findMany({
      orderBy: { createdAt: 'desc' },
      include: { project: true, agent: true },
    });
  }

  async findOne(id: string) {
    const call = await this.prismaService.call.findUnique({
      where: { id },
      include: {
        project: true,
        agent: true,
        recording: true,
        transcript: true,
      },
    });
    if (!call) {
      throw new NotFoundException('Call not found');
    }
    return call;
  }

  async update(id: string, dto: UpdateCallDto) {
    await this.findOne(id);
    return this.prismaService.call.update({ where: { id }, data: dto });
  }
}
