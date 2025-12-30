import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  telnyxConnectionId?: string;

  @IsOptional()
  @IsString()
  telnyxInboundNumber?: string;
}
