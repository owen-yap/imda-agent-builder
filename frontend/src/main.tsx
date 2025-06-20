import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { router } from "./router";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProfileProvider } from "@/lib/profile-context";
import "./globals.css";

const queryClient = new QueryClient();

// Define an InnerApp component to use the useAuth hook
function InnerApp() {
	const auth = useAuth();

	// Potentially show a loading state while auth is being determined
	// This is important so that `beforeLoad` in routes doesn't run with initial/undefined auth state
	if (auth.loading) {
		return <div>Loading authentication...</div>; // Or your global app loader
	}

	return <RouterProvider router={router} context={{ auth }} />;
}

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element not found");

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
					<AuthProvider router={router}>
						<ProfileProvider>
							<InnerApp />
						</ProfileProvider>
					</AuthProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</StrictMode>,
	);
}
