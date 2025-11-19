import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pv, PvSection, InvestigationFramework } from '@/common/entities';

@Injectable()
export class PvService {
  constructor(
    @InjectRepository(Pv)
    private pvRepository: Repository<Pv>,
    @InjectRepository(PvSection)
    private sectionRepository: Repository<PvSection>,
    @InjectRepository(InvestigationFramework)
    private frameworkRepository: Repository<InvestigationFramework>,
  ) {}

  async findAll(): Promise<Pv[]> {
    return this.pvRepository.find({
      order: { order: 'ASC' },
    });
  }

  async findAllFrameworks(): Promise<InvestigationFramework[]> {
    return this.frameworkRepository.find();
  }

  async findOne(id: string): Promise<Pv> {
    const pv = await this.pvRepository.findOne({
      where: { id },
      relations: ['sections', 'sections.blocks'],
    });

    if (!pv) {
      throw new NotFoundException(`PV with id ${id} not found`);
    }

    return pv;
  }

  async findSections(pvId: string): Promise<PvSection[]> {
    return this.sectionRepository.find({
      where: { pvId },
      relations: ['blocks'],
      order: { order: 'ASC' },
    });
  }
}
