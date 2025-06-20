import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiStateButton } from "@/components/ui/multi-state-button";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

// Interfaces
interface Invitation {
	id: string;
	workspaceId: string;
	email: string;
	role: string;
	status: "pending" | "accepted" | "revoked";
	expiresAt: string;
	isExpired: boolean;
	isValid: boolean;
	workspace: {
		name: string;
	};
	inviter: {
		name: string;
		email: string;
	};
}

interface InvitationResponse {
	invitation: Invitation;
}

interface AcceptInvitationResponse {
	workspaceId: string;
	message: string;
}

interface InvitationFormProps {
	invitationId: string;
	onAcceptSuccess: () => Promise<void> | void;
}

export const InvitationForm = ({
	invitationId,
	onAcceptSuccess,
}: InvitationFormProps) => {
	const navigate = useNavigate();
	const [buttonState, setButtonState] = useState<
		"idle" | "processing" | "success" | "error"
	>("idle");

	// Fetch invitation data
	const {
		data: invitationData,
		isLoading,
		error: fetchError,
	} = useApiQuery<InvitationResponse>(`/invitations/${invitationId}`, [
		"invitation",
		invitationId,
	]);

	// Mutation for accepting invitation
	const { mutate: acceptInvitation, error: acceptError } = useApiMutation<
		AcceptInvitationResponse,
		Record<string, never>
	>(`/invitations/${invitationId}/accept`, {
		onSuccess: () => {
			setButtonState("success");
			setTimeout(() => {
				onAcceptSuccess();
			}, 2000);
		},
		onError: () => {
			setButtonState("error");
		},
	});

	const handleAcceptInvitation = () => {
		setButtonState("processing");
		acceptInvitation({});
	};

	const cardContent = () => {
		// Handle loading state
		if (isLoading) {
			return (
				<div className="space-y-4">
					<Skeleton className="h-6 w-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-1/3" />
						<Skeleton className="h-5 w-2/3" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-5 w-1/3" />
						<Skeleton className="h-5 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-5 w-1/3" />
						<Skeleton className="h-5 w-1/4" />
					</div>
					<Skeleton className="h-9 w-full" />
				</div>
			);
		}

		// Handle errors
		const error = fetchError || acceptError;
		if (error) {
			return (
				<>
					<p className="text-destructive">
						{error instanceof Error
							? error.message
							: "Failed to load or accept invitation"}
					</p>
					<Button className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>
						Go to Home
					</Button>
				</>
			);
		}

		const invitation = invitationData?.invitation;
		if (!invitation) {
			return (
				<>
					<p>Invitation not found or already processed.</p>
					<Button className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>
						Go to Home
					</Button>
				</>
			);
		}

		// Check for invitation status after loading and potential errors
		if (invitation.isExpired) {
			return (
				<>
					<div className="p-4 bg-destructive/10 rounded-md mb-4">
						<p className="font-medium text-destructive">
							This invitation has expired
						</p>
					</div>
					<Button
						className="mt-4 w-full"
						variant="outline"
						onClick={() => navigate({ to: "/" })}
					>
						Go to Home
					</Button>
				</>
			);
		}
		if (invitation.status === "revoked") {
			return (
				<>
					<div className="p-4 bg-destructive/10 rounded-md mb-4">
						<p className="font-medium text-destructive">
							This invitation has been revoked
						</p>
					</div>
					<Button
						className="mt-4 w-full"
						variant="outline"
						onClick={() => navigate({ to: "/" })}
					>
						Go to Home
					</Button>
				</>
			);
		}
		if (invitation.status === "accepted") {
			return (
				<>
					<div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-md mb-4">
						<p className="font-medium text-green-800 dark:text-green-300">
							You have already accepted this invitation
						</p>
					</div>
					<Button
						className="mt-4 w-full"
						variant="outline"
						onClick={() => navigate({ to: "/" })}
					>
						Go to Home
					</Button>
				</>
			);
		}

		return (
			<>
				<div className="space-y-4">
					<div>
						<p className="font-medium">Workspace:</p>
						<p>{invitation.workspace.name}</p>
					</div>
					<div>
						<p className="font-medium">Invited by:</p>
						<p>
							{invitation.inviter.name} ({invitation.inviter.email})
						</p>
					</div>
					<div>
						<p className="font-medium">Your role will be:</p>
						<p className="capitalize">{invitation.role}</p>
					</div>
					<MultiStateButton
						state={buttonState}
						className="w-full"
						disabled={
							!invitation.isValid ||
							buttonState === "processing" ||
							buttonState === "success"
						}
						onClick={handleAcceptInvitation}
					/>
				</div>
				<Button
					className="mt-4 w-full"
					variant="outline"
					onClick={() => navigate({ to: "/" })}
				>
					Go to Home
				</Button>
			</>
		);
	};

	return (
		<Card className="w-full max-w-md min-h-[320px]">
			<CardContent className="pt-6">{cardContent()}</CardContent>
		</Card>
	);
};
