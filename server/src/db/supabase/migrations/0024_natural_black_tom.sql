DROP POLICY IF EXISTS "users_can_view_own_playground_sessions" ON "playground_sessions" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "users_can_create_playground_sessions" ON "playground_sessions" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "only_admins_can_delete_playground_sessions" ON "playground_sessions" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "playground_sessions" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "users_can_view_own_playground_actions" ON "playground_actions" CASCADE;--> statement-breakpoint
DROP TABLE "playground_actions" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."action_role";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."action_type";