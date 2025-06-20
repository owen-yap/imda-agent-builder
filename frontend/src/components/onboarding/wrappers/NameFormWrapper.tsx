import type { ButtonState } from "@/components/ui/multi-state-button";
import type { useProfile } from "@/lib/profile-context";
import { NameForm } from "../NameForm";
import type { OnboardingState } from "@/lib/profile-context";

interface NameFormWrapperProps {
	onNext: () => void;
	profile: ReturnType<typeof useProfile>["profile"];
	updateProfile: ReturnType<typeof useProfile>["updateProfile"];
	refreshProfile: ReturnType<typeof useProfile>["refreshProfile"];
	isInvitedFlow: boolean;
}

export const NameFormWrapper = ({
	onNext,
	profile,
	updateProfile,
	refreshProfile,
	isInvitedFlow,
}: NameFormWrapperProps) => {
	const handleSubmit = async (
		displayName: string,
		setButtonState: (state: ButtonState) => void,
	) => {
		setButtonState("processing");
		try {
			const nextState = isInvitedFlow ? "completed" : "pending_workspace";
			const { error } = await updateProfile({
				display_name: displayName,
				onboarding_state: nextState as OnboardingState, // Added type assertion
			});
			if (error) throw error;
			setButtonState("success");
			await refreshProfile();
			if (nextState !== "completed") {
				setTimeout(() => onNext(), 1000);
			}
		} catch (error) {
			console.error("Failed to update display name:", error);
			setButtonState("error");
			setTimeout(() => setButtonState("idle"), 2000);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] w-full bg-background px-4 animate-fadeIn">
			<div className="text-center mb-12 space-y-3 w-full">
				<h1 className="text-4xl md:text-5xl font-bold">
					What should we call you?
				</h1>
				<p className="text-muted-foreground text-lg md:text-xl">
					This will be your display name across Mona.
				</p>
			</div>
			<NameForm profile={profile} onSubmit={handleSubmit} />
		</div>
	);
};
