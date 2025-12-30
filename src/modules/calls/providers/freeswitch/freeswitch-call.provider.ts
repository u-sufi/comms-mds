import { Injectable } from '@nestjs/common';
import { connect } from 'net';
import { FreeswitchConfig } from 'src/config';
import {
  CallProvider,
  CreateOutboundCallInput,
  CreateOutboundCallResult,
} from '../call-provider.interface';

type EslResponse = {
  replyText?: string;
};

@Injectable()
export class FreeswitchCallProvider implements CallProvider {
  constructor(private readonly config: FreeswitchConfig) {}

  async createOutboundCall(
    input: CreateOutboundCallInput,
  ): Promise<CreateOutboundCallResult> {
    const dialString = this.buildDialString(input);
    if (!dialString) {
      throw new Error(
        'FreeSWITCH dial string is empty. Set EXTERNAL_SIP_DOMAIN, INTERNAL_DOMAIN, or FREESWITCH_DIALSTRING_TEMPLATE.',
      );
    }

    const originateParams = this.buildOriginateParams(input);
    const originateCommand = `api originate ${originateParams}${dialString} &park`;
    const response = await this.runEslCommand(originateCommand);

    if (!response.replyText?.startsWith('+OK')) {
      throw new Error(
        `FreeSWITCH originate failed: ${response.replyText ?? 'unknown error'}`,
      );
    }

    const providerCallId = response.replyText.replace('+OK', '').trim();
    return {
      providerCallId,
      raw: response,
    };
  }

  private buildDialString(input: CreateOutboundCallInput): string {
    const template = this.config.dialStringTemplate.trim();
    if (!template) {
      const externalDomain = this.config.externalSipDomain.trim();
      if (externalDomain) {
        return `sofia/external/${input.toNumber}@${externalDomain}`;
      }

      const internalDomain = this.config.internalDomain.trim();
      if (internalDomain) {
        return `sofia/internal/${input.toNumber}@${internalDomain}`;
      }

      return '';
    }

    return template
      .replaceAll('{fromNumber}', input.fromNumber)
      .replaceAll('{toNumber}', input.toNumber);
  }

  private buildOriginateParams(input: CreateOutboundCallInput): string {
    const template = this.config.originateParams.trim();
    const callerIdNumber =
      this.config.externalSipCallerNumber ||
      this.config.callerIdNumber ||
      input.fromNumber ||
      '';
    const defaultParams = callerIdNumber
      ? ` {origination_caller_id_number=${callerIdNumber}} `
      : ' ';

    if (!template) {
      return defaultParams;
    }

    const filled = template
      .replaceAll('{fromNumber}', input.fromNumber)
      .replaceAll('{toNumber}', input.toNumber)
      .replaceAll('{callerIdNumber}', callerIdNumber);

    return ` {${filled}} `;
  }

  private async runEslCommand(command: string): Promise<EslResponse> {
    const { host, port, password } = this.config;
    return new Promise((resolve, reject) => {
      const socket = connect({ host, port });
      let buffer = '';
      let authenticated = false;

      const cleanup = () => {
        socket.removeAllListeners();
        socket.end();
        socket.destroy();
      };

      socket.setTimeout(15000, () => {
        cleanup();
        reject(new Error('FreeSWITCH connection timed out'));
      });

      socket.on('error', (error) => {
        cleanup();
        reject(error);
      });

      socket.on('data', (chunk) => {
        buffer += chunk.toString('utf8');

        if (!authenticated && buffer.includes('auth/request')) {
          socket.write(`auth ${password}\n\n`);
          buffer = '';
          return;
        }

        const replyTextMatch = buffer.match(/Reply-Text:\s*(.+)/);
        if (replyTextMatch) {
          const replyText = replyTextMatch[1].trim();
          if (!authenticated && replyText.includes('+OK accepted')) {
            authenticated = true;
            socket.write(`${command}\n\n`);
            buffer = '';
            return;
          }

          const response: EslResponse = { replyText };
          cleanup();
          resolve(response);
          return;
        }
      });
    });
  }
}
