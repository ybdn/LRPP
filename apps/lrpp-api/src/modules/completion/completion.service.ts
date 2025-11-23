import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Block, Pv, PvSection, UserBlockStats } from "@/common/entities";
import {
  CompletionMode,
  GapStrategy,
  SectionCompletionProfile,
  SectionCompletionResult,
  SectionKind,
  TrainingMode,
} from "./completion.types";
import { GenerateCompletionDto } from "./dto/generate-completion.dto";
import {
  MODE_COMPLETION_PROFILES,
  resolveGapDensity,
} from "./completion-profiles";

interface Blank {
  id: string;
  position: number;
  length: number;
  expected: string;
}

interface SectionStats {
  avgMastery: number;
}

@Injectable()
export class CompletionService {
  constructor(
    @InjectRepository(Pv)
    private readonly pvRepository: Repository<Pv>,
    @InjectRepository(UserBlockStats)
    private readonly statsRepository: Repository<UserBlockStats>,
  ) {}

  async generateDocument(dto: GenerateCompletionDto) {
    const pv = await this.pvRepository.findOne({
      where: { id: dto.pvId },
      relations: ["sections", "sections.blocks"],
    });

    if (!pv) {
      throw new NotFoundException(`PV ${dto.pvId} not found`);
    }

    const requestedSections = dto.sections
      ? new Set<SectionKind>(dto.sections)
      : null;
    const sectionStatsMap = await this.loadStats(dto.userId, pv.id);
    const baseProfiles = MODE_COMPLETION_PROFILES[dto.mode] || [];

    const sections = (pv.sections || [])
      .sort((a, b) => a.order - b.order)
      .filter((section) =>
        requestedSections
          ? requestedSections.has(section.label as SectionKind)
          : true,
      )
      .map((section) =>
        this.buildSectionResult(section, {
          mode: dto.mode,
          level: dto.level,
          baseProfiles,
          sectionStats: sectionStatsMap.get(section.id),
        }),
      );

    return {
      pv: {
        id: pv.id,
        title: pv.title,
        order: pv.order,
      },
      sections,
    };
  }

  private buildSectionResult(
    section: PvSection,
    params: {
      mode: TrainingMode;
      level?: number;
      baseProfiles: SectionCompletionProfile[];
      sectionStats?: SectionStats;
    },
  ): SectionCompletionResult {
    const kind = (section.label as SectionKind) ?? "elements_fond";
    const baseProfile =
      params.baseProfiles.find((profile) => profile.sectionKind === kind) ||
      ({
        sectionKind: kind,
        completionMode: CompletionMode.READ_ONLY,
      } as SectionCompletionProfile);

    const adaptedMode = this.adaptCompletionMode(
      baseProfile.completionMode,
      params.sectionStats,
      params.mode,
    );
    const baseDensity =
      adaptedMode === CompletionMode.GAPS
        ? this.adaptGapDensity(
            resolveGapDensity(params.level, baseProfile),
            params.sectionStats,
          )
        : undefined;

    const blocks = (section.blocks || [])
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((block) =>
        this.buildBlockResult(block, {
          completionMode: adaptedMode,
          gapDensity: baseDensity,
          gapStrategy: baseProfile.gapStrategy,
        }),
      );

    return {
      sectionId: section.id,
      sectionKind: kind,
      title: section.title,
      completionMode: adaptedMode,
      gapDensity: baseDensity,
      gapStrategy: baseProfile.gapStrategy,
      blocks,
    };
  }

  private buildBlockResult(
    block: Block,
    params: {
      completionMode: CompletionMode;
      gapDensity?: number;
      gapStrategy?: GapStrategy;
    },
  ) {
    if (
      params.completionMode === CompletionMode.GAPS &&
      params.gapDensity !== undefined
    ) {
      const { maskedText, blanks, targetBlankIds } = this.maskBlockWithProfile(
        block,
        params.gapDensity,
        params.gapStrategy,
      );

      return {
        blockId: block.id,
        frameworkId: block.frameworkId,
        tags: block.tags,
        completionMode: CompletionMode.GAPS,
        textTemplate: block.textTemplate,
        maskedText,
        blanks,
        targetBlankIds,
      };
    }

    if (params.completionMode === CompletionMode.FULL_REWRITE) {
      return {
        blockId: block.id,
        frameworkId: block.frameworkId,
        tags: block.tags,
        completionMode: CompletionMode.FULL_REWRITE,
        textTemplate: block.textTemplate,
        referenceText: this.removeMarkers(block.textTemplate),
      };
    }

    return {
      blockId: block.id,
      frameworkId: block.frameworkId,
      tags: block.tags,
      completionMode: CompletionMode.READ_ONLY,
      textTemplate: block.textTemplate,
      referenceText: this.removeMarkers(block.textTemplate),
    };
  }

  private maskBlockWithProfile(
    block: Block,
    gapDensity: number,
    strategy?: GapStrategy,
  ) {
    const blanks = this.extractBlanks(block.textTemplate, block.id);
    if (blanks.length === 0) {
      return {
        maskedText: this.removeMarkers(block.textTemplate),
        blanks: [],
        targetBlankIds: [],
      };
    }

    const selectedBlanks = this.selectBlanks(blanks, gapDensity, strategy);
    const blankIds = new Set(selectedBlanks.map((blank) => blank.id));
    const maskedText = this.buildMaskedText(
      block.textTemplate,
      blanks,
      blankIds,
    );

    return {
      maskedText,
      blanks: selectedBlanks.map((blank) => ({
        id: blank.id,
        position: blank.position,
        length: blank.length,
      })),
      targetBlankIds: Array.from(blankIds),
    };
  }

  private selectBlanks(
    blanks: Blank[],
    density: number,
    strategy?: GapStrategy,
  ) {
    const count = Math.max(1, Math.round(blanks.length * density));
    let pool = blanks;

    if (strategy === GapStrategy.ARTICLES_ONLY) {
      pool = blanks.filter(
        (blank) => /\d/.test(blank.expected) || /art/i.test(blank.expected),
      );
    } else if (strategy === GapStrategy.KEYWORDS) {
      pool = blanks.filter(
        (blank) => !/\d/.test(blank.expected) && blank.expected.length >= 4,
      );
    }

    if (pool.length < count) {
      const fallback = blanks.filter((blank) => !pool.includes(blank));
      pool = [...pool, ...fallback];
    }

    return pool.slice(0, Math.min(count, blanks.length));
  }

  private adaptCompletionMode(
    baseMode: CompletionMode,
    stats: SectionStats | undefined,
    mode: TrainingMode,
  ) {
    if (!stats) {
      return baseMode;
    }

    if (stats.avgMastery <= 40) {
      return CompletionMode.FULL_REWRITE;
    }

    if (
      stats.avgMastery >= 85 &&
      baseMode === CompletionMode.GAPS &&
      mode !== TrainingMode.DICTEE
    ) {
      return CompletionMode.READ_ONLY;
    }

    return baseMode;
  }

  private adaptGapDensity(base: number, stats?: SectionStats) {
    if (!stats) {
      return base;
    }

    if (stats.avgMastery <= 40) {
      return Math.min(0.85, base + 0.25);
    }

    if (stats.avgMastery >= 80) {
      return Math.max(0.1, base - 0.15);
    }

    return base;
  }

  private async loadStats(userId: string | undefined, _pvId: string) {
    const map = new Map<string, SectionStats>();
    if (!userId) {
      return map;
    }

    const stats = await this.statsRepository.find({
      where: { userId },
      relations: ["block"],
    });
    const bySection = new Map<string, number[]>();

    stats.forEach((stat) => {
      if (!stat.block?.sectionId) {
        return;
      }
      if (!bySection.has(stat.block.sectionId)) {
        bySection.set(stat.block.sectionId, []);
      }
      bySection.get(stat.block.sectionId)?.push(stat.masteryScore);
    });

    bySection.forEach((scores, sectionId) => {
      if (scores.length === 0) {
        return;
      }
      const avg = Math.round(
        scores.reduce((sum, value) => sum + value, 0) / scores.length,
      );
      map.set(sectionId, { avgMastery: avg });
    });

    return map;
  }

  private extractBlanks(template: string, blockId: string): Blank[] {
    const regex = /\[\[([^\]]+)\]\]/g;
    const blanks: Blank[] = [];
    let match;
    let position = 0;

    while ((match = regex.exec(template)) !== null) {
      blanks.push({
        id: `${blockId}_${position}`,
        position: position++,
        length: match[1].length,
        expected: match[1],
      });
    }

    return blanks;
  }

  private buildMaskedText(
    template: string,
    blanks: Blank[],
    blankIds: Set<string>,
  ) {
    const regex = /\[\[([^\]]+)\]\]/g;
    let result = "";
    let lastIndex = 0;
    let match;
    let index = 0;

    while ((match = regex.exec(template)) !== null) {
      result += template.slice(lastIndex, match.index);
      const blank = blanks[index];
      const content = blankIds.has(blank.id)
        ? "_".repeat(Math.min(blank.length, 20))
        : match[1];
      result += content;
      lastIndex = regex.lastIndex;
      index += 1;
    }

    result += template.slice(lastIndex);
    return result;
  }

  private removeMarkers(text: string) {
    return text.replace(/\[\[([^\]]+)\]\]/g, "$1");
  }
}
