CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"role" "role_type" DEFAULT 'member' NOT NULL,
	"status" "invitation_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_user_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER POLICY "authenticated_can_view_profiles" ON "user_profiles" RENAME TO "users_can_view_own_profile";--> statement-breakpoint
CREATE POLICY "users_can_view_invitations_for_own_workspaces" ON "workspace_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id 
        AND user_roles.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "admins_can_create_invitations" ON "workspace_invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id 
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "admins_can_update_invitations" ON "workspace_invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id 
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "admins_can_delete_invitations" ON "workspace_invitations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.workspace_id = workspace_id 
        AND user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      ));