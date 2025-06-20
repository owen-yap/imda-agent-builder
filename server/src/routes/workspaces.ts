import { Hono } from "hono";
import { getDb } from "../db/drizzle.ts";
import { workspaces } from "../db/schema/workspaces.ts";
import { userRoles } from "../db/schema/user_roles.ts";
import { eq, inArray } from "drizzle-orm";
import { userProfiles } from "../db/schema/user_profiles.ts";

const workspacesRouter = new Hono();

/**
 * Create a new workspace and assign the creator as admin
 * POST /api/workspaces
 */
workspacesRouter.post("/", async (c) => {
	try {
		const db = getDb();
		const { name, userId } = await c.req.json();

		// Use a transaction to ensure all operations succeed or fail together
		const result = await db.transaction(async (tx) => {
			// 1. Create the workspace using Drizzle
			const [workspace] = await tx
				.insert(workspaces)
				.values({ name })
				.returning();

			if (!workspace) {
				throw new Error("Failed to create workspace");
			}

			// 2. Assign user as admin using Drizzle
			await tx.insert(userRoles).values({
				userId: userId,
				workspaceId: workspace.id,
				role: "admin",
			});

			// 3. Update the user's profile with the workspace_id using Drizzle
			await tx
				.update(userProfiles)
				.set({ workspace_id: workspace.id })
				.where(eq(userProfiles.id, userId));

			return workspace;
		});

		return c.json({ workspace: result });
	} catch (error: unknown) {
		console.error("Error creating workspace:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return c.json({ error: errorMessage }, 500);
	}
});

/**
 * Get all workspaces for the current user
 * GET /api/workspaces/:userId
 */
workspacesRouter.get("/:userId", async (c) => {
	try {
		const db = getDb();
		const userId = c.req.param("userId");

		// Get user roles for this user
		const roles = await db
			.select({
				workspaceId: userRoles.workspaceId,
			})
			.from(userRoles)
			.where(eq(userRoles.userId, userId));

		// Get all workspaces the user has access to
		const workspaceIds = roles.map((role) => role.workspaceId);

		if (workspaceIds.length === 0) {
			return c.json({ workspaces: [] });
		}

		// Fetch all workspaces the user has access to using a WHERE IN clause
		const workspaceData = await db
			.select()
			.from(workspaces)
			.where(inArray(workspaces.id, workspaceIds));

		return c.json({ workspaces: workspaceData });
	} catch (error: unknown) {
		console.error("Error fetching workspaces:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return c.json({ error: errorMessage }, 500);
	}
});

export { workspacesRouter };
