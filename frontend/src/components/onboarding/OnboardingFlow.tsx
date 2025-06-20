import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useProfile } from "@/lib/profile-context";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { WelcomeScreen } from "./WelcomeScreen";
import { ThemeSelectionScreen } from "./ThemeSelectionScreen";
import { InviteTeammatesScreen } from "./InviteTeammatesScreen";
import { StepIndicator } from "./StepIndicator";
import type { OnboardingState } from "@/lib/profile-context";
import { NameFormWrapper } from "./wrappers/NameFormWrapper";
import { WorkspaceFormWrapper } from "./wrappers/WorkspaceFormWrapper";
import { ReactElement } from "react";

// Types
type OnboardingStepKey = "welcome" | "theme" | "name" | "workspace" | "invite";

interface Invitation {
	id: string;
	workspace: { name: string };
	status: "pending" | "accepted" | "revoked";
	expiresAt: string;
	isExpired: boolean;
	isValid: boolean;
}

interface InvitationResponse {
	invitation: Invitation;
}

interface AcceptInvitationResponse {
	workspaceId: string;
	message: string;
}

interface StepConfig {
	key: OnboardingStepKey;
	component: (props: { onNext: () => void }) => ReactElement;
	showStepper: boolean;
}

// Map onboarding states to step keys
const onboardingStateToStepKey: Record<OnboardingState, OnboardingStepKey | null> = {
	pending_welcome: "welcome",
	pending_theme: "theme",
	pending_display_name: "name",
	pending_workspace: "workspace",
	pending_invites: "invite",
	completed: null, // Indicates onboarding is done
};

// Map step keys to next onboarding states
const getNextOnboardingState = (
	currentKey: OnboardingStepKey,
	isInvitedFlow: boolean
): OnboardingState | null => {
	if (isInvitedFlow) {
		switch (currentKey) {
			case "welcome": return "pending_theme";
			case "theme": return "pending_display_name";
			case "name": return "completed";
			default: return null;
		}
	} else {
		// Self-signup flow
		switch (currentKey) {
			case "welcome": return "pending_theme";
			case "theme": return "pending_display_name";
			case "name": return "pending_workspace";
			case "workspace": return "pending_invites";
			case "invite": return "completed";
		}
	}
};

// Error and loading states component
const OnboardingStateDisplay = ({ 
	isLoading, 
	error, 
	onReturnToLogin 
}: { 
	isLoading: boolean; 
	error: string | null; 
	onReturnToLogin: () => void 
}) => {
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen w-full bg-background px-4">
				{/* Loading state UI */}
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen w-full bg-background px-4 text-center">
				<AlertCircle className="w-16 h-16 text-destructive mb-6" />
				<h1 className="text-2xl font-bold text-destructive mb-4">
					Onboarding Error
				</h1>
				<p className="text-muted-foreground mb-8 max-w-md">{error}</p>
				<Button onClick={onReturnToLogin}>
					Go to Sign In
				</Button>
			</div>
		);
	}

	return null;
};

export const OnboardingFlow = () => {
	const navigate = useNavigate();
	const search = useSearch({ from: "/welcome" });
	const invitationId = search.invitationId as string | undefined;

	const {
		profile,
		updateProfile,
		refreshProfile,
		loading: profileLoading,
	} = useProfile();

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [onboardingError, setOnboardingError] = useState<string | null>(null);
	const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);

	// Invitation data fetching
	const {
		data: invitationData,
		isLoading: invitationLoading,
		error: invitationFetchError,
	} = useApiQuery<InvitationResponse>(
		`/invitations/${invitationId}`,
		["invitation", invitationId],
		{ enabled: !!invitationId },
	);

	// API mutations
	const acceptInvitationMutation = useApiMutation<
		AcceptInvitationResponse,
		Record<string, never>
	>(invitationId ? `/invitations/${invitationId}/accept` : "", {});

	const createWorkspaceMutation = useApiMutation<
		{ workspace: { id: string; name: string } },
		{ name: string; userId: string }
	>("/workspaces");

	const isInvitedFlow = !!invitationId;
	const workspaceNameFromInvite = invitationData?.invitation?.workspace?.name;
	
	// Generate step configurations based on flow type
	const stepsConfig: StepConfig[] = [
		// Common initial steps
		{
			key: "welcome",
			component: (props: { onNext: () => void }) => (
				<WelcomeScreen
					{...props}
					isInvitedFlow={isInvitedFlow}
					workspaceName={workspaceNameFromInvite}
					isLoading={isAcceptingInvite}
				/>
			),
			showStepper: true,
		},
		{
			key: "theme",
			component: (props: { onNext: () => void }) => <ThemeSelectionScreen {...props} />,
			showStepper: true,
		},
		{
			key: "name",
			component: (props: { onNext: () => void }) => (
				<NameFormWrapper
					{...props}
					profile={profile}
					updateProfile={updateProfile}
					refreshProfile={refreshProfile}
					isInvitedFlow={isInvitedFlow}
				/>
			),
			showStepper: true,
		},
		// Conditional steps for self-signup flow
		...(isInvitedFlow ? [] : [
			{
				key: "workspace" as OnboardingStepKey,
				component: (props: { onNext: () => void }) => (
					<WorkspaceFormWrapper
						{...props}
						profile={profile}
						createWorkspace={createWorkspaceMutation.mutateAsync}
						updateProfile={updateProfile}
						refreshProfile={refreshProfile}
					/>
				),
				showStepper: true,
			},
			{
				key: "invite" as OnboardingStepKey,
				component: (props: { onNext: () => void }) => <InviteTeammatesScreen {...props} />,
				showStepper: true,
			},
		] as StepConfig[]),
	];

	const totalSteps = stepsConfig.length;
	const currentStepConfig = stepsConfig[currentStepIndex];

	// Check invitation validity
	useEffect(() => {
		if (isInvitedFlow && invitationData && !invitationData.invitation.isValid) {
			const message = invitationData?.invitation?.isExpired
				? "This invitation has expired."
				: invitationData?.invitation?.status === "accepted"
					? "This invitation has already been accepted."
					: invitationData?.invitation?.status === "revoked"
						? "This invitation has been revoked."
						: invitationFetchError?.message || "This invitation is invalid.";
			setOnboardingError(message);
		}
	}, [isInvitedFlow, invitationData, invitationFetchError]);

	// Handle navigation based on profile state
	useEffect(() => {
		if (
			profileLoading ||
			(isInvitedFlow && invitationLoading && !invitationData && !invitationFetchError) ||
			onboardingError ||
			isAcceptingInvite ||
			!profile
		) {
			return;
		}

		// Redirect completed users to home
		if (profile.onboarding_state === "completed") {
			navigate({ to: "/" });
			return;
		}

		const targetStepKey = onboardingStateToStepKey[profile.onboarding_state];

		// Handle special case for invited flow
		if (isInvitedFlow && (profile.onboarding_state === "pending_workspace" || profile.onboarding_state === "pending_invites")) {
			refreshProfile().then(() => navigate({ to: "/" }));
			return;
		}

		// Find and set the appropriate step index
		const stepIdx = stepsConfig.findIndex((s) => s.key === targetStepKey);
		if (stepIdx !== -1 && stepIdx !== currentStepIndex) {
			setCurrentStepIndex(stepIdx);
		} else if (stepIdx === -1 && currentStepIndex !== 0) {
			// Default to welcome if specific step not found
			setCurrentStepIndex(0);
		}
	}, [
		profile,
		profileLoading,
		isInvitedFlow,
		invitationData,
		invitationLoading,
		invitationFetchError,
		navigate,
		stepsConfig,
		onboardingError,
		isAcceptingInvite,
		refreshProfile,
		currentStepIndex,
	]);

	// Handle next step action
	const handleNext = async () => {
		setOnboardingError(null);
		if (!profile) return;

		const currentKey = currentStepConfig.key;
		
		// Special handling for accepting invitation
		if (isInvitedFlow && currentKey === "welcome") {
			await handleInvitationAcceptance();
			return;
		}

		const nextState = getNextOnboardingState(currentKey, isInvitedFlow);
		if (!nextState) return;

		// For steps handled by wrappers (name, workspace), they call updateProfile themselves
		if (currentKey !== "name" && currentKey !== "workspace") {
			try {
				const { error } = await updateProfile({ onboarding_state: nextState });
				if (error) throw error;
				await refreshProfile();
			} catch (error) {
				handleError(error, "Failed to update onboarding state");
			}
		}
	};

	// Handle invitation acceptance
	const handleInvitationAcceptance = async () => {
		setIsAcceptingInvite(true);
		try {
			if (!invitationData?.invitation?.isValid) {
				setOnboardingError("Invitation is not valid to accept.");
				return;
			}
			await acceptInvitationMutation.mutateAsync({});
			await updateProfile({ onboarding_state: "pending_theme" });
			await refreshProfile();
		} catch (error) {
			handleError(error, "Failed to accept invitation");
		} finally {
			setIsAcceptingInvite(false);
		}
	};

	// Handle previous step action
	const handlePrevious = async () => {
		setOnboardingError(null);
		if (currentStepIndex <= 0 || !profile) return;

		const previousStepIndex = currentStepIndex - 1;
		const previousStepKey = stepsConfig[previousStepIndex].key;

		// Find previous onboarding state
		let previousState: OnboardingState | null = null;
		for (const [state, stepKey] of Object.entries(onboardingStateToStepKey)) {
			if (stepKey === previousStepKey) {
				previousState = state as OnboardingState;
				break;
			}
		}

		if (previousState) {
			try {
				const { error } = await updateProfile({ onboarding_state: previousState });
				if (error) throw error;
				await refreshProfile();
			} catch (error) {
				handleError(error, "Failed to update onboarding state on previous");
			}
		}
	};

	// Helper function for error handling
	const handleError = (error: unknown, defaultMessage: string) => {
		console.error(`${defaultMessage}:`, error);
		if (error instanceof Error) {
			setOnboardingError(error.message);
		} else {
			setOnboardingError(`An unexpected error occurred: ${defaultMessage}.`);
		}
	};

	// Loading and error state
	const isLoading = profileLoading || (isInvitedFlow && invitationLoading && !invitationFetchError && !invitationData);
	const stateDisplay = <OnboardingStateDisplay 
		isLoading={isLoading} 
		error={onboardingError} 
		onReturnToLogin={() => navigate({ to: "/login" })} 
	/>;
	
	if (isLoading || onboardingError) {
		return stateDisplay;
	}

	const CurrentScreenComponent = currentStepConfig.component;

	return (
		<div className="w-full min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
			{currentStepIndex > 0 &&
				(isInvitedFlow || currentStepConfig.key !== "invite") && (
					<Button
						variant="ghost"
						onClick={handlePrevious}
						className="absolute top-6 left-6 z-10 text-muted-foreground hover:text-foreground"
						aria-label="Go back"
					>
						Back
					</Button>
				)}
			<main className="flex-grow flex flex-col items-center justify-center">
				<CurrentScreenComponent onNext={handleNext} />
			</main>
			{currentStepConfig.showStepper && (
				<StepIndicator currentStep={currentStepIndex} totalSteps={totalSteps} />
			)}
		</div>
	);
};
