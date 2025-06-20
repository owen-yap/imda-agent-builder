import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema/index.ts";

// Create a lazy-loaded database connection
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Get the database client in a way that ensures env vars are loaded first
export function getDb() {
	if (dbInstance) return dbInstance;

	const databaseUrl = Deno.env.get("DATABASE_URL");
	if (!databaseUrl) {
		console.error("DATABASE_URL environment variable is not set");
		throw new Error("DATABASE_URL environment variable is not set");
	}

	// Create postgres client
	const client = postgres(databaseUrl);

	// Create and cache drizzle instance with schema
	dbInstance = drizzle(client, { schema });
	return dbInstance;
}

// Export a function to check database connection
export async function checkDatabaseConnection() {
	try {
		const db = getDb();
		// Use the underlying client to run a simple query
		await db.execute(sql`SELECT 1`);
		console.log("✅ Database connected successfully");
		return true;
	} catch (error) {
		console.error("❌ Database connection failed:", error);
		return false;
	}
}
