import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useProfile } from "./profile-context";
import { useAuth } from "./auth-context";

interface ProfileGuardProps {
	children: ReactNode;
	requireComplete?: boolean;
}

export function ProfileGuard({
	children,
	requireComplete = true,
}: ProfileGuardProps) {
	const { user, loading: authLoading } = useAuth();
	const { profile, loading: profileLoading } = useProfile();
	const navigate = useNavigate();

	useEffect(() => {
		if (!authLoading && !profileLoading && user && profile) {
			// Check if user needs to complete onboarding
			const needsOnboarding = profile.onboarding_state !== "completed";

			if (requireComplete && needsOnboarding) {
				// Check current route to avoid redirection loops
				const currentPath = window.location.pathname;
				const currentSearch = window.location.search;
				const isWelcomePath = currentPath === "/welcome";
				const isAuthPath = currentPath.startsWith("/auth");
				const hasInvitationId = currentSearch.includes("invitationId=");

				// Don't redirect if already on welcome path, auth path, or has an invitation ID
				if (!isWelcomePath && !isAuthPath && !hasInvitationId) {
					// Use the router to navigate to welcome
					navigate({ to: "/welcome", search: { invitationId: undefined } });
				}
			}
		}
	}, [profile, profileLoading, authLoading, user, navigate, requireComplete]);

	// Show nothing while loading or redirecting
	if (
		authLoading ||
		profileLoading ||
		(requireComplete && profile && profile.onboarding_state !== "completed")
	) {
		return null;
	}

	// Render children if profile is complete or not required to be complete
	return <>{children}</>;
}
