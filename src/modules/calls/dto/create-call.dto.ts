import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CallDirection } from 'src/common/enums/call.enums';

export class CreateCallDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsEnum(CallDirection)
  direction: CallDirection;

  @IsNotEmpty()
  @IsString()
  fromNumber: string;

  @IsNotEmpty()
  @IsString()
  toNumber: string;
}
