import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { CallsOrchestrationService } from './calls-orchestration.service';
import { TelnyxWebhookController } from './telnyx-webhook.controller';
import { TelnyxCallProvider } from './providers/telnyx/telnyx-call.provider';
import { TelnyxWebhookService } from './providers/telnyx/telnyx-webhook.service';
import { CALL_PROVIDER } from './providers/call-provider.interface';

@Module({
  controllers: [CallsController, TelnyxWebhookController],
  providers: [
    CallsService,
    CallsOrchestrationService,
    TelnyxCallProvider,
    TelnyxWebhookService,
    {
      provide: CALL_PROVIDER,
      useExisting: TelnyxCallProvider,
    },
  ],
})
export class CallsModule {}
