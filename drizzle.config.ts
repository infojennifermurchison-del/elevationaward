import "dotenv/config";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

const dbFile = process.env.DATABASE_FILE
  ? path.resolve(process.env.DATABASE_FILE)
  : path.resolve(process.cwd(), "data", "app.db");

export default defineConfig({
  dialect: "sqlite",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: dbFile,
  },
});
