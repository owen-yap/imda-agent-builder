import {
	pgTable,
	text,
	uuid,
	timestamp,
	integer,
	boolean,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { documentChunks } from "./document_chunks.ts";
import { workspaces } from "./workspaces.ts";
import { authenticatedRole } from "drizzle-orm/supabase";

/**
 * Documents table schema
 * Represents documents uploaded by users to Supabase Storage
 */
export const documents = pgTable(
	"documents",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		// Reference to the workspace this document belongs to
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		// Original filename provided by the user
		fileName: text("file_name").notNull(),
		// MIME type of the file (application/pdf, text/plain, etc.)
		fileType: text("file_type").notNull(),
		// Size of the file in bytes
		fileSize: integer("file_size").notNull(),
		// Path to the file in Supabase Storage (e.g. "documents/{userId}/{fileName}")
		storagePath: text("storage_path").notNull(),
		// User-friendly title for the document
		title: text("title").notNull(),
		// Optional description or notes about the document
		description: text("description"),
		// Flag to track if the document has been processed (for AI analysis)
		isProcessed: boolean("is_processed").default(false),
		// Timestamps
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(_table) => [
		// Users can view documents in workspaces they belong to
		pgPolicy("users_can_view_documents_in_own_workspaces", {
			for: "select",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Users can insert documents in workspaces they belong to
		pgPolicy("users_can_insert_documents_in_own_workspaces", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Users can update documents in workspaces they belong to
		pgPolicy("users_can_update_documents_in_own_workspaces", {
			for: "update",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Users can delete documents in workspaces they belong to
		pgPolicy("users_can_delete_documents_in_own_workspaces", {
			for: "delete",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
	],
);

export const documentsRelations = relations(documents, ({ many, one }) => ({
	documentChunks: many(documentChunks),
	workspace: one(workspaces, {
		fields: [documents.workspaceId],
		references: [workspaces.id],
	}),
}));

/**
 * Types derived from the schema
 */
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
