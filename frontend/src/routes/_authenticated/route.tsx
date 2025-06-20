import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		// context.auth is typed thanks to createRootRouteWithContext and router context setup
		// The `auth.loading` check should ideally happen in InnerApp in main.tsx
		// so that by the time beforeLoad runs, auth state is settled.
		if (!context.auth.user) {
			throw redirect({
				to: "/login",
				search: {
					// Use the current location to power a redirect after login
					redirect: location.pathname + location.search,
				},
			});
		}
		// If authenticated, proceed to load the route's children
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return <Outlet />;
}
