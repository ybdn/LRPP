import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserBlockStats, Attempt } from "@/common/entities";

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(UserBlockStats)
    private statsRepository: Repository<UserBlockStats>,
    @InjectRepository(Attempt)
    private attemptRepository: Repository<Attempt>,
  ) {}

  async getUserStats(userId: string) {
    const stats = await this.statsRepository.find({
      where: { userId },
      relations: ["block", "block.pv", "block.section"],
    });

    const totalBlocks = stats.length;
    const avgMastery =
      totalBlocks > 0
        ? Math.round(
            stats.reduce((sum, s) => sum + s.masteryScore, 0) / totalBlocks,
          )
        : 0;

    // Group by PV
    const byPv = stats.reduce(
      (acc, s) => {
        const pvId = s.block.pvId;
        if (!acc[pvId]) {
          acc[pvId] = {
            pvId,
            pvTitle: s.block.pv?.title || pvId,
            blocks: [],
            avgMastery: 0,
          };
        }
        acc[pvId].blocks.push({
          blockId: s.blockId,
          sectionLabel: s.block.section?.label || "",
          masteryScore: s.masteryScore,
          attemptCount: s.attemptCount,
        });
        return acc;
      },
      {} as Record<
        string,
        {
          pvId: string;
          pvTitle: string;
          blocks: {
            blockId: string;
            sectionLabel: string;
            masteryScore: number;
            attemptCount: number;
          }[];
          avgMastery: number;
        }
      >,
    );

    // Calculate avg per PV
    Object.values(byPv).forEach((pv) => {
      pv.avgMastery = Math.round(
        pv.blocks.reduce((sum, b) => sum + b.masteryScore, 0) /
          pv.blocks.length,
      );
    });

    return {
      totalBlocks,
      avgMastery,
      byPv: Object.values(byPv),
    };
  }

  async getWeakBlocks(userId: string, limit: number) {
    return this.statsRepository.find({
      where: { userId },
      relations: ["block", "block.pv", "block.section"],
      order: { masteryScore: "ASC" },
      take: limit,
    });
  }

  async getProgress(userId: string) {
    // Get attempts grouped by date
    const attempts = await this.attemptRepository
      .createQueryBuilder("attempt")
      .select("DATE(attempt.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .addSelect("AVG(attempt.score)", "avgScore")
      .where("attempt.userId = :userId", { userId })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    return attempts;
  }
}
