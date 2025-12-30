/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual, verify } from 'node:crypto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { LoggerService } from 'src/logger';
import { CallDirection, CallStatus } from 'src/common/enums/call.enums';
import { TelnyxConfig } from 'src/config';
import { TranscriptStatus } from '@prisma/client';

interface TelnyxWebhookEvent {
  data: {
    event_type: string;
    id: string;
    payload: {
      call_control_id?: string;
      connection_id?: string;
      call_session_id?: string;
      call_leg_id?: string;
      direction?: string;
      from?: string;
      to?: string;
      recording_urls?: string[];
      recording_duration_secs?: number;
      transcription?: {
        text?: string;
        status?: string;
      };
      state?: string;
      timestamp?: string;
    };
  };
}

interface WebhookVerificationInput {
  rawBody?: Buffer;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class TelnyxWebhookService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly telnyxConfig: TelnyxConfig,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext(TelnyxWebhookService.name);
  }

  async handleWebhook(
    event: TelnyxWebhookEvent,
    verification: WebhookVerificationInput,
  ): Promise<{ status: string }> {
    this.verifySignature(verification);

    const eventType = event?.data?.event_type;
    const payload = event?.data?.payload;

    if (!eventType || !payload) {
      return { status: 'ignored' };
    }

    switch (eventType) {
      case 'call.initiated':
      case 'call.answered':
      case 'call.hangup':
      case 'call.completed':
      case 'call.failed':
        await this.handleCallEvent(eventType, payload);
        break;
      case 'call.recording.saved':
        await this.handleRecordingEvent(payload);
        break;
      case 'call.transcription.updated':
      case 'call.transcription.completed':
        await this.handleTranscriptionEvent(eventType, payload);
        break;
      default:
        this.loggerService.log(`Unhandled Telnyx event: ${eventType}`);
    }

    return { status: 'ok' };
  }

  private verifySignature(verification: WebhookVerificationInput): void {
    const { rawBody, headers } = verification;
    if (!rawBody) {
      if (this.telnyxConfig.publicKey || this.telnyxConfig.webhookSecret) {
        throw new UnauthorizedException('Missing raw body for verification');
      }
      return;
    }

    const signatureHeader =
      this.getHeader(headers, 'telnyx-signature-ed25519') ||
      this.getHeader(headers, 'telnyx-signature');
    const timestamp = this.getHeader(headers, 'telnyx-timestamp');

    const hasPublicKey = Boolean(this.telnyxConfig.publicKey);
    const hasSecret = Boolean(this.telnyxConfig.webhookSecret);

    if (!hasPublicKey && !hasSecret) {
      return;
    }

    if (!signatureHeader || !timestamp) {
      throw new UnauthorizedException('Missing Telnyx signature headers');
    }

    const payload = rawBody.toString('utf8');
    const candidates = [`${timestamp}.${payload}`, `${timestamp}|${payload}`];

    if (hasPublicKey) {
      const publicKey = this.telnyxConfig.publicKey;
      const signature = Buffer.from(signatureHeader, 'base64');
      const verified = candidates.some((candidate) =>
        verify(null, Buffer.from(candidate), publicKey, signature),
      );
      if (verified) {
        return;
      }
    }

    if (hasSecret) {
      const secret = this.telnyxConfig.webhookSecret;
      const verified = candidates.some((candidate) => {
        const expected = createHmac('sha256', secret)
          .update(candidate)
          .digest('hex');
        if (expected.length !== signatureHeader.length) {
          return false;
        }
        return timingSafeEqual(
          Buffer.from(signatureHeader),
          Buffer.from(expected),
        );
      });
      if (verified) {
        return;
      }
    }

    throw new UnauthorizedException('Invalid Telnyx signature');
  }

  private getHeader(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const header =
      headers[name] ||
      headers[name.toLowerCase()] ||
      headers[name.toUpperCase()];
    if (Array.isArray(header)) {
      return header[0];
    }
    return header;
  }

  private async handleCallEvent(
    eventType: string,
    payload: TelnyxWebhookEvent['data']['payload'],
  ): Promise<void> {
    const providerCallId = payload.call_control_id;
    if (!providerCallId) {
      return;
    }

    const status = this.mapStatus(eventType);
    const timestamps = this.resolveTimestamps(eventType);

    const call = await this.prismaService.call.findFirst({
      where: { providerCallId },
    });

    if (call) {
      await this.prismaService.call.update({
        where: { id: call.id },
        data: { status, ...timestamps },
      });
      return;
    }

    const project = await this.resolveProject(payload);
    if (!project) {
      this.loggerService.warn(
        `No project found for inbound call ${providerCallId}`,
      );
      return;
    }

    await this.prismaService.call.create({
      data: {
        projectId: project.id,
        direction: this.mapDirection(payload.direction),
        status,
        fromNumber: payload.from || 'unknown',
        toNumber: payload.to || 'unknown',
        providerCallId,
        ...timestamps,
      },
    });
  }

  private async handleRecordingEvent(
    payload: TelnyxWebhookEvent['data']['payload'],
  ): Promise<void> {
    const providerCallId = payload.call_control_id;
    if (!providerCallId || !payload.recording_urls?.length) {
      return;
    }

    const call = await this.prismaService.call.findFirst({
      where: { providerCallId },
    });
    if (!call) {
      return;
    }

    await this.prismaService.recording.upsert({
      where: { callId: call.id },
      update: {
        storageUrl: payload.recording_urls[0],
        durationSeconds: payload.recording_duration_secs,
      },
      create: {
        callId: call.id,
        storageUrl: payload.recording_urls[0],
        durationSeconds: payload.recording_duration_secs,
      },
    });
  }

  private async handleTranscriptionEvent(
    eventType: string,
    payload: TelnyxWebhookEvent['data']['payload'],
  ): Promise<void> {
    const providerCallId = payload.call_control_id;
    if (!providerCallId) {
      return;
    }

    const call = await this.prismaService.call.findFirst({
      where: { providerCallId },
    });
    if (!call) {
      return;
    }

    const status = eventType.includes('completed')
      ? TranscriptStatus.COMPLETED
      : TranscriptStatus.PROCESSING;

    await this.prismaService.transcript.upsert({
      where: { callId: call.id },
      update: {
        status,
        text: payload.transcription?.text,
        provider: 'telnyx',
      },
      create: {
        callId: call.id,
        status,
        text: payload.transcription?.text,
        provider: 'telnyx',
      },
    });
  }

  private mapStatus(eventType: string): CallStatus {
    switch (eventType) {
      case 'call.answered':
        return CallStatus.ANSWERED;
      case 'call.hangup':
      case 'call.completed':
        return CallStatus.COMPLETED;
      case 'call.failed':
        return CallStatus.FAILED;
      case 'call.initiated':
      default:
        return CallStatus.RINGING;
    }
  }

  private resolveTimestamps(eventType: string): Partial<{
    startedAt: Date;
    answeredAt: Date;
    endedAt: Date;
  }> {
    const now = new Date();
    switch (eventType) {
      case 'call.answered':
        return { answeredAt: now };
      case 'call.hangup':
      case 'call.completed':
      case 'call.failed':
        return { endedAt: now };
      case 'call.initiated':
      default:
        return { startedAt: now };
    }
  }

  private mapDirection(direction?: string): CallDirection {
    return direction === 'outbound'
      ? CallDirection.OUTBOUND
      : CallDirection.INBOUND;
  }

  private async resolveProject(payload: TelnyxWebhookEvent['data']['payload']) {
    const connectionId = payload.connection_id;
    const toNumber = payload.to;
    const isInbound = payload.direction !== 'outbound';

    if (connectionId) {
      const project = await this.prismaService.project.findFirst({
        where: { telnyxConnectionId: connectionId },
      });
      if (project) {
        return project;
      }
    }

    if (toNumber) {
      const project = await this.prismaService.project.findFirst({
        where: { telnyxInboundNumber: toNumber },
      });
      if (project) {
        return project;
      }

      const matchesServiceNumber =
        toNumber === this.telnyxConfig.number ||
        toNumber === this.telnyxConfig.did;
      if (isInbound && matchesServiceNumber) {
        this.loggerService.warn(
          `Inbound Telnyx call received for service DID ${toNumber} without project mapping`,
        );
      }
    }

    return null;
  }
}
