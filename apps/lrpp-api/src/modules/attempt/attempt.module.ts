import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attempt, UserBlockStats } from '@/common/entities';
import { UserModule } from '../user/user.module';
import { AttemptController } from './attempt.controller';
import { AttemptService } from './attempt.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attempt, UserBlockStats]), UserModule],
  controllers: [AttemptController],
  providers: [AttemptService],
  exports: [AttemptService],
})
export class AttemptModule {}
