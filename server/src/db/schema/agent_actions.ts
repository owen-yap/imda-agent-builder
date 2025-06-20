import {
	pgTable,
	text,
	uuid,
	timestamp,
	pgPolicy,
	pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";
import { agentSessions } from "./agent_sessions.ts";
// Remove direct import to avoid circular dependency

/**
 * Enum for action roles
 */
export const actionRoleEnum = pgEnum("action_role", ["user", "assistant"]);

/**
 * Enum for action types
 */
export const actionTypeEnum = pgEnum("action_type", [
	"user-message",
	"tool-invocation",
	"orchestration-decision",
	"assistant-message",
]);

/**
 * Agent Actions table schema
 * Represents actions performed within an agent session
 */
export const agentActions = pgTable(
	"agent_actions",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		// Reference to the agent session
		agentSessionId: uuid("agent_session_id")
			.notNull()
			.references(() => agentSessions.id, { onDelete: "cascade" }),
		role: actionRoleEnum("role").notNull(),
		// Type of action
		actionType: actionTypeEnum("action_type").notNull(),
		// Content of the action
		content: text("content").notNull(),
		// Timestamps for ordering
		createdAt: timestamp("created_at").defaultNow(),
	},
	(_table) => [
		// Users can only see actions for sessions they have access to
		pgPolicy("users_can_view_actions_for_accessible_sessions", {
			for: "select",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM agent_sessions
				JOIN orchestrator_agents ON agent_sessions.orchestrator_id = orchestrator_agents.id
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE agent_sessions.id = agent_session_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Users can create actions for sessions they have access to
		pgPolicy("users_can_create_actions_for_accessible_sessions", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`EXISTS (
				SELECT 1 FROM agent_sessions
				JOIN orchestrator_agents ON agent_sessions.orchestrator_id = orchestrator_agents.id
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE agent_sessions.id = agent_session_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Users can update their own actions
		pgPolicy("users_can_update_own_actions", {
			for: "update",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM agent_sessions
				JOIN orchestrator_agents ON agent_sessions.orchestrator_id = orchestrator_agents.id
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE agent_sessions.id = agent_session_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Prevent deletion of actions
		pgPolicy("prevent_action_deletion", {
			for: "delete",
			to: authenticatedRole,
			using: sql`false`,
		}),
	],
);

// Define the relationships for agent actions
export const agentActionsRelations = relations(agentActions, ({ one }) => ({
	session: one(agentSessions, {
		fields: [agentActions.agentSessionId],
		references: [agentSessions.id],
		relationName: "session_actions",
	}),
}));

/**
 * Types derived from the schema
 */
export type AgentAction = typeof agentActions.$inferSelect;
export type NewAgentAction = typeof agentActions.$inferInsert;
