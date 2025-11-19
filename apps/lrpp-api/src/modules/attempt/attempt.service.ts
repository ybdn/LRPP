import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempt, UserBlockStats } from '@/common/entities';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AttemptService {
  constructor(
    @InjectRepository(Attempt)
    private attemptRepository: Repository<Attempt>,
    @InjectRepository(UserBlockStats)
    private statsRepository: Repository<UserBlockStats>,
    private readonly userService: UserService,
  ) {}

  async create(dto: CreateAttemptDto): Promise<Attempt> {
    await this.userService.ensureUser(dto.userId);
    const attempt = this.attemptRepository.create(dto);
    const saved = await this.attemptRepository.save(attempt);

    // Update user block stats
    await this.updateStats(dto.userId, dto.blockId, dto.score);

    return saved;
  }

  async findOne(id: string): Promise<Attempt> {
    const attempt = await this.attemptRepository.findOne({
      where: { id },
      relations: ['block'],
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with id ${id} not found`);
    }

    return attempt;
  }

  private async updateStats(
    userId: string,
    blockId: string,
    newScore: number,
  ): Promise<void> {
    let stats = await this.statsRepository.findOne({
      where: { userId, blockId },
    });

    if (!stats) {
      stats = this.statsRepository.create({
        userId,
        blockId,
        masteryScore: newScore,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      });
    } else {
      // Weighted average: new attempts count more
      const weight = 0.7;
      stats.masteryScore = Math.round(
        stats.masteryScore * (1 - weight) + newScore * weight,
      );
      stats.attemptCount += 1;
      stats.lastAttemptAt = new Date();
    }

    await this.statsRepository.save(stats);
  }
}
