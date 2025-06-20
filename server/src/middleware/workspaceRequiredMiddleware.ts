import type { MiddlewareHandler } from "hono";
import type { AuthVariables } from "../types/hono.ts";
import { getDb } from "../db/drizzle.ts";
import { userRoles } from "../db/schema/user_roles.ts";
import { eq, and } from "drizzle-orm";

/**
 * Middleware that checks if the user has a workspace ID
 * and returns a 400 error if they don't.
 * Also ensures the user belongs to the workspace.
 */
export const workspaceRequiredMiddleware: MiddlewareHandler<{
	Variables: AuthVariables;
}> = async (c, next) => {
	const workspaceId = c.get("workspaceId");
	const userId = c.get("userId"); // Assuming userId is set in the context

	if (!workspaceId) {
		return c.json(
			{
				error: "User does not have an associated workspace",
			},
			400,
		);
	}

	if (!userId) {
		return c.json(
			{
				error: "User ID is required",
			},
			400,
		);
	}

	// Check if the user belongs to the workspace using the database
	try {
		const db = getDb();
		const userWorkspaceRole = await db
			.select()
			.from(userRoles)
			.where(
				and(
					eq(userRoles.userId, userId),
					eq(userRoles.workspaceId, workspaceId),
				),
			);

		if (userWorkspaceRole.length === 0) {
			return c.json(
				{
					error: "User does not belong to the workspace",
				},
				403,
			);
		}
	} catch (error) {
		console.error("Error checking user workspace membership:", error);
		return c.json(
			{
				error: "Failed to verify workspace membership",
			},
			500,
		);
	}

	await next();
};
