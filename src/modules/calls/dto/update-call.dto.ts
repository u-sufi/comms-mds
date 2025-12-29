import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { CallStatus } from 'src/common/enums/call.enums';

export class UpdateCallDto {
  @IsOptional()
  @IsEnum(CallStatus)
  status?: CallStatus;

  @IsOptional()
  @IsString()
  providerCallId?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  answeredAt?: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;
}
