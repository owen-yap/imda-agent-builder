CREATE TABLE "orchestrator_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"workspace_id" uuid NOT NULL,
	"system_prompt" text NOT NULL,
	"rules" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "orchestrator_agents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "worker_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"workspace_id" uuid NOT NULL,
	"orchestrator_id" uuid NOT NULL,
	"system_prompt" text NOT NULL,
	"tools" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "worker_agents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orchestrator_agents" ADD CONSTRAINT "orchestrator_agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_agents" ADD CONSTRAINT "worker_agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_agents" ADD CONSTRAINT "worker_agents_orchestrator_id_orchestrator_agents_id_fk" FOREIGN KEY ("orchestrator_id") REFERENCES "public"."orchestrator_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "users_can_view_own_orchestrator_agents" ON "orchestrator_agents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "only_admins_can_modify_orchestrator_agents" ON "orchestrator_agents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "only_admins_can_delete_orchestrator_agents" ON "orchestrator_agents" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "members_can_create_orchestrator_agents" ON "orchestrator_agents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "users_can_view_worker_agents" ON "worker_agents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "only_admins_can_update_worker_agents" ON "worker_agents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "only_admins_can_delete_worker_agents" ON "worker_agents" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "only_admins_can_insert_worker_agents" ON "worker_agents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      ));