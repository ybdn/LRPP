import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '@/common/entities';
import { GenerateFillBlanksDto } from './dto/generate-fill-blanks.dto';
import { CheckAnswersDto } from './dto/check-answers.dto';

export interface Blank {
  id: string;
  position: number;
  length: number;
  expected: string;
}

export interface FillBlanksExercise {
  blockId: string;
  maskedText: string;
  blanks: Omit<Blank, "expected">[];
}

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}

  async generateFillBlanks(
    dto: GenerateFillBlanksDto,
  ): Promise<FillBlanksExercise[]> {
    const blocks = await this.blockRepository.find({
      where: { pvId: dto.pvId },
      relations: ['section'],
      order: { sectionId: 'ASC' },
    });

    if (blocks.length === 0) {
      throw new NotFoundException(`No blocks found for PV ${dto.pvId}`);
    }

    const block = blocks[Math.floor(Math.random() * blocks.length)];
    return [this.maskBlock(block, dto.level)];
  }

  async generateDictation(blockId: string) {
    const block = await this.blockRepository.findOne({
      where: { id: blockId },
      relations: ['pv', 'section'],
    });

    if (!block) {
      throw new NotFoundException(`Block with id ${blockId} not found`);
    }

    // Remove the [[...]] markers to get clean text
    const cleanText = block.textTemplate.replace(/\[\[([^\]]+)\]\]/g, '$1');

    return {
      blockId: block.id,
      pvTitle: block.pv?.title,
      sectionLabel: block.section?.label,
      text: cleanText,
    };
  }

  async checkAnswers(dto: CheckAnswersDto) {
    const block = await this.blockRepository.findOneBy({ id: dto.blockId });

    if (!block) {
      throw new NotFoundException(`Block with id ${dto.blockId} not found`);
    }

    const blanks = this.extractBlanks(block.textTemplate, block.id);
    const answers = dto.answers ?? {};
    const targetSet = new Set(
      dto.targetBlankIds && dto.targetBlankIds.length > 0
        ? dto.targetBlankIds
        : blanks.map((blank) => blank.id),
    );

    const selectedBlanks = blanks.filter((blank) => targetSet.has(blank.id));

    const results = selectedBlanks.map((blank) => {
      const userAnswer = answers[blank.id] || '';
      const correct = this.compareAnswers(blank.expected, userAnswer);

      return {
        blankId: blank.id,
        expected: blank.expected,
        actual: userAnswer,
        correct,
      };
    });

    const correctCount = results.filter((r) => r.correct).length;
    const score =
      selectedBlanks.length > 0
        ? Math.round((correctCount / selectedBlanks.length) * 100)
        : 100;

    return {
      score,
      details: results,
    };
  }

  private maskBlock(block: Block, level: number): FillBlanksExercise {
    const blanks: Blank[] = this.extractBlanks(block.textTemplate, block.id);
    let maskedText = block.textTemplate;

    // For level 3, mask everything
    if (level === 3) {
      return {
        blockId: block.id,
        maskedText: '',
        blanks: blanks.map((b, i) => ({
          id: `${block.id}_${i}`,
          position: i,
          length: b.expected.length,
        })),
      };
    }

    // Replace [[...]] with blanks
    blanks.forEach((blank) => {
      const placeholder = "_".repeat(Math.min(blank.length, 20));
      const regex = new RegExp(
        `\\[\\[${this.escapeRegex(blank.expected)}\\]\\]`,
      );
      maskedText = maskedText.replace(regex, placeholder);
    });

    return {
      blockId: block.id,
      maskedText,
      blanks: blanks.map((b) => ({
        id: b.id,
        position: b.position,
        length: b.length,
      })),
    };
  }

  private extractBlanks(template: string, blockId?: string): Blank[] {
    const regex = /\[\[([^\]]+)\]\]/g;
    const blanks: Blank[] = [];
    let match;
    let position = 0;

    while ((match = regex.exec(template)) !== null) {
      blanks.push({
        id: blockId ? `${blockId}_${position}` : "",
        position: position++,
        length: match[1].length,
        expected: match[1],
      });
    }

    return blanks;
  }

  private compareAnswers(expected: string, actual: string): boolean {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const exp = normalize(expected);
    const act = normalize(actual);

    if (exp === act) return true;

    // Allow small typos (10% tolerance)
    const distance = this.levenshtein(exp, act);
    const maxDistance = Math.floor(exp.length * 0.1);

    return distance <= maxDistance;
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
