import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Block, Pv, PvSection, UserBlockStats } from "@/common/entities";
import { CompletionService } from "./completion.service";
import { CompletionController } from "./completion.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Pv, PvSection, Block, UserBlockStats])],
  controllers: [CompletionController],
  providers: [CompletionService],
  exports: [CompletionService],
})
export class CompletionModule {}
