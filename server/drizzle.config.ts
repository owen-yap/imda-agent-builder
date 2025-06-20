import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema/*.ts",
	schemaFilter: ["public"],
	out: "./src/db/supabase/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: Deno.env.get("DATABASE_URL") ?? "",
	},
	verbose: true,
});
