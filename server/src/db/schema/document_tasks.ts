import { pgTable, uuid, text, timestamp, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";

/**
 * Document tasks table schema
 * Represents tasks for processing documents
 */
export const documentTasks = pgTable(
	"document_tasks",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		documentId: uuid("document_id").notNull(),
		status: text("status").default("pending"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(_table) => [
		// Prevent all direct access (table will be accessed only by the server)
		pgPolicy("prevent_tasks_select", {
			for: "select",
			to: authenticatedRole,
			using: sql`false`,
		}),
		pgPolicy("prevent_tasks_insert", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`false`,
		}),
		pgPolicy("prevent_tasks_update", {
			for: "update",
			to: authenticatedRole,
			using: sql`false`,
		}),
		pgPolicy("prevent_tasks_delete", {
			for: "delete",
			to: authenticatedRole,
			using: sql`false`,
		}),
	],
);

/**
 * Types derived from the schema
 */
export type DocumentTask = typeof documentTasks.$inferSelect;
export type NewDocumentTask = typeof documentTasks.$inferInsert;
