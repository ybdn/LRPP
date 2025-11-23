import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Pv,
  PvSection,
  InvestigationFramework,
  PvContent,
} from "@/common/entities";
import { PvController } from "./pv.controller";
import { PvService } from "./pv.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pv,
      PvSection,
      InvestigationFramework,
      PvContent,
    ]),
  ],
  controllers: [PvController],
  providers: [PvService],
  exports: [PvService],
})
export class PvModule {}
