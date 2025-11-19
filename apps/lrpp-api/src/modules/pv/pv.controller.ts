import { Controller, Get, Param } from '@nestjs/common';
import { PvService } from './pv.service';

@Controller('pvs')
export class PvController {
  constructor(private readonly pvService: PvService) {}

  @Get()
  findAll() {
    return this.pvService.findAll();
  }

  @Get('frameworks')
  findAllFrameworks() {
    return this.pvService.findAllFrameworks();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pvService.findOne(id);
  }

  @Get(':id/sections')
  findSections(@Param('id') id: string) {
    return this.pvService.findSections(id);
  }
}
