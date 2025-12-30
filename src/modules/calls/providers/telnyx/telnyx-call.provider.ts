import { Injectable } from '@nestjs/common';
import { TelnyxConfig } from 'src/config';
import {
  CallProvider,
  CreateOutboundCallInput,
  CreateOutboundCallResult,
} from '../call-provider.interface';

interface TelnyxCallResponse {
  data: {
    call_control_id: string;
    record_type: string;
  };
}

@Injectable()
export class TelnyxCallProvider implements CallProvider {
  constructor(private readonly telnyxConfig: TelnyxConfig) {}

  async createOutboundCall(
    input: CreateOutboundCallInput,
  ): Promise<CreateOutboundCallResult> {
    const connectionId = input.connectionId || this.telnyxConfig.connectionId;
    const fromNumber =
      input.fromNumber || this.telnyxConfig.number || this.telnyxConfig.did;
    if (!connectionId) {
      throw new Error('TELNYX_CONNECTION_ID is not configured');
    }
    if (!this.telnyxConfig.apiKey) {
      throw new Error('TELNYX_API_KEY is not configured');
    }

    const response = await fetch(`${this.telnyxConfig.baseUrl}/calls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.telnyxConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connection_id: connectionId,
        to: input.toNumber,
        from: fromNumber,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Telnyx call create failed (${response.status}): ${errorBody}`,
      );
    }

    const payload = (await response.json()) as TelnyxCallResponse;
    return {
      providerCallId: payload.data.call_control_id,
      raw: payload,
    };
  }
}
