import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { AgentStatus } from 'src/common/enums/agent-status.enum';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;
}
