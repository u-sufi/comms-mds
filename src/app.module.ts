import { Module } from '@nestjs/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({
      // Loads .env file from root directory
    }),
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
