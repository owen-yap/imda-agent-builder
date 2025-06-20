// schemas/worker_agents.ts
import {
	pgTable,
	text,
	uuid,
	timestamp,
	pgPolicy,
	jsonb,
	boolean,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";
import { workspaces } from "./workspaces.ts";
import { orchestratorAgents } from "./orchestrator_agents.ts";

/**
 * Worker Agents table schema
 * Represents specialized agents that handle specific tasks
 */
export const workerAgents = pgTable(
	"worker_agents",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		// Name of the worker agent
		name: text("name").notNull(),
		// Description of the worker agent
		description: text("description"),
		// Workspace this agent belongs to
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		// Orchestrator agent ID this worker is assigned to
		orchestratorId: uuid("orchestrator_id")
			.notNull()
			.references(() => orchestratorAgents.id, { onDelete: "cascade" }),
		// System prompt for the worker agent
		systemPrompt: text("system_prompt").notNull(),
		// Available tools for this worker agent in JSON format
		tools: jsonb("tools").default("[]"),
		// Whether this worker agent is active
		isActive: boolean("is_active").default(true),
		// Timestamps
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(_table) => [
		// Users can view worker agents in workspaces they're a member of
		pgPolicy("users_can_view_worker_agents", {
			for: "select",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
      )`,
		}),
		// Only admin users can modify worker agents
		pgPolicy("only_admins_can_update_worker_agents", {
			for: "update",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )`,
		}),
		pgPolicy("only_admins_can_delete_worker_agents", {
			for: "delete",
			to: authenticatedRole,
			using: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )`,
		}),
		pgPolicy("only_admins_can_insert_worker_agents", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )`,
		}),
	],
);

export const workerAgentsRelations = relations(workerAgents, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [workerAgents.workspaceId],
		references: [workspaces.id],
	}),
	orchestrator: one(orchestratorAgents, {
		fields: [workerAgents.orchestratorId],
		references: [orchestratorAgents.id],
	}),
}));

/**
 * Types derived from the schema
 */
export type WorkerAgent = typeof workerAgents.$inferSelect;
export type NewWorkerAgent = typeof workerAgents.$inferInsert;
