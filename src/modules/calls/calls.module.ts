import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { CallsOrchestrationService } from './calls-orchestration.service';
import { TelnyxWebhookController } from './telnyx-webhook.controller';
import { TelnyxCallProvider } from './providers/telnyx/telnyx-call.provider';
import { TelnyxWebhookService } from './providers/telnyx/telnyx-webhook.service';
import { CALL_PROVIDER } from './providers/call-provider.interface';
import { FreeswitchCallProvider } from './providers/freeswitch/freeswitch-call.provider';
import { CallsConfig } from 'src/config';

@Module({
  controllers: [CallsController, TelnyxWebhookController],
  providers: [
    CallsService,
    CallsOrchestrationService,
    TelnyxCallProvider,
    FreeswitchCallProvider,
    TelnyxWebhookService,
    {
      provide: CALL_PROVIDER,
      useFactory: (
        callsConfig: CallsConfig,
        telnyxCallProvider: TelnyxCallProvider,
        freeswitchCallProvider: FreeswitchCallProvider,
      ) =>
        callsConfig.provider === 'freeswitch'
          ? freeswitchCallProvider
          : telnyxCallProvider,
      inject: [CallsConfig, TelnyxCallProvider, FreeswitchCallProvider],
    },
  ],
})
export class CallsModule {}
