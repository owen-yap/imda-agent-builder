import {
	inviteUserToWorkspace,
	getWorkspaceInvitations,
	revokeInvitation,
	resendInvitation,
} from "../functions/invitationService.ts";

// Create a router for Hono instead of Express
// Assuming this is using Hono like the other routers
import { Hono } from "hono";

// Import the needed database query
import { eq } from "drizzle-orm";
import { getDb } from "../db/drizzle.ts";
import {
	workspaceInvitations,
	userProfiles,
	userRoles,
} from "../db/schema/index.ts";

const invitationsRouter = new Hono();

/**
 * Get all pending invitations for the authenticated user
 * GET /pending
 * IMPORTANT: This route must be defined BEFORE /:invitationId to avoid conflict
 */
invitationsRouter.get("/pending", async (c) => {
	try {
		const userId = c.get("userId");
		const db = getDb();

		const profile = await db.query.userProfiles.findFirst({
			where: eq(userProfiles.id, userId),
			columns: { email: true },
		});

		if (!profile?.email) {
			return c.json({ error: "User profile or email not found" }, 404);
		}

		const userEmail = profile.email;

		const pendingInvites = await db.query.workspaceInvitations.findMany({
			where: (invitations, { and, eq }) =>
				and(
					eq(invitations.email, userEmail),
					eq(invitations.status, "pending"),
				),
			with: {
				workspace: {
					columns: {
						id: true,
						name: true,
					},
				},
				inviter: {
					columns: {
						id: true,
						display_name: true,
						avatar_url: true,
					},
				},
			},
			orderBy: (invitations, { desc }) => [desc(invitations.createdAt)],
		});

		const formattedInvitations = pendingInvites.map((inv) => ({
			id: inv.id,
			email: inv.email,
			role: inv.role,
			status: inv.status,
			createdAt: inv.createdAt,
			expiresAt: inv.expiresAt,
			workspace: inv.workspace
				? {
						id: inv.workspace.id,
						name: inv.workspace.name,
					}
				: { id: "unknown", name: "Unknown Workspace" },
			inviter: inv.inviter
				? {
						id: inv.inviter.id,
						fullName: inv.inviter.display_name || "Unknown User",
						avatarUrl: inv.inviter.avatar_url || undefined,
					}
				: { id: "unknown", fullName: "Unknown User", avatarUrl: undefined },
		}));

		return c.json({ invitations: formattedInvitations }, 200);
	} catch (error) {
		console.error("Error fetching pending invitations:", error);
		return c.json({ error: "Failed to fetch pending invitations" }, 500);
	}
});

/**
 * Invite a user to a workspace
 * POST /workspaces/:workspaceId/invitations
 */
invitationsRouter.post("/workspaces/:workspaceId", async (c) => {
	try {
		const { workspaceId } = c.req.param();
		const { email, role = "member" } = await c.req.json();
		const userId = c.get("userId"); // Assuming auth middleware adds userId to context

		if (!email) {
			return c.json({ error: "Email is required" }, 400);
		}

		if (!["admin", "member"].includes(role)) {
			return c.json({ error: "Invalid role" }, 400);
		}

		const result = await inviteUserToWorkspace(
			workspaceId,
			email,
			role as "admin" | "member",
			userId,
		);

		if (result.success) {
			// Different message based on whether this was a new or existing user
			const message = result.isExistingUser
				? "Notification sent to existing user"
				: "Invitation sent successfully";

			return c.json(
				{
					message,
					invitation: result.invitation,
					isExistingUser: result.isExistingUser,
				},
				200,
			);
		}

		return c.json({ error: result.error }, 500);
	} catch (error) {
		console.error("Error in invite endpoint:", error);
		return c.json({ error: "Failed to send invitation" }, 500);
	}
});

/**
 * Get all invitations for a workspace
 * GET /workspaces/:workspaceId/invitations
 */
invitationsRouter.get("/workspaces/:workspaceId/invitations", async (c) => {
	try {
		const { workspaceId } = c.req.param();

		const result = await getWorkspaceInvitations(workspaceId);

		if (result.success) {
			return c.json({ invitations: result.invitations }, 200);
		}

		return c.json({ error: result.error }, 500);
	} catch (error) {
		console.error("Error fetching invitations:", error);
		return c.json({ error: "Failed to fetch invitations" }, 500);
	}
});

/**
 * Revoke an invitation
 * DELETE /:invitationId
 */
invitationsRouter.delete("/:invitationId", async (c) => {
	try {
		const { invitationId } = c.req.param();

		const result = await revokeInvitation(invitationId);

		if (result.success) {
			return c.json({ message: "Invitation revoked successfully" }, 200);
		}

		return c.json({ error: result.error }, 500);
	} catch (error) {
		console.error("Error revoking invitation:", error);
		return c.json({ error: "Failed to revoke invitation" }, 500);
	}
});

/**
 * Resend an invitation
 * POST /:invitationId/resend
 */
invitationsRouter.post("/:invitationId/resend", async (c) => {
	try {
		const { invitationId } = c.req.param();

		const result = await resendInvitation(invitationId);

		if (result.success) {
			return c.json({ message: "Invitation resent successfully" }, 200);
		}

		return c.json({ error: result.error }, 500);
	} catch (error) {
		console.error("Error resending invitation:", error);
		return c.json({ error: "Failed to resend invitation" }, 500);
	}
});

/**
 * Get a specific invitation by ID
 * GET /:invitationId
 * This must be AFTER specific static routes like /pending
 */
invitationsRouter.get("/:invitationId", async (c) => {
	try {
		const { invitationId } = c.req.param();
		const db = getDb();

		const invitation = await db.query.workspaceInvitations.findFirst({
			where: eq(workspaceInvitations.id, invitationId),
			with: {
				workspace: true,
				inviter: true,
			},
		});

		if (!invitation) {
			return c.json({ error: "Invitation not found" }, 404);
		}

		return c.json(
			{
				invitation: {
					...invitation,
					isExpired: new Date(invitation.expiresAt) < new Date(),
					isValid:
						invitation.status === "pending" &&
						new Date(invitation.expiresAt) >= new Date(),
				},
			},
			200,
		);
	} catch (error) {
		console.error("Error fetching invitation:", error);
		return c.json({ error: "Failed to fetch invitation" }, 500);
	}
});

/**
 * Accept an invitation
 * POST /:invitationId/accept
 */
invitationsRouter.post("/:invitationId/accept", async (c) => {
	try {
		const { invitationId } = c.req.param();
		const userId = c.get("userId");
		const db = getDb();

		// Get the invitation
		const invitation = await db.query.workspaceInvitations.findFirst({
			where: eq(workspaceInvitations.id, invitationId),
		});

		if (!invitation) {
			return c.json({ error: "Invitation not found" }, 404);
		}

		// Check if invitation is valid
		if (invitation.status !== "pending") {
			return c.json(
				{
					error: `Invitation has already been ${invitation.status}`,
				},
				400,
			);
		}

		if (new Date(invitation.expiresAt) < new Date()) {
			return c.json({ error: "Invitation has expired" }, 400);
		}

		// Update invitation status
		await db
			.update(workspaceInvitations)
			.set({ status: "accepted" })
			.where(eq(workspaceInvitations.id, invitationId));

		// Add user to workspace with specified role
		await db.insert(userRoles).values({
			userId,
			workspaceId: invitation.workspaceId,
			role: invitation.role,
		});

		// Set the user's current workspace
		await db
			.update(userProfiles)
			.set({ workspace_id: invitation.workspaceId })
			.where(eq(userProfiles.id, userId));

		return c.json(
			{
				message: "Invitation accepted successfully",
				workspaceId: invitation.workspaceId,
			},
			200,
		);
	} catch (error) {
		console.error("Error accepting invitation:", error);
		return c.json({ error: "Failed to accept invitation" }, 500);
	}
});

/**
 * Reject an invitation
 * POST /:invitationId/reject
 */
invitationsRouter.post("/:invitationId/reject", async (c) => {
	try {
		const { invitationId } = c.req.param();
		const db = getDb();

		// Get the invitation
		const invitation = await db.query.workspaceInvitations.findFirst({
			where: eq(workspaceInvitations.id, invitationId),
		});

		if (!invitation) {
			return c.json({ error: "Invitation not found" }, 404);
		}

		// Check if invitation is valid
		if (invitation.status !== "pending") {
			return c.json(
				{
					error: `Invitation has already been ${invitation.status}`,
				},
				400,
			);
		}

		if (new Date(invitation.expiresAt) < new Date()) {
			return c.json({ error: "Invitation has expired" }, 400);
		}

		// Update invitation status to rejected
		await db
			.update(workspaceInvitations)
			.set({ status: "rejected" })
			.where(eq(workspaceInvitations.id, invitationId));

		return c.json({ message: "Invitation rejected successfully" }, 200);
	} catch (error) {
		console.error("Error rejecting invitation:", error);
		return c.json({ error: "Failed to reject invitation" }, 500);
	}
});

export default invitationsRouter;
