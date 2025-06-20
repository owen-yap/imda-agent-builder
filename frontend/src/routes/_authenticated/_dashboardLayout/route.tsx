import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_dashboardLayout")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="relative h-full w-full overflow-y-auto">
			<Outlet />
		</div>
	);
}
