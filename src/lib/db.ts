import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle<typeof schema>>;

// This will prevent the app from crashing if the DATABASE_URL is not set.
// A valid database connection is still required for the faucet to work.
if (!connectionString || connectionString.includes("YOUR_DATABASE_URL_HERE") || connectionString.includes("user:password")) {
  console.warn(
    "DATABASE_URL environment variable is not set or is a placeholder. Using a mock database object to prevent app crash. Database functionality will be disabled."
  );
  // Use a mock db object to avoid crashing the app.
  // This satisfies the type checker and allows the app to build and run.
  const mockClient = () => {
    throw new Error("Database not configured. Please set the DATABASE_URL environment variable.");
  }
  
  db = {
    select: mockClient,
    insert: mockClient,
    update: mockClient,
    delete: mockClient,
    query: new Proxy({}, {
        get(target, prop) {
            return mockClient;
        }
    }),
  } as any;


} else {
  const client = postgres(connectionString);
  db = drizzle(client, { schema });
}

export { db };
