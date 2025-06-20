import {
	pgSchema,
	pgTable,
	uuid,
	text,
	timestamp,
	pgPolicy,
	jsonb,
	varchar,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";
import { userRoles } from "./user_roles.ts";
import { workspaces } from "./workspaces.ts";

// Reference to the auth schema users table for foreign key relationship
const authSchema = pgSchema("auth");

const users = authSchema.table("users", {
	id: uuid("id").primaryKey(),
});

export const onboardingStates = [
	"pending_welcome",
	"pending_theme",
	"pending_display_name",
	"pending_workspace",
	"pending_invites",
	"completed",
] as const;
export type OnboardingState = (typeof onboardingStates)[number];

export const userProfiles = pgTable(
	"user_profiles",
	{
		id: uuid("id")
			.primaryKey()
			.references(() => users.id, { onDelete: "cascade" }),
		display_name: text("display_name"),
		email: text("email").unique(),
		avatar_url: text("avatar_url"),
		// Track which workspace the user is currently in
		workspace_id: uuid("workspace_id").references(() => workspaces.id),
		onboarding_state: varchar("onboarding_state", { enum: onboardingStates })
			.default("pending_welcome")
			.notNull(),
		metadata: jsonb("metadata"),
		created_at: timestamp("created_at").defaultNow().notNull(),
		updated_at: timestamp("updated_at").defaultNow().notNull(),
	},
	(_table) => [
		// Only authenticated users can view their own profiles
		pgPolicy("users_can_view_own_profile", {
			for: "select",
			to: authenticatedRole,
			using: sql`auth.uid() = id`,
		}),
		// Only the same user can update their own profile
		pgPolicy("users_can_update_own_profile", {
			for: "update",
			to: authenticatedRole,
			using: sql`auth.uid() = id`,
			withCheck: sql`auth.uid() = id`,
		}),
		// Prevent users from inserting new profiles (handled by trigger)
		pgPolicy("prevent_profile_insert", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`false`,
		}),
		// Prevent users from deleting profiles
		pgPolicy("prevent_profile_delete", {
			for: "delete",
			to: authenticatedRole,
			using: sql`false`,
		}),
	],
);

export const userProfilesRelations = relations(
	userProfiles,
	({ many, one }) => ({
		userRoles: many(userRoles),
		workspace: one(workspaces, {
			fields: [userProfiles.workspace_id],
			references: [workspaces.id],
		}),
	}),
);

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
