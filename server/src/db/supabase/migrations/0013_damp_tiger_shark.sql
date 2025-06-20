ALTER TABLE "document_chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "document_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "prevent_chunks_select" ON "document_chunks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "prevent_chunks_insert" ON "document_chunks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "prevent_chunks_update" ON "document_chunks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "prevent_chunks_delete" ON "document_chunks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "prevent_tasks_select" ON "document_tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "prevent_tasks_insert" ON "document_tasks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "prevent_tasks_update" ON "document_tasks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "prevent_tasks_delete" ON "document_tasks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "users_can_view_documents_in_own_workspaces" ON "documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "users_can_insert_documents_in_own_workspaces" ON "documents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "users_can_update_documents_in_own_workspaces" ON "documents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "users_can_delete_documents_in_own_workspaces" ON "documents" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "users_can_view_roles_in_own_workspaces" ON "user_roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = workspace_id
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "prevent_roles_insert" ON "user_roles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "prevent_roles_update" ON "user_roles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "prevent_roles_delete" ON "user_roles" AS PERMISSIVE FOR DELETE TO "authenticated" USING (false);--> statement-breakpoint
CREATE POLICY "authenticated_can_create_workspaces" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "users_can_view_own_workspaces" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = id 
				AND user_roles.user_id = auth.uid()
			));--> statement-breakpoint
CREATE POLICY "only_admins_can_delete_workspaces" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
				SELECT 1 FROM user_roles
				WHERE user_roles.workspace_id = id 
				AND user_roles.user_id = auth.uid()
				AND user_roles.role = 'admin'
			));--> statement-breakpoint
CREATE POLICY "prevent_workspace_update" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (false);