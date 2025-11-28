import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserPvAccess, AnonymousAccess } from "@/common/entities";
import { AccessController } from "./access.controller";
import { AccessService } from "./access.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPvAccess, AnonymousAccess]),
    AuthModule,
  ],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
