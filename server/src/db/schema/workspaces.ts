import { pgTable, text, uuid, timestamp, pgPolicy } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { documents } from "./documents.ts";
import { userRoles } from "./user_roles.ts";
import { authenticatedRole } from "drizzle-orm/supabase";
import { userProfiles } from "./user_profiles.ts";

/**
 * Workspaces table schema
 * Represents workspaces that contain documents
 */
export const workspaces = pgTable(
	"workspaces",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		// Name of the workspace
		name: text("name").notNull(),
		// Optional description of the workspace
		description: text("description"),
		// Timestamps
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(_table) => [
		// Only authenticated users can create workspaces
		pgPolicy("authenticated_can_create_workspaces", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`true`,
		}),
		// Users can only see workspaces they're a member of
		pgPolicy("users_can_view_own_workspaces", {
			for: "select",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = id 
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Only admin users can delete workspaces
		pgPolicy("only_admins_can_delete_workspaces", {
			for: "delete",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = id 
				AND user_roles.user_id = auth.uid()
				AND user_roles.role = 'admin'
			)`,
		}),
		// Prevent direct updates to workspaces (handled by server)
		pgPolicy("prevent_workspace_update", {
			for: "update",
			to: authenticatedRole,
			using: sql`false`,
		}),
	],
);

export const workspacesRelations = relations(workspaces, ({ many }) => ({
	documents: many(documents),
	userRoles: many(userRoles),
	userProfiles: many(userProfiles),
}));

/**
 * Types derived from the schema
 */
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
