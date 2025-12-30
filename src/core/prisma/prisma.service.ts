/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from 'src/logger';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly loggerService: LoggerService) {
    const datasourceUrl = process.env['DATABASE_URL'];

    if (!datasourceUrl) {
      throw new Error(
        'DATABASE_URL is not set. Define it in your environment before starting the service.',
      );
    }

    super({ datasourceUrl });
    this.loggerService.setContext(PrismaService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.loggerService.log('Connected to database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.loggerService.log('Disconnected from database');
  }
}
