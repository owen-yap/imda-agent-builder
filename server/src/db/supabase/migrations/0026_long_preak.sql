CREATE TYPE "public"."action_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('user-message', 'tool-invocation', 'orchestration-decision', 'assistant-message');--> statement-breakpoint
CREATE TABLE "agent_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_session_id" uuid NOT NULL,
	"role" "action_role" NOT NULL,
	"action_type" "action_type" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agent_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" text NOT NULL,
	"orchestrator_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agent_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_agent_session_id_agent_sessions_id_fk" FOREIGN KEY ("agent_session_id") REFERENCES "public"."agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_orchestrator_id_orchestrator_agents_id_fk" FOREIGN KEY ("orchestrator_id") REFERENCES "public"."orchestrator_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "users_can_view_actions_for_accessible_sessions" ON "agent_actions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
				SELECT 1 FROM agent_sessions
				JOIN orchestrator_agents ON agent_sessions.orchestrator_id = orchestrator_agents.id
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE agent_sessions.id = agent_session_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "users_can_create_actions_for_accessible_sessions" ON "agent_actions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
				SELECT 1 FROM agent_sessions
				JOIN orchestrator_agents ON agent_sessions.orchestrator_id = orchestrator_agents.id
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE agent_sessions.id = agent_session_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "users_can_update_own_actions" ON "agent_actions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
				SELECT 1 FROM agent_sessions
				JOIN orchestrator_agents ON agent_sessions.orchestrator_id = orchestrator_agents.id
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE agent_sessions.id = agent_session_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "prevent_action_deletion" ON "agent_actions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "users_can_view_sessions_for_accessible_orchestrators" ON "agent_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
				SELECT 1 FROM orchestrator_agents
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE orchestrator_agents.id = orchestrator_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "users_can_create_sessions_for_accessible_orchestrators" ON "agent_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
				SELECT 1 FROM orchestrator_agents
				JOIN user_roles ON orchestrator_agents.workspace_id = user_roles.workspace_id
				WHERE orchestrator_agents.id = orchestrator_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "prevent_session_updates" ON "agent_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "prevent_session_deletion" ON "agent_sessions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (false);