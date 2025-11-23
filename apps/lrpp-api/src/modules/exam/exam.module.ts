import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  ExamSession,
  Block,
  UserBlockStats,
  User,
  Attempt,
} from "@/common/entities";
import { ExamController } from "./exam.controller";
import { ExamService } from "./exam.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamSession,
      Block,
      UserBlockStats,
      User,
      Attempt,
    ]),
    UserModule,
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
