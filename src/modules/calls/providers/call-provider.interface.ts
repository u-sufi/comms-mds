export interface CreateOutboundCallInput {
  fromNumber: string;
  toNumber: string;
  connectionId?: string;
}

export interface CreateOutboundCallResult {
  providerCallId: string;
  raw?: unknown;
}

export interface CallProvider {
  createOutboundCall(
    input: CreateOutboundCallInput,
  ): Promise<CreateOutboundCallResult>;
}

export const CALL_PROVIDER = Symbol('CALL_PROVIDER');
