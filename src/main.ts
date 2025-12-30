import { LoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { json } from 'express';
import { AppModule } from './app.module';
import { AppConfig } from './config';
import { RawBodyRequest } from './modules/calls/telnyx-webhook.controller';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Buffer logs during startup, then use Winston
    bufferLogs: true,
  });

  // Get the Winston logger and set it as the application logger
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const appConfig = app.get(AppConfig);

  app.setGlobalPrefix(appConfig.apiPrefix);
  app.use(
    json({
      verify: (req, _res, buf) => {
        (req as RawBodyRequest).rawBody = buf;
      },
    }),
  );

  await app.listen(appConfig.port);

  logger.log(
    `🚀 ${appConfig.appName} is running on port ${appConfig.port}`,
    'Bootstrap',
  );
  logger.log(`📍 Environment: ${appConfig.nodeEnv}`, 'Bootstrap');
}

void bootstrap();
