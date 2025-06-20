import type { ButtonState } from "@/components/ui/multi-state-button";
import type { useProfile } from "@/lib/profile-context";
import { WorkspaceForm } from "../WorkspaceForm";
import type { OnboardingState } from "@/lib/profile-context";

interface WorkspaceFormWrapperProps {
	onNext: () => void;
	profile: ReturnType<typeof useProfile>["profile"];
	createWorkspace: (args: {
		name: string;
		userId: string;
	}) => Promise<{ workspace: { id: string; name: string } }>;
	updateProfile: ReturnType<typeof useProfile>["updateProfile"];
	refreshProfile: ReturnType<typeof useProfile>["refreshProfile"];
}

export const WorkspaceFormWrapper = ({
	onNext,
	profile,
	createWorkspace,
	updateProfile,
	refreshProfile,
}: WorkspaceFormWrapperProps) => {
	const handleSubmit = async (
		workspaceName: string,
		setButtonState: (state: ButtonState) => void,
	) => {
		setButtonState("processing");
		try {
			if (!profile?.id) throw new Error("User profile not loaded");
			const { workspace } = await createWorkspace({
				name: workspaceName,
				userId: profile.id,
			});
			const { error } = await updateProfile({
				workspace_id: workspace.id,
				onboarding_state: "pending_invites" as OnboardingState, // Added type assertion
			});
			if (error) throw error;

			setButtonState("success");
			await refreshProfile();
			setTimeout(() => onNext(), 1000);
		} catch (error) {
			console.error("Failed to create workspace:", error);
			setButtonState("error");
			setTimeout(() => setButtonState("idle"), 2000);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] w-full bg-background px-4 animate-fadeIn">
			<div className="text-center mb-12 space-y-3 w-full">
				<h1 className="text-4xl md:text-5xl font-bold">
					Create Your Workspace
				</h1>
				<p className="text-muted-foreground text-lg md:text-xl">
					This is where your team will collaborate and build.
				</p>
			</div>
			<WorkspaceForm onSubmit={handleSubmit} />
		</div>
	);
};
