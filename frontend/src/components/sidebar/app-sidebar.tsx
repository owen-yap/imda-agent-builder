import { Building2 } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { NavUser } from "./nav-user";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { BasicNav } from "./basic-nav";
import { OrchestratorsNav } from "./orchestrators-nav";
import { WorkspaceNav } from "./workspace-nav";

export function AppSidebar() {
	const { workspaces } = useWorkspaces();

	// Map workspaces to the format expected by WorkspaceSwitcher
	const formattedWorkspaces = workspaces.map((workspace) => ({
		id: workspace.id,
		name: workspace.name,
		logo: Building2,
	}));

	return (
		<Sidebar collapsible="icon" side="left">
			<SidebarHeader>
				<WorkspaceSwitcher workspaces={formattedWorkspaces} />
			</SidebarHeader>
			<SidebarContent>
				<BasicNav />
				<OrchestratorsNav />
				<WorkspaceNav />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
