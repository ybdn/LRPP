import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join, resolve } from "path";
import { PvModule } from "./modules/pv/pv.module";
import { BlockModule } from "./modules/block/block.module";
import { AttemptModule } from "./modules/attempt/attempt.module";
import { StatsModule } from "./modules/stats/stats.module";
import { ExerciseModule } from "./modules/exercise/exercise.module";
import { ExamModule } from "./modules/exam/exam.module";
import { DatabaseModule } from "./database/database.module";
import { CompletionModule } from "./modules/completion/completion.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const client = configService.get<string>("DATABASE_CLIENT") || "sqlite";
        const isDev = configService.get("NODE_ENV") !== "production";

        if (client === "postgres") {
          const url = configService.get<string>("DATABASE_URL");
          if (!url) {
            throw new Error(
              "DATABASE_URL must be defined when DATABASE_CLIENT=postgres",
            );
          }
          return {
            type: "postgres",
            url,
            autoLoadEntities: true,
            synchronize: isDev,
            logging: configService.get("NODE_ENV") === "development",
          };
        }

        const workspaceRoot = resolve(__dirname, "../../..");
        const sqlitePath = configService.get<string>("SQLITE_PATH");
        const databasePath = sqlitePath
          ? resolve(workspaceRoot, sqlitePath)
          : join(workspaceRoot, "lrpp-dev.sqlite");

        return {
          type: "better-sqlite3",
          database: databasePath,
          autoLoadEntities: true,
          synchronize: true,
          logging: configService.get("NODE_ENV") === "development",
        };
      },
      inject: [ConfigService],
    }),
    PvModule,
    BlockModule,
    AttemptModule,
    StatsModule,
    ExerciseModule,
    ExamModule,
    DatabaseModule,
    CompletionModule,
  ],
})
export class AppModule {}
