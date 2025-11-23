import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { promises as fs } from "fs";
import { join, resolve } from "path";
import {
  Block,
  InvestigationFramework,
  Pv,
  PvContent,
  PvSection,
} from "@/common/entities";

interface FrameworkSeed {
  id: string;
  name: string;
  cadreLegal: string;
  justification: string;
  competence: string;
}

interface PvContentSeed {
  frameworkId: string | null;
  cadreLegal: string;
}

interface PvSeed {
  id: string;
  title: string;
  order: number;
  hasNotification: boolean;
  hasDeroulement: boolean;
  contents: PvContentSeed[];
  motivation: string;
  notification?: string;
  deroulement?: string;
  elementsFond: string;
}

@Injectable()
export class DatabaseSeedService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeedService.name);
  private readonly dataRoot = resolve(__dirname, "../../../..", "data");

  constructor(
    @InjectRepository(InvestigationFramework)
    private readonly frameworkRepository: Repository<InvestigationFramework>,
    @InjectRepository(Pv)
    private readonly pvRepository: Repository<Pv>,
    @InjectRepository(PvContent)
    private readonly pvContentRepository: Repository<PvContent>,
    @InjectRepository(PvSection)
    private readonly pvSectionRepository: Repository<PvSection>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  async onModuleInit() {
    await this.seedDatabase({ skipIfNotEmpty: true });
  }

  async seedDatabase(options: { skipIfNotEmpty?: boolean } = {}) {
    if (options.skipIfNotEmpty) {
      const pvCount = await this.pvRepository.count();
      if (pvCount > 0) {
        return;
      }
    }

    try {
      this.logger.log("Seeding initial data from /data");
      await this.seedFrameworks();
      await this.seedPvs();
      this.logger.log("Initial data seed completed");
    } catch (error) {
      this.logger.error(
        "Failed to seed database",
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async seedFrameworks() {
    const filePath = join(this.dataRoot, "frameworks.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const frameworks = JSON.parse(raw) as FrameworkSeed[];
    await this.frameworkRepository.save(frameworks);
  }

  private async seedPvs() {
    const pvsDir = join(this.dataRoot, "pvs");
    const files = (await fs.readdir(pvsDir)).filter((file) =>
      file.endsWith(".json"),
    );

    for (const file of files) {
      const raw = await fs.readFile(join(pvsDir, file), "utf-8");
      const pvData = JSON.parse(raw) as PvSeed;

      await this.pvRepository.save({
        id: pvData.id,
        title: pvData.title,
        order: pvData.order,
        hasNotification: pvData.hasNotification,
        hasDeroulement: pvData.hasDeroulement,
      });

      await this.seedPvContents(pvData);
      await this.seedSectionsAndBlocks(pvData);
    }
  }

  private async seedPvContents(pvData: PvSeed) {
    for (const content of pvData.contents) {
      await this.pvContentRepository.save({
        pvId: pvData.id,
        frameworkId: content.frameworkId ?? null,
        cadreLegal: content.cadreLegal,
        motivation: pvData.motivation,
        notification: pvData.notification ?? null,
        deroulement: pvData.deroulement ?? null,
        elementsFond: pvData.elementsFond,
      });
    }
  }

  private async seedSectionsAndBlocks(pvData: PvSeed) {
    const sections: Array<{ label: string; title: string; order: number }> = [
      { label: "cadre_legal", title: "Cadre légal", order: 1 },
      { label: "motivation", title: "Motivation / Saisine", order: 2 },
    ];

    if (pvData.hasNotification) {
      sections.push({
        label: "notification",
        title: "Notification des droits",
        order: 3,
      });
    }

    if (pvData.hasDeroulement) {
      sections.push({
        label: "deroulement",
        title: "Déroulement de la mesure",
        order: 4,
      });
    }

    sections.push({
      label: "elements_fond",
      title: "Éléments de fond",
      order: sections.length + 1,
    });

    const sectionRefs: Record<string, PvSection> = {};

    for (const sectionDef of sections) {
      const section = await this.pvSectionRepository.save({
        pvId: pvData.id,
        label: sectionDef.label,
        title: sectionDef.title,
        order: sectionDef.order,
      });
      sectionRefs[sectionDef.label] = section;
    }

    // Cadre légal blocks per framework
    const cadreSection = sectionRefs["cadre_legal"];
    if (cadreSection) {
      for (const content of pvData.contents) {
        await this.blockRepository.save({
          pvId: pvData.id,
          sectionId: cadreSection.id,
          frameworkId: content.frameworkId ?? null,
          textTemplate: content.cadreLegal,
          tags: ["cadre_legal", "articles"],
        });
      }
    }

    await this.createSimpleBlock(
      pvData,
      sectionRefs["motivation"],
      pvData.motivation,
      ["motivation"],
    );
    await this.createSimpleBlock(
      pvData,
      sectionRefs["notification"],
      pvData.notification,
      ["notification", "droits"],
    );
    await this.createSimpleBlock(
      pvData,
      sectionRefs["deroulement"],
      pvData.deroulement,
      ["deroulement", "mesure"],
    );
    await this.createSimpleBlock(
      pvData,
      sectionRefs["elements_fond"],
      pvData.elementsFond,
      ["elements_fond"],
    );
  }

  private async createSimpleBlock(
    pvData: PvSeed,
    section: PvSection | undefined,
    text: string | undefined,
    tags: string[],
  ) {
    if (!section || !text) {
      return;
    }

    await this.blockRepository.save({
      pvId: pvData.id,
      sectionId: section.id,
      frameworkId: null,
      textTemplate: text,
      tags,
    });
  }
}
