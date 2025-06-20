import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
	component: AuthCallback,
});

function AuthCallback() {
	useEffect(() => {
		// Parse the hash fragment
		const handleAuthCallback = async () => {
			try {
				// Process the URL parameters
				const hashParams = new URLSearchParams(
					window.location.hash.substring(1),
				);
				const accessToken = hashParams.get("access_token");
				const refreshToken = hashParams.get("refresh_token");

				// If we have tokens in the URL, manually set the session
				if (accessToken && refreshToken) {
					await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});
				}

				// After authentication is complete, navigate to the index page
				// The profile context will handle redirection to onboarding if needed
				const { data } = await supabase.auth.getSession();
				if (data.session) {
					// Don't use navigate here - let the AuthProvider and ProfileProvider
					// handle redirection based on user onboarding status
					window.location.href = "/";
				}
			} catch (error) {
				console.error("Authentication error:", error);
			}
		};

		handleAuthCallback();

		// We don't need the auth state listener anymore since we're using
		// window.location.href to allow context providers to handle redirection
	}, []);

	return (
		<div className="flex items-center justify-center min-h-[50vh]">
			<div className="text-center">
				<h2 className="text-2xl font-semibold">Processing authentication...</h2>
				<p className="text-muted-foreground mt-2">
					Please wait while we log you in.
				</p>
			</div>
		</div>
	);
}
