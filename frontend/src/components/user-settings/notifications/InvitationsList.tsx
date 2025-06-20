import { InvitationCard } from "./InvitationCard";
import { useApiMutation } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import type { FrontendInvitation } from "./index"; // Import the FrontendInvitation type
import { Button } from "@/components/ui/button"; // For refetch button
import { AlertTriangle, Loader2 } from "lucide-react"; // Icons

interface InvitationsListProps {
	invitations: FrontendInvitation[];
	isLoading: boolean;
	error: Error | null;
	refetchInvitations?: () => void; // Make refetch optional but available
}

export function InvitationsList({
	invitations,
	isLoading,
	error,
	refetchInvitations,
}: InvitationsListProps) {
	const queryClient = useQueryClient();

	// Mutation for accepting an invitation
	const acceptMutation = useApiMutation<
		void, // Expected response type on success
		{ invitationId: string } // Variables type for mutate function
	>(
		(vars) => `/invitations/${vars.invitationId}/accept`, // Endpoint is now a function
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["userInvitations"] });
			},
			onError: (err) => {
				console.error("Error accepting invitation:", err);
				// TODO: Show error toast to user
			},
		},
	);

	// Mutation for rejecting an invitation
	const rejectMutation = useApiMutation<void, { invitationId: string }>(
		(vars) => `/invitations/${vars.invitationId}/reject`, // Endpoint is now a function
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["userInvitations"] });
			},
			onError: (err) => {
				console.error("Error rejecting invitation:", err);
				// TODO: Show error toast to user
			},
		},
	);

	const handleAccept = (invitationId: string) => {
		acceptMutation.mutate({ invitationId });
	};

	const handleReject = (invitationId: string) => {
		rejectMutation.mutate({ invitationId });
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center text-center py-10 h-64">
				<Loader2 className="size-8 animate-spin text-primary mb-4" />
				<p className="text-muted-foreground">Loading invitations...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center text-center py-10 h-64 bg-destructive/10 border border-destructive/30 rounded-md">
				<AlertTriangle className="size-8 text-destructive mb-4" />
				<p className="text-destructive-foreground mb-2">
					Failed to load invitations.
				</p>
				<p className="text-sm text-muted-foreground mb-4">{error.message}</p>
				{refetchInvitations && (
					<Button onClick={refetchInvitations} variant="destructive" size="sm">
						Try again
					</Button>
				)}
			</div>
		);
	}

	if (!invitations || invitations.length === 0) {
		return (
			<div className="text-center py-10">
				<p className="text-muted-foreground">
					You have no invitations at this time.
				</p>
			</div>
		);
	}

	return (
		<div>
			{/* <h2 className="text-xl font-semibold mb-4">Workspace Invitations</h2> // Title can be part of the parent component or layout */}
			{invitations.map((invitation) => (
				<InvitationCard
					key={invitation.id}
					invitation={invitation}
					onAccept={handleAccept}
					onReject={handleReject}
					isAccepting={acceptMutation.isPending}
					isRejecting={rejectMutation.isPending}
				/>
			))}
		</div>
	);
}
