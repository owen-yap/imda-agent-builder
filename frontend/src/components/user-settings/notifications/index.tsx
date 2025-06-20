import { NotificationsLayout } from "./NotificationsLayout";
import { InvitationsList } from "./InvitationsList";
import { useAuth } from "@/lib/auth-context";
// import { useProfile } from "@/lib/profile-context"; // Not strictly needed if user object from useAuth has email
import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api"; // Using useApiQuery for backend endpoint

// Define types for role and status, previously imported from backend
export type WorkspaceInvitationRole = "admin" | "member" | "viewer"; // Example values, adjust if necessary
export type WorkspaceInvitationStatus =
	| "pending"
	| "accepted"
	| "rejected"
	| "expired";

// FrontendInvitation remains largely the same, but dates from API will be strings initially
export interface ApiInvitationResponseItem {
	id: string;
	email: string;
	role: WorkspaceInvitationRole; // Use frontend defined type
	status: WorkspaceInvitationStatus; // Use frontend defined type
	createdAt: string; // Dates from API are strings
	expiresAt: string; // Dates from API are strings
	workspace: { id: string; name: string /* logoUrl removed */ };
	inviter: { id: string; fullName: string; avatarUrl?: string };
}

export interface FrontendInvitation
	extends Omit<ApiInvitationResponseItem, "createdAt" | "expiresAt"> {
	createdAt: Date; // Converted to Date on client
	expiresAt: Date; // Converted to Date on client
	isExpired?: boolean;
	isValid?: boolean;
}

interface PendingInvitationsApiResponse {
	invitations: ApiInvitationResponseItem[];
}

export function NotificationsPage() {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState("invitations");

	const queryKey = ["userPendingApiInvitations", user?.id]; // Query key based on user ID

	const {
		data: apiResponse,
		isLoading: isLoadingInvitations,
		error: invitationsError,
		refetch: refetchInvitations,
	} = useApiQuery<PendingInvitationsApiResponse>(
		"/invitations/pending", // New backend endpoint
		queryKey,
		{
			enabled: !!user, // Fetch only if user is available
		},
	);

	// Transform API response: convert date strings to Date objects
	const invitations: FrontendInvitation[] =
		apiResponse?.invitations?.map((inv) => ({
			...inv,
			status: inv.status,
			createdAt: new Date(inv.createdAt),
			expiresAt: new Date(inv.expiresAt),
		})) || [];

	const pendingInvitationsCount = invitations.filter(
		(inv) =>
			inv.status === "pending" && !(new Date(inv.expiresAt) < new Date()),
	).length;

	const notificationCategories = [
		{
			id: "invitations",
			label: "Workspace Invitations",
			count: pendingInvitationsCount,
		},
	];

	const userEmail = user?.email || "your email";

	return (
		<NotificationsLayout
			title="Notifications"
			subtitle={`All notifications will be sent to ${userEmail}.`}
			tabs={notificationCategories}
			activeTabId={activeTab}
			onTabChange={setActiveTab}
		>
			{activeTab === "invitations" && (
				<InvitationsList
					invitations={invitations}
					isLoading={isLoadingInvitations}
					error={invitationsError as Error | null}
					refetchInvitations={refetchInvitations}
				/>
			)}
		</NotificationsLayout>
	);
}
