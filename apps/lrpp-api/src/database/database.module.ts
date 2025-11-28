import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Block,
  InvestigationFramework,
  Pv,
  PvContent,
  PvSection,
  User,
  Attempt,
  ExamSession,
  UserBlockStats,
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
      User,
      Attempt,
      ExamSession,
      UserBlockStats,
    ]),
  ],
  providers: [DatabaseSeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
