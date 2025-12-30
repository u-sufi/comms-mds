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
}
