import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join, resolve } from "path";
import { PvModule } from "./modules/pv/pv.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TicketModule } from "./modules/ticket/ticket.module";
import { AccessModule } from "./modules/access/access.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { PromoModule } from "./modules/promo/promo.module";

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

          if (url) {
            return {
              type: "postgres",
              url,
              autoLoadEntities: true,
              migrations: [join(__dirname, "database/migrations/*{.ts,.js}")],
              synchronize: false, // Never auto-sync PostgreSQL - use migrations
              migrationsRun: true, // Automatically run migrations on startup
              logging: configService.get("NODE_ENV") === "development",
            };
          }

          return {
            type: "postgres",
            host: configService.get<string>("DATABASE_HOST"),
            port: parseInt(configService.get<string>("DATABASE_PORT") || "5432", 10),
            username: configService.get<string>("DATABASE_USER"),
            password: configService.get<string>("DATABASE_PASSWORD"),
            database: configService.get<string>("DATABASE_NAME"),
            autoLoadEntities: true,
            migrations: [join(__dirname, "database/migrations/*{.ts,.js}")],
            synchronize: false, // Never auto-sync PostgreSQL - use migrations
            migrationsRun: true, // Automatically run migrations on startup
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
    DatabaseModule,
    AuthModule,
    TicketModule,
    AccessModule,
    SubscriptionModule,
    PromoModule,
  ],
})
export class AppModule { }
