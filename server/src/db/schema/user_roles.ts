import {
	pgTable,
	uuid,
	timestamp,
	primaryKey,
	pgEnum,
	index,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { workspaces } from "./workspaces.ts";
import { userProfiles } from "./user_profiles.ts";
import { authenticatedRole } from "drizzle-orm/supabase";

/**
 * Enum for user roles
 */
export const roleEnum = pgEnum("role_type", ["admin", "member"]);

/**
 * User roles table schema
 * Links users to workspaces with specific roles
 * Implements RBAC for workspaces
 */
export const userRoles = pgTable(
	"user_roles",
	{
		// Reference to the user
		userId: uuid("user_id")
			.notNull()
			.references(() => userProfiles.id, { onDelete: "cascade" }),
		// Reference to the workspace
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		// User's role in this workspace
		role: roleEnum("role").notNull().default("member"),
		// Timestamps
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		// Create a composite primary key from userId and workspaceId
		primaryKey({ columns: [table.userId, table.workspaceId] }),
		// Create indexes for efficient querying
		index("user_id_idx").on(table.userId),
		index("workspace_id_idx").on(table.workspaceId),
		// Users can view roles for workspaces they are a member of
		pgPolicy("users_can_view_roles_in_own_workspaces", {
			for: "select",
			to: authenticatedRole,
			using: sql`(auth.uid() = user_id) OR EXISTS (
				SELECT 1 FROM user_profiles
				WHERE user_profiles.id = auth.uid()
				AND user_profiles.workspace_id = workspace_id
			)`,
		}),
		// Prevent direct CUD operations (handled by server)
		pgPolicy("prevent_roles_insert", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`false`,
		}),
		pgPolicy("prevent_roles_update", {
			for: "update",
			to: authenticatedRole,
			using: sql`false`,
		}),
		pgPolicy("prevent_roles_delete", {
			for: "delete",
			to: authenticatedRole,
			using: sql`false`,
		}),
	],
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(userProfiles, {
		fields: [userRoles.userId],
		references: [userProfiles.id],
	}),
	workspace: one(workspaces, {
		fields: [userRoles.workspaceId],
		references: [workspaces.id],
	}),
}));

/**
 * Types derived from the schema
 */
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
