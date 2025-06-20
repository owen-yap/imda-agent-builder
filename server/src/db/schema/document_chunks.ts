import {
	pgTable,
	text,
	uuid,
	timestamp,
	jsonb,
	vector,
	integer,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { documents } from "./documents.ts";
import { relations, sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";

/**
 * Document chunks table schema
 * Represents chunks of text from documents with embeddings for vector search
 * Uses pgvector extension in Supabase for storing and querying embeddings
 */
export const documentChunks = pgTable(
	"document_chunks",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		// Reference to the parent document
		documentId: uuid("document_id")
			.notNull()
			.references(() => documents.id, { onDelete: "cascade" }),
		// The content of this chunk
		content: text("content").notNull(),
		// Metadata related to this chunk (JSON stored as text)
		metadata: jsonb("metadata").notNull(),
		// The embedding vector for this chunk
		embedding: vector("embedding", { dimensions: 3072 }).notNull(),
		// Add token count for context window management
		tokenSize: integer("token_size").notNull(),
		// Timestamps
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(_table) => [
		// Prevent all direct access (table will be accessed only by the server)
		pgPolicy("prevent_chunks_select", {
			for: "select",
			to: authenticatedRole,
			using: sql`false`,
		}),
		pgPolicy("prevent_chunks_insert", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`false`,
		}),
		pgPolicy("prevent_chunks_update", {
			for: "update",
			to: authenticatedRole,
			using: sql`false`,
		}),
		pgPolicy("prevent_chunks_delete", {
			for: "delete",
			to: authenticatedRole,
			using: sql`false`,
		}),
	],
);

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
	document: one(documents, {
		fields: [documentChunks.documentId],
		references: [documents.id],
	}),
}));

/**
 * Types derived from the schema
 */
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
