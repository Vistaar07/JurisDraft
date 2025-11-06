import postgres from "postgres";

// Ensure you have the DATABASE_URL in your .env.local file
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// This will use the DATABASE_URL from your .env.local
const sql = postgres(connectionString);

export default sql;
