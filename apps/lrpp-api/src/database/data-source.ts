import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import { join, resolve } from "path";

dotenv.config({ path: join(__dirname, "../../../../.env") });

const client = process.env.DATABASE_CLIENT || "sqlite";
const workspaceRoot = resolve(__dirname, "../../../..");
const sqlitePath = process.env.SQLITE_PATH;
const sqliteDatabasePath = sqlitePath
  ? resolve(workspaceRoot, sqlitePath)
  : join(workspaceRoot, "lrpp-dev.sqlite");
const baseOptions = {
  entities: [join(__dirname, "../common/entities/*.entity{.ts,.js}")],
  migrations: [join(__dirname, "./migrations/*{.ts,.js}")],
  synchronize: false,
  logging: true,
};

let options: DataSourceOptions;

if (client === "postgres") {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be defined when DATABASE_CLIENT=postgres",
    );
  }
  options = {
    type: "postgres",
    url: process.env.DATABASE_URL,
    ...baseOptions,
  } as DataSourceOptions;
} else {
  options = {
    type: "better-sqlite3",
    database: sqliteDatabasePath,
    ...baseOptions,
  } as DataSourceOptions;
}

export const AppDataSource = new DataSource(options);
