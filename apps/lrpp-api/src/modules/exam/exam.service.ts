import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ExamSession, Block, UserBlockStats } from '@/common/entities';
import { CreateExamDto } from './dto/create-exam.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(ExamSession)
    private examRepository: Repository<ExamSession>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
    @InjectRepository(UserBlockStats)
    private statsRepository: Repository<UserBlockStats>,
    private readonly userService: UserService,
  ) {}

  async create(dto: CreateExamDto) {
    await this.userService.ensureUser(dto.userId);
    // Select blocks based on themes and user stats
    const blocks = await this.selectBlocksForExam(
      dto.userId,
      dto.themes,
      dto.blockCount || 10,
    );

    // Create exam session
    const exam = this.examRepository.create({
      userId: dto.userId,
      duration: dto.duration,
      themes: dto.themes,
    });

    const saved = await this.examRepository.save(exam);

    return {
      ...saved,
      blocks: blocks.map((b) => ({
        id: b.id,
        pvId: b.pvId,
        sectionId: b.sectionId,
        tags: b.tags,
      })),
    };
  }

  async findOne(id: string) {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: ['attempts', 'attempts.block'],
    });

    if (!exam) {
      throw new NotFoundException(`Exam session with id ${id} not found`);
    }

    return exam;
  }

  async complete(id: string) {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: ['attempts'],
    });

    if (!exam) {
      throw new NotFoundException(`Exam session with id ${id} not found`);
    }

    // Calculate overall score
    const scores = exam.attempts.map((a) => a.score);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    exam.score = avgScore;
    exam.completedAt = new Date();

    return this.examRepository.save(exam);
  }

  private async selectBlocksForExam(
    userId: string,
    themes: string[],
    count: number,
  ): Promise<Block[]> {
    // Get blocks matching themes
    const query = this.blockRepository.createQueryBuilder('block');

    if (themes.length > 0) {
      query.where('block.tags && :themes', { themes });
    }

    const allBlocks = await query.getMany();

    if (allBlocks.length === 0) {
      return [];
    }

    // Get user stats for these blocks
    const blockIds = allBlocks.map((b) => b.id);
    const stats = await this.statsRepository.find({
      where: {
        userId,
        blockId: In(blockIds),
      },
    });

    const statsMap = new Map(stats.map((s) => [s.blockId, s.masteryScore]));

    // Sort by mastery (lowest first) with some randomness
    const sorted = allBlocks.sort((a, b) => {
      const scoreA = statsMap.get(a.id) ?? 0;
      const scoreB = statsMap.get(b.id) ?? 0;
      // Add randomness to avoid always picking the same blocks
      return scoreA - scoreB + (Math.random() - 0.5) * 20;
    });

    return sorted.slice(0, count);
  }
}
