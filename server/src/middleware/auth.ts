import { createMiddleware } from "hono/factory";
import { getSupabase } from "../db/supabaseClient.ts";
import { getDb } from "../db/drizzle.ts";
import { eq } from "drizzle-orm";
import { userProfiles } from "../db/schema/user_profiles.ts";
import type { AuthVariables } from "../types/hono.ts";

// Create the middleware with proper typing
export const authMiddleware = createMiddleware<{
	Variables: AuthVariables;
}>(async (c, next) => {
	try {
		// Get the Authorization header
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Missing or invalid authorization header" }, 401);
		}

		// Extract the token
		const token = authHeader.split(" ")[1];
		if (!token) {
			return c.json({ error: "Missing token" }, 401);
		}

		// Get Supabase client (only for auth validation)
		const supabase = getSupabase();

		// Verify the JWT token
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (error || !user) {
			return c.json({ error: "Invalid token" }, 401);
		}

		// Get the database client
		const db = getDb();

		// Query the user profile from the database using Drizzle
		try {
			// Get the user's profile to get their workspace_id
			const [profile] = await db
				.select({ workspace_id: userProfiles.workspace_id })
				.from(userProfiles)
				.where(eq(userProfiles.id, user.id))
				.limit(1);

			if (!profile) {
				return c.json({ error: "User profile not found" }, 404);
			}

			// Set the auth variables in the context
			c.set("userId", user.id);
			c.set("workspaceId", profile.workspace_id);

			// Continue to the next middleware/handler
			await next();
		} catch (dbError) {
			console.error("Database query error:", dbError);
			return c.json(
				{ error: "Error fetching user profile from database" },
				500,
			);
		}
	} catch (error) {
		console.error("Auth middleware error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});
