import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Block, Pv, PvContent } from "@/common/entities";
import { ExerciseController } from "./exercise.controller";
import { ExerciseService } from "./exercise.service";

@Module({
  imports: [TypeOrmModule.forFeature([Block, Pv, PvContent])],
  controllers: [ExerciseController],
  providers: [ExerciseService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
