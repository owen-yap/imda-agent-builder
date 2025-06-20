import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { MyRouterContext, RouterAuthContext } from "./routes/__root"; // Import the context types

// Define a default initial auth state
const defaultAuthContext: RouterAuthContext = {
	user: null,
	loading: true,
};

// Create the router instance
export const router = createRouter({
	routeTree,
	// Initialize the context with a default auth state
	context: {
		auth: defaultAuthContext,
	} satisfies MyRouterContext, // Ensures the context matches the defined type
	defaultPreload: "intent",
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
