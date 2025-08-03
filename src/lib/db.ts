import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// This will prevent the app from crashing if the DATABASE_URL is not set.
// A valid database connection is still required for the faucet to work.
if (!connectionString || connectionString.includes("YOUR_DATABASE_URL_HERE")) {
  console.warn(
    "DATABASE_URL environment variable is not set correctly. Using a placeholder to prevent app crash. Database functionality will be limited."
  );
}

const client = postgres(connectionString || "postgresql://user:password@host:port/db?ssl=require");
export const db = drizzle(client, { schema });
