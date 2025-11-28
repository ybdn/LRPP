import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Pv,
  PvSection,
  InvestigationFramework,
  PvContent,
} from "@/common/entities";
import { CreatePvDto } from "./dto/create-pv.dto";
import { UpdatePvDto } from "./dto/update-pv.dto";
import { CreateSectionDto } from "./dto/create-section.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { UpdateFrameworkDto } from "./dto/update-framework.dto";
import { UpdateContentDto } from "./dto/update-content.dto";

@Injectable()
export class PvService {
  constructor(
    @InjectRepository(Pv)
    private pvRepository: Repository<Pv>,
    @InjectRepository(PvSection)
    private sectionRepository: Repository<PvSection>,
    @InjectRepository(InvestigationFramework)
    private frameworkRepository: Repository<InvestigationFramework>,
    @InjectRepository(PvContent)
    private contentRepository: Repository<PvContent>,
  ) {}

  async findAll(): Promise<Pv[]> {
    return this.pvRepository.find({
      order: { order: "ASC" },
    });
  }

  async findAllFrameworks(): Promise<InvestigationFramework[]> {
    return this.frameworkRepository.find();
  }

  async findOne(id: string): Promise<Pv> {
    const pv = await this.pvRepository.findOne({
      where: { id },
      relations: ["sections", "sections.blocks"],
    });

    if (!pv) {
      throw new NotFoundException(`PV with id ${id} not found`);
    }

    return pv;
  }

  async findSections(pvId: string): Promise<PvSection[]> {
    return this.sectionRepository.find({
      where: { pvId },
      relations: ["blocks"],
      order: { order: "ASC" },
    });
  }

  // ===== PV CRUD =====

  async create(createPvDto: CreatePvDto): Promise<Pv> {
    const pv = this.pvRepository.create(createPvDto);
    return this.pvRepository.save(pv);
  }

  async update(id: string, updatePvDto: UpdatePvDto): Promise<Pv> {
    const pv = await this.findOne(id);
    Object.assign(pv, updatePvDto);
    return this.pvRepository.save(pv);
  }

  async remove(id: string): Promise<void> {
    const pv = await this.findOne(id);
    await this.pvRepository.remove(pv);
  }

  // ===== SECTION CRUD =====

  async createSection(createSectionDto: CreateSectionDto): Promise<PvSection> {
    const section = this.sectionRepository.create(createSectionDto);
    return this.sectionRepository.save(section);
  }

  async updateSection(
    id: string,
    updateSectionDto: UpdateSectionDto,
  ): Promise<PvSection> {
    const section = await this.sectionRepository.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`Section with id ${id} not found`);
    }
    Object.assign(section, updateSectionDto);
    return this.sectionRepository.save(section);
  }

  async removeSection(id: string): Promise<void> {
    const section = await this.sectionRepository.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`Section with id ${id} not found`);
    }
    await this.sectionRepository.remove(section);
  }

  async reorderSections(
    pvId: string,
    sectionOrders: { id: string; order: number }[],
  ): Promise<PvSection[]> {
    const sections = await this.sectionRepository.find({ where: { pvId } });

    for (const orderData of sectionOrders) {
      const section = sections.find((s) => s.id === orderData.id);
      if (section) {
        section.order = orderData.order;
        await this.sectionRepository.save(section);
      }
    }

    return this.findSections(pvId);
  }

  // ===== FRAMEWORK CRUD =====

  async updateFramework(
    id: string,
    updateFrameworkDto: UpdateFrameworkDto,
  ): Promise<InvestigationFramework> {
    const framework = await this.frameworkRepository.findOne({
      where: { id },
    });
    if (!framework) {
      throw new NotFoundException(`Framework with id ${id} not found`);
    }
    Object.assign(framework, updateFrameworkDto);
    return this.frameworkRepository.save(framework);
  }

  // ===== CONTENT CRUD =====

  async findContent(pvId: string): Promise<PvContent[]> {
    return this.contentRepository.find({
      where: { pvId },
      relations: ["framework"],
    });
  }

  async updateContent(
    id: string,
    updateContentDto: UpdateContentDto,
  ): Promise<PvContent> {
    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content) {
      throw new NotFoundException(`Content with id ${id} not found`);
    }
    Object.assign(content, updateContentDto);
    return this.contentRepository.save(content);
  }
}
