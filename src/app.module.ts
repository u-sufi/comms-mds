import { Module } from '@nestjs/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { LoggerModule } from './logger';
import { AgentsModule } from './modules/agents/agents.module';
import { CallsModule } from './modules/calls/calls.module';
import { HealthModule } from './modules/health/health.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({
      // Loads .env file from root directory
    }),
    LoggerModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    ProjectsModule,
    AgentsModule,
    CallsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
