import { pgTable, text, uuid, timestamp, pgPolicy } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";
import { orchestratorAgents } from "./orchestrator_agents.ts";
import { agentActions } from "./agent_actions.ts";

/**
 * Agent Sessions table schema
 * Represents a session of interaction with an orchestrator agent
 */
export const agentSessions = pgTable(
	"agent_sessions",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		title: text("title").notNull(),
		// IP address of the client
		ipAddress: text("ip_address").notNull(),
		// Reference to the orchestrator agent
		orchestratorId: uuid("orchestrator_id")
			.notNull()
			.references(() => orchestratorAgents.id, { onDelete: "cascade" }),
		// Timestamp when the session was created
		createdAt: timestamp("created_at").defaultNow(),
	},
	(_table) => [
		// Users can view sessions for orchestrators they have access to
		pgPolicy("users_can_view_sessions_for_accessible_orchestrators", {
			for: "select",
			to: authenticatedRole,
			using: sql`EXISTS (
				SELECT 1 FROM orchestrator_agents
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE orchestrator_agents.id = orchestrator_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Users can create sessions for orchestrators they have access to
		pgPolicy("users_can_create_sessions_for_accessible_orchestrators", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`EXISTS (
				SELECT 1 FROM orchestrator_agents
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE orchestrator_agents.id = orchestrator_id
				AND user_roles.user_id = auth.uid()
			)`,
		}),
		// Prevent updating sessions
		pgPolicy("prevent_session_updates", {
			for: "update",
			to: authenticatedRole,
			using: sql`false`,
		}),
		// Prevent deleting sessions
		pgPolicy("prevent_session_deletion", {
			for: "delete",
			to: authenticatedRole,
			using: sql`false`,
		}),
	],
);

// Create the relationship with orchestrator agents and agent actions
export const agentSessionsRelations = relations(
	agentSessions,
	({ one, many }) => ({
		orchestrator: one(orchestratorAgents, {
			fields: [agentSessions.orchestratorId],
			references: [orchestratorAgents.id],
		}),
		actions: many(agentActions, {
			relationName: "actions",
		}),
	}),
);

/**
 * Types derived from the schema
 */
export type AgentSession = typeof agentSessions.$inferSelect;
export type NewAgentSession = typeof agentSessions.$inferInsert;
