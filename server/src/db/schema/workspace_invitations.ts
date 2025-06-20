import {
	pgTable,
	uuid,
	text,
	timestamp,
	pgEnum,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { workspaces } from "./workspaces.ts";
import { userProfiles } from "./user_profiles.ts";
import { roleEnum } from "./user_roles.ts";
import { authenticatedRole } from "drizzle-orm/supabase";

// Invitation status enum
export const invitationStatusEnum = pgEnum("invitation_status", [
	"pending",
	"accepted",
	"revoked",
	"rejected",
]);

export const workspaceInvitations = pgTable(
	"workspace_invitations",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		// The workspace they're being invited to
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		// Email address of invitee
		email: text("email").notNull(),
		// Who sent the invitation
		invitedBy: uuid("invited_by")
			.notNull()
			.references(() => userProfiles.id, { onDelete: "cascade" }),
		// What role they'll have when they join
		role: roleEnum("role").notNull().default("member"),
		// Current status of invitation
		status: invitationStatusEnum("status").default("pending"),
		// Timestamps
		createdAt: timestamp("created_at").defaultNow(),
		expiresAt: timestamp("expires_at").notNull(),
	},
	(_table) => [
		// Users can view invitations for workspaces they're a member of
		pgPolicy("users_can_view_invitations_for_own_workspaces", {
			for: "select",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id 
        AND user_roles.user_id = auth.uid()
      )`,
		}),
		// Only workspace admins can add new invitations
		pgPolicy("admins_can_create_invitations", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id 
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )`,
		}),
		// Only workspace admins can update/revoke invitations
		pgPolicy("admins_can_update_invitations", {
			for: "update",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id 
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )`,
		}),
		// Similar delete policy
		pgPolicy("admins_can_delete_invitations", {
			for: "delete",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id 
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )`,
		}),
	],
);

export const workspaceInvitationsRelations = relations(
	workspaceInvitations,
	({ one }) => ({
		workspace: one(workspaces, {
			fields: [workspaceInvitations.workspaceId],
			references: [workspaces.id],
		}),
		inviter: one(userProfiles, {
			fields: [workspaceInvitations.invitedBy],
			references: [userProfiles.id],
		}),
	}),
);

export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type NewWorkspaceInvitation = typeof workspaceInvitations.$inferInsert;
