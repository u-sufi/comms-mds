/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';
import { CallsOrchestrationService } from './calls-orchestration.service';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly callsOrchestrationService: CallsOrchestrationService,
  ) {}

  @Post()
  create(@Body() dto: CreateCallDto) {
    return this.callsOrchestrationService.create(dto);
  }

  @Get()
  findAll() {
    return this.callsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.callsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCallDto) {
    return this.callsService.update(id, dto);
  }
}
