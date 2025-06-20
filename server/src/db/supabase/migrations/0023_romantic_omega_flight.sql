CREATE TYPE "public"."action_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('message', 'orchestration_initiated', 'orchestration_decision', 'tool_call');--> statement-breakpoint
CREATE TABLE "playground_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "action_role" NOT NULL,
	"action_type" "action_type" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "playground_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "playground_actions" ADD CONSTRAINT "playground_actions_session_id_playground_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."playground_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "users_can_view_own_playground_actions" ON "playground_actions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM playground_sessions ps
        JOIN orchestrator_agents oa ON oa.id = ps.orchestrator_agent_id
        JOIN user_roles ur ON ur.workspace_id = oa.workspace_id
        WHERE ps.id = session_id
        AND ur.user_id = auth.uid()
      ));