import { createFileRoute } from "@tanstack/react-router";
import { UserManagement } from "@/components/workspace/user-management";

export const Route = createFileRoute(
	"/_authenticated/_dashboardLayout/workspace-settings",
)({
	component: WorkspaceSettings,
});

function WorkspaceSettings() {
	return (
		<div className="container flex flex-col h-full max-w-[1200px] w-[90%] mx-auto py-12">
			<h1 className="text-3xl font-bold mb-8">Workspace Settings</h1>

			<div className="space-y-8">
				<UserManagement />
			</div>
		</div>
	);
}
