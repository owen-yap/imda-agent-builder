import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

// Define onboardingStates and OnboardingState locally
export const onboardingStates = [
	"pending_welcome",
	"pending_theme",
	"pending_display_name",
	"pending_workspace",
	"pending_invites",
	"completed",
] as const;
export type OnboardingState = (typeof onboardingStates)[number];

type UserProfile = {
	id: string;
	display_name: string | null;
	email: string | null;
	avatar_url: string | null;
	workspace_id: string | null;
	onboarding_state: OnboardingState;
};

type ProfileContextType = {
	profile: UserProfile | null;
	loading: boolean;
	updateProfile: (
		updates: Partial<UserProfile>,
	) => Promise<{ error: Error | null }>;
	refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
	const { user, loading: authLoading } = useAuth();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	const loadProfile = async () => {
		if (!user) {
			setProfile(null);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("id", user.id)
				.single();

			if (error) throw error;
			setProfile(data);
		} catch (error) {
			console.error("Error loading user profile:", error);
			setProfile(null);
		} finally {
			setLoading(false);
		}
	};

	// Initial load
	useEffect(() => {
		if (!authLoading) {
			loadProfile();
		}
	}, [user, authLoading]);

	const refreshProfile = async () => {
		await loadProfile();
	};

	const updateProfile = async (updates: Partial<UserProfile>) => {
		if (!user) return { error: new Error("User not authenticated") };

		try {
			const { error } = await supabase
				.from("user_profiles")
				.update(updates)
				.eq("id", user.id);

			if (error) {
				console.error("Error updating profile in DB:", error);
				throw error;
			}

			await refreshProfile();

			return { error: null };
		} catch (error) {
			console.error("Error in updateProfile or subsequent refresh:", error);
			return { error: error as Error };
		}
	};

	const value = {
		profile,
		loading: loading || authLoading,
		updateProfile,
		refreshProfile,
	};

	return (
		<ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
	);
}

export function useProfile() {
	const context = useContext(ProfileContext);
	if (context === undefined) {
		throw new Error("useProfile must be used within a ProfileProvider");
	}
	return context;
}
