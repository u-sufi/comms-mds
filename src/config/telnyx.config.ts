import { Configuration, Value } from '@itgorillaz/configify';
import { IsOptional, IsString } from 'class-validator';

@Configuration()
export class TelnyxConfig {
  @IsString()
  @Value('TELNYX_API_KEY', { default: '' })
  apiKey: string;

  @IsString()
  @Value('TELNYX_CONNECTION_ID', { default: '' })
  connectionId: string;

  @IsString()
  @Value('TELNYX_BASE_URL', { default: 'https://api.telnyx.com/v2' })
  baseUrl: string;

  @IsOptional()
  @IsString()
  @Value('TELNYX_PUBLIC_KEY', { default: '' })
  publicKey: string;

  @IsOptional()
  @IsString()
  @Value('TELNYX_WEBHOOK_SECRET', { default: '' })
  webhookSecret: string;
}
