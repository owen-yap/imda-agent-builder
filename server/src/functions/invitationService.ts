import { eq } from "drizzle-orm";
import {
	workspaceInvitations,
	userRoles,
	userProfiles,
} from "../db/schema/index.ts";

// Import the Supabase and Drizzle clients
import { getSupabase } from "../db/supabaseClient.ts";
import { getDb } from "../db/drizzle.ts";

// Set invitation expiry time (7 days by default)
const INVITATION_EXPIRY_DAYS = 7;

/**
 * Invites a user to a workspace by email
 * Creates a workspace invitation record and sends an email invitation
 */
export async function inviteUserToWorkspace(
	workspaceId: string,
	email: string,
	role: "admin" | "member",
	invitedBy: string,
) {
	try {
		const db = getDb();
		const supabase = getSupabase();

		// 1. Check if the user already exists in our database
		const existingUserProfile = await db.query.userProfiles.findFirst({
			where: eq(userProfiles.email, email),
		});
		const isExistingUser = !!existingUserProfile;

		// Calculate expiration date
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

		// 2. Create the invitation record in our database
		const [invitation] = await db
			.insert(workspaceInvitations)
			.values({
				workspaceId,
				email,
				invitedBy,
				role,
				expiresAt,
				status: "pending",
			})
			.returning();

		if (isExistingUser) {
			// User already exists, just log the invitation, no email needed from this flow.
			console.log(
				`User ${email} already exists. Invitation record created, no email sent.`,
			);
			return { success: true, invitation, isExistingUser: true };
		}

		// User is new, attempt to send an invitation email via Supabase Auth
		try {
			const { data, error: emailError } =
				await supabase.auth.admin.inviteUserByEmail(email, {
					data: {
						workspaceInvitation: workspaceId,
						invitedRole: role,
						invitationId: invitation.id,
					},
					redirectTo: `${Deno.env.get("CLIENT_URL")}/welcome?invitationId=${invitation.id}`,
				});

			if (emailError) {
				// If sending email failed, delete the invitation record we just created
				console.error(
					"Failed to send Supabase invitation email to new user, rolling back invitation record:",
					emailError.message,
				);
				await db
					.delete(workspaceInvitations)
					.where(eq(workspaceInvitations.id, invitation.id));
				throw new Error(
					`Failed to send invitation email: ${emailError.message}`,
				);
			}
			// Email sent successfully to new user
			return { success: true, data, invitation, isExistingUser: false };
		} catch (supabaseError) {
			// Catch errors from the email sending block, ensure cleanup
			console.error(
				"Error during Supabase email sending for new user:",
				supabaseError,
			);
			// Attempt to delete the invitation if it was created
			if (invitation?.id) {
				await db
					.delete(workspaceInvitations)
					.where(eq(workspaceInvitations.id, invitation.id));
			}
			throw supabaseError; // Re-throw to be caught by the outer catch
		}
	} catch (error) {
		console.error("Error in inviteUserToWorkspace:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unknown error inviting user",
		};
	}
}

/**
 * Handle when a user signs up after receiving an invitation
 * This should be called from an auth hook after user registration
 */
export async function handleInvitationAcceptance(
	userId: string,
	metadata: Record<string, unknown>,
) {
	try {
		const db = getDb();

		// Check if user signed up from an invitation
		if (metadata?.workspaceInvitation) {
			const invitationId = metadata.invitationId as string;

			// Find the invitation
			const invitation = await db.query.workspaceInvitations.findFirst({
				where: eq(workspaceInvitations.id, invitationId),
			});

			if (invitation) {
				// Make sure invitation hasn't expired
				if (new Date(invitation.expiresAt) < new Date()) {
					return { success: false, error: "Invitation has expired" };
				}

				// Update invitation status
				await db
					.update(workspaceInvitations)
					.set({ status: "accepted" })
					.where(eq(workspaceInvitations.id, invitation.id));

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

				return { success: true };
			}
		}

		return { success: false, error: "No valid invitation found" };
	} catch (error) {
		console.error("Error handling invitation acceptance:", error);
		return { success: false, error };
	}
}

/**
 * Get all invitations for a workspace
 */
export async function getWorkspaceInvitations(workspaceId: string) {
	try {
		const db = getDb();

		const invitations = await db.query.workspaceInvitations.findMany({
			where: eq(workspaceInvitations.workspaceId, workspaceId),
			with: {
				inviter: true,
			},
		});

		return { success: true, invitations };
	} catch (error) {
		console.error("Error fetching workspace invitations:", error);
		return { success: false, error };
	}
}

/**
 * Revoke a pending invitation
 */
export async function revokeInvitation(invitationId: string) {
	try {
		const db = getDb();

		await db
			.update(workspaceInvitations)
			.set({ status: "revoked" })
			.where(eq(workspaceInvitations.id, invitationId));

		return { success: true };
	} catch (error) {
		console.error("Error revoking invitation:", error);
		return { success: false, error };
	}
}

/**
 * Resend an invitation email for a pending invitation
 */
export async function resendInvitation(invitationId: string) {
	try {
		const db = getDb();
		const supabase = getSupabase();

		const invitation = await db.query.workspaceInvitations.findFirst({
			where: eq(workspaceInvitations.id, invitationId),
		});

		if (!invitation) {
			return { success: false, error: "Invitation not found" };
		}

		if (invitation.status !== "pending") {
			return {
				success: false,
				error: `Cannot resend invitation with status ${invitation.status}`,
			};
		}

		// Extend the expiration date
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

		// Update the expiration date
		await db
			.update(workspaceInvitations)
			.set({ expiresAt })
			.where(eq(workspaceInvitations.id, invitationId));

		// Resend the invitation email
		const { data, error } = await supabase.auth.admin.inviteUserByEmail(
			invitation.email,
			{
				data: {
					workspaceInvitation: invitation.workspaceId,
					invitedRole: invitation.role,
					invitationId: invitation.id,
				},
				redirectTo: `${Deno.env.get("CLIENT_URL")}/welcome?invitationId=${invitation.id}`,
			},
		);

		if (error) {
			throw new Error(`Failed to resend invitation: ${error.message}`);
		}

		return { success: true, data };
	} catch (error) {
		console.error("Error resending invitation:", error);
		return { success: false, error };
	}
}
