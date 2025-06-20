// schemas/orchestrator_agents.ts
import { pgTable, text, uuid, timestamp, pgPolicy } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";
import { workspaces } from "./workspaces.ts";
import { workerAgents } from "./worker_agents.ts";
import { agentSessions } from "./agent_sessions.ts";

/**
 * Orchestrator Agents table schema
 * Represents high-level agents that can delegate tasks to worker agents
 */
export const orchestratorAgents = pgTable(
	"orchestrator_agents",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		// Name of the orchestrator agent
		name: text("name").notNull(),
		// Description of the orchestrator agent
		description: text("description"),
		// Workspace this agent belongs to
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		// System prompt for the orchestrator agent
		systemPrompt: text("system_prompt").notNull(),
		// Timestamps
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(_table) => [
		// Users can only see orchestrator agents in workspaces they're a member of
		pgPolicy("users_can_view_own_orchestrator_agents", {
			for: "select",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
      )`,
		}),
		// Only admin users can update or delete orchestrator agents
		pgPolicy("only_admins_can_modify_orchestrator_agents", {
			for: "update",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )`,
		}),
		pgPolicy("only_admins_can_delete_orchestrator_agents", {
			for: "delete",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )`,
		}),
		// Only workspace members can create orchestrator agents
		pgPolicy("members_can_create_orchestrator_agents", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
      )`,
		}),
	],
);

export const orchestratorAgentsRelations = relations(
	orchestratorAgents,
	({ one, many }) => ({
		workspace: one(workspaces, {
			fields: [orchestratorAgents.workspaceId],
			references: [workspaces.id],
		}),
		workerAgents: many(workerAgents),
		sessions: many(agentSessions),
	}),
);

/**
 * Types derived from the schema
 */
export type OrchestratorAgent = typeof orchestratorAgents.$inferSelect;
export type NewOrchestratorAgent = typeof orchestratorAgents.$inferInsert;
