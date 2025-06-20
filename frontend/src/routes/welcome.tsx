import { createFileRoute } from "@tanstack/react-router";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const Route = createFileRoute("/welcome")({
	component: OnboardingFlow,
	validateSearch: (search) => {
		return {
			invitationId: search.invitationId as string | undefined,
		};
	},
});
