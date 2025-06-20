ALTER POLICY "users_can_view_roles_in_own_workspaces" ON "user_roles" TO authenticated USING ((auth.uid() = user_id) OR EXISTS (
				SELECT 1 FROM user_profiles
				WHERE user_profiles.id = auth.uid()
				AND user_profiles.workspace_id = workspace_id
			));