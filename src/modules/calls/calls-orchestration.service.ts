/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CallDirection, CallStatus } from 'src/common/enums/call.enums';
import {
  CALL_PROVIDER,
  CallProvider,
} from './providers/call-provider.interface';
import { CreateCallDto } from './dto/create-call.dto';

@Injectable()
export class CallsOrchestrationService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CALL_PROVIDER) private readonly callProvider: CallProvider,
  ) {}

  async create(dto: CreateCallDto) {
    const project = await this.prismaService.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.direction === CallDirection.INBOUND) {
      return this.prismaService.call.create({
        data: {
          ...dto,
          status: CallStatus.CREATED,
        },
      });
    }

    const call = await this.prismaService.call.create({
      data: {
        ...dto,
        status: CallStatus.CREATED,
      },
    });

    const providerResult = await this.callProvider.createOutboundCall({
      fromNumber: dto.fromNumber,
      toNumber: dto.toNumber,
      connectionId: project.telnyxConnectionId || undefined,
    });

    return this.prismaService.call.update({
      where: { id: call.id },
      data: {
        providerCallId: providerResult.providerCallId,
        status: CallStatus.RINGING,
      },
    });
  }
}
