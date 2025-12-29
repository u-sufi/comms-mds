/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(dto: CreateAgentDto) {
    return this.prismaService.agent.create({ data: dto });
  }

  findAll() {
    return this.prismaService.agent.findMany({
      orderBy: { createdAt: 'desc' },
      include: { project: true },
    });
  }

  async findOne(id: string) {
    const agent = await this.prismaService.agent.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    return this.prismaService.agent.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.agent.delete({ where: { id } });
  }
}
