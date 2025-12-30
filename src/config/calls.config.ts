import { Configuration, Value } from '@itgorillaz/configify';
import { IsIn, IsString } from 'class-validator';

@Configuration()
export class CallsConfig {
  @IsString()
  @IsIn(['telnyx', 'freeswitch'])
  @Value('CALL_PROVIDER', { default: 'telnyx' })
  provider: 'telnyx' | 'freeswitch';
}
