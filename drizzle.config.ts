import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  driver: "better-sqlite",
  dbCredentials: {
    url: "./database.sqlite",
  },
  verbose: true,
  strict: true,
});
