import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlockService } from './block.service';

@Controller('blocks')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get()
  findAll(@Query('pvId') pvId?: string, @Query('tag') tag?: string) {
    return this.blockService.findAll({ pvId, tag });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blockService.findOne(id);
  }
}
