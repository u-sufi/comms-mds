import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  telnyxConnectionId?: string;

  @IsOptional()
  @IsString()
  telnyxInboundNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
