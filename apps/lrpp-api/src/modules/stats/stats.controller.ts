import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('me')
  getMyStats(@Query('userId') userId: string) {
    return this.statsService.getUserStats(userId);
  }

  @Get('me/weak-blocks')
  getWeakBlocks(@Query('userId') userId: string, @Query('limit') limit = 10) {
    return this.statsService.getWeakBlocks(userId, +limit);
  }

  @Get('me/progress')
  getProgress(@Query('userId') userId: string) {
    return this.statsService.getProgress(userId);
  }
}
