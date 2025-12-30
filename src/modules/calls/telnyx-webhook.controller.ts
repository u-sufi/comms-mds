import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { TelnyxWebhookService } from './providers/telnyx/telnyx-webhook.service';

export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('webhooks/telnyx')
export class TelnyxWebhookController {
  constructor(private readonly telnyxWebhookService: TelnyxWebhookService) {}

  @Post()
  handleWebhook(
    @Req() req: RawBodyRequest,
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.telnyxWebhookService.handleWebhook(body as never, {
      rawBody: req.rawBody,
      headers,
    });
  }
}
