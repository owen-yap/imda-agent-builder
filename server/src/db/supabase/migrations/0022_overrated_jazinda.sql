CREATE TABLE "playground_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"orchestrator_agent_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "playground_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "playground_sessions" ADD CONSTRAINT "playground_sessions_orchestrator_agent_id_orchestrator_agents_id_fk" FOREIGN KEY ("orchestrator_agent_id") REFERENCES "public"."orchestrator_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "users_can_view_own_playground_sessions" ON "playground_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM orchestrator_agents oa
        JOIN user_roles ur ON ur.workspace_id = oa.workspace_id
        WHERE oa.id = orchestrator_agent_id
        AND ur.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "users_can_create_playground_sessions" ON "playground_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM orchestrator_agents oa
        JOIN user_roles ur ON ur.workspace_id = oa.workspace_id
        WHERE oa.id = orchestrator_agent_id
        AND ur.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "only_admins_can_delete_playground_sessions" ON "playground_sessions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM orchestrator_agents oa
        JOIN user_roles ur ON ur.workspace_id = oa.workspace_id
        WHERE oa.id = orchestrator_agent_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'admin'
      ));