import { defineConfig } from "drizzle-kit";
import 'dotenv/config'; 

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/**/*",
  out: "./supabase/migrations", // Add this
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
