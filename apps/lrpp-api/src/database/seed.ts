import { join, resolve } from "path";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { DatabaseSeedService } from "./seed.service";
import {
  Block,
  InvestigationFramework,
  Pv,
  PvContent,
  PvSection,
} from "@/common/entities";

dotenv.config({ path: join(__dirname, "../../../../.env") });

const client = process.env.DATABASE_CLIENT || "sqlite";
const isPostgres = client === "postgres";

const workspaceRoot = resolve(__dirname, "../../../..");
const sqliteDatabasePath = process.env.SQLITE_PATH
  ? resolve(workspaceRoot, process.env.SQLITE_PATH)
  : join(workspaceRoot, "lrpp-dev.sqlite");

const dataSource = new DataSource(
  isPostgres
    ? {
        type: "postgres",
        url: process.env.DATABASE_URL,
        entities: [InvestigationFramework, Pv, PvContent, PvSection, Block],
        synchronize: true,
        logging: true,
      }
    : {
        type: "better-sqlite3",
        database: sqliteDatabasePath,
        entities: [InvestigationFramework, Pv, PvContent, PvSection, Block],
        synchronize: true,
        logging: true,
      },
);

async function seed() {
  console.log("Connecting to database...");
  await dataSource.initialize();
  await dataSource.synchronize(true);

  const seedService = new DatabaseSeedService(
    dataSource.getRepository(InvestigationFramework),
    dataSource.getRepository(Pv),
    dataSource.getRepository(PvContent),
    dataSource.getRepository(PvSection),
    dataSource.getRepository(Block),
  );

  console.log("Loading fixtures...");
  await seedService.seedDatabase({ skipIfNotEmpty: false });

  await dataSource.destroy();
  console.log("Seed completed successfully!");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
