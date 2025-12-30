import { Configuration, Value } from '@itgorillaz/configify';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

@Configuration()
export class FreeswitchConfig {
  @IsString()
  @Value('FREESWITCH_HOST', { default: '127.0.0.1' })
  host: string;

  @IsInt()
  @Min(1)
  @Value('FREESWITCH_PORT', { default: 8021 })
  port: number;

  @IsString()
  @Value('FREESWITCH_PASSWORD', { default: 'ClueCon' })
  password: string;

  @IsOptional()
  @IsString()
  @Value('FREESWITCH_DIALSTRING_TEMPLATE', { default: '' })
  dialStringTemplate: string;

  @IsOptional()
  @IsString()
  @Value('FREESWITCH_ORIGINATE_PARAMS', { default: '' })
  originateParams: string;

  @IsOptional()
  @IsString()
  @Value('FREESWITCH_CALLER_ID_NUMBER', { default: '' })
  callerIdNumber: string;

  @IsOptional()
  @IsString()
  @Value('EXTERNAL_SIP_USER', { default: '' })
  externalSipUser: string;

  @IsOptional()
  @IsString()
  @Value('EXTERNAL_SIP_DOMAIN', { default: '' })
  externalSipDomain: string;

  @IsOptional()
  @IsString()
  @Value('EXTERNAL_SIP_PASSWORD', { default: '' })
  externalSipPassword: string;

  @IsOptional()
  @IsString()
  @Value('EXTERNAL_SIP_CALLER_NUMBER', { default: '' })
  externalSipCallerNumber: string;

  @IsOptional()
  @IsString()
  @Value('INTERNAL_DOMAIN', { default: '' })
  internalDomain: string;

  @IsOptional()
  @IsString()
  @Value('BACKEND_BASE_URL', { default: '' })
  backendBaseUrl: string;

  @IsOptional()
  @IsString()
  @Value('BACKEND_SECRET_KEY', { default: '' })
  backendSecretKey: string;
}
