import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import { join, resolve } from "path";

dotenv.config({ path: join(__dirname, "../../../../.env") });

const client = process.env.DATABASE_CLIENT || "sqlite";
const isDev = process.env.NODE_ENV !== "production";
const workspaceRoot = resolve(__dirname, "../../../..");
const sqlitePath = process.env.SQLITE_PATH;
const sqliteDatabasePath = sqlitePath
  ? resolve(workspaceRoot, sqlitePath)
  : join(workspaceRoot, "lrpp-dev.sqlite");
const baseOptions = {
  entities: [join(__dirname, "../common/entities/*.entity{.ts,.js}")],
  migrations: [join(__dirname, "./migrations/*{.ts,.js}")],
  logging: isDev,
};

let options: DataSourceOptions;

if (client === "postgres") {
  const url = process.env.DATABASE_URL;

  if (url) {
    options = {
      type: "postgres",
      url,
      ...baseOptions,
      synchronize: false, // Always use migrations
    } as DataSourceOptions;
  } else {
    options = {
      type: "postgres",
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || "5432", 10),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      ...baseOptions,
      synchronize: false, // Always use migrations
    } as DataSourceOptions;
  }
} else {
  options = {
    type: "better-sqlite3",
    database: sqliteDatabasePath,
    ...baseOptions,
    synchronize: true, // Auto-sync for SQLite in development
  } as DataSourceOptions;
}

export const AppDataSource = new DataSource(options);
