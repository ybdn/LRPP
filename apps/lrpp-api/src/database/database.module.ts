import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Block,
  InvestigationFramework,
  Pv,
  PvContent,
  PvSection,
} from "@/common/entities";
import { DatabaseSeedService } from "./seed.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvestigationFramework,
      Pv,
      PvContent,
      PvSection,
      Block,
    ]),
  ],
  providers: [DatabaseSeedService],
})
export class DatabaseModule {}
