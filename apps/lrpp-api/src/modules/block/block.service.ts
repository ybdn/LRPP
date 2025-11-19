import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '@/common/entities';

interface FindAllOptions {
  pvId?: string;
  tag?: string;
}

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}

  async findAll(options: FindAllOptions = {}): Promise<Block[]> {
    const query = this.blockRepository.createQueryBuilder('block');

    if (options.pvId) {
      query.andWhere('block.pvId = :pvId', { pvId: options.pvId });
    }

    if (options.tag) {
      query.andWhere(':tag = ANY(block.tags)', { tag: options.tag });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Block> {
    const block = await this.blockRepository.findOne({
      where: { id },
      relations: ['pv', 'section'],
    });

    if (!block) {
      throw new NotFoundException(`Block with id ${id} not found`);
    }

    return block;
  }
}
