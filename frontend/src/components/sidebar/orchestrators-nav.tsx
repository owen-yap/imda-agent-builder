import { Link, useMatchRoute } from "@tanstack/react-router";
import {
	Bot,
	ChevronDown,
	ChevronRight,
	GitFork,
	Info,
	MessageSquare,
} from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "@/components/ui/sidebar";
import { useProfile } from "@/lib/profile-context";

interface Orchestrator {
	id: string;
	name: string;
	expanded?: boolean;
}

export function OrchestratorsNav() {
	const [orchestrators, setOrchestrators] = useState<Orchestrator[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const sidebar = useSidebar();
	const isIconMode = sidebar.state === "collapsed" && !sidebar.isMobile;
	const { profile } = useProfile();
	const matchRoute = useMatchRoute();

	useEffect(() => {
		async function fetchOrchestrators() {
			if (!profile?.workspace_id) {
				setOrchestrators([]);
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);

				const { data, error } = await supabase
					.from("orchestrator_agents")
					.select("id, name")
					.eq("workspace_id", profile.workspace_id);

				if (error) {
					console.error("Error fetching orchestrators:", error);
					return;
				}

				setOrchestrators(
					data.map((orchestrator) => ({ ...orchestrator, expanded: false })),
				);
			} catch (error) {
				console.error("Failed to fetch orchestrators:", error);
			} finally {
				setIsLoading(false);
			}
		}

		if (profile?.workspace_id) {
			fetchOrchestrators();
		} else {
			// Handle the case where there is no workspace_id yet,
			// maybe set loading to false and orchestrators to empty.
			setOrchestrators([]);
			setIsLoading(false);
		}
	}, [profile]);

	const toggleOrchestrator = (id: string) => {
		setOrchestrators((prevOrchestrators) =>
			prevOrchestrators.map((orchestrator) =>
				orchestrator.id === id
					? { ...orchestrator, expanded: !orchestrator.expanded }
					: orchestrator,
			),
		);
	};

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Orchestrators</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{isLoading ? (
						<SidebarMenuItem>
							<SidebarMenuButton disabled>
								<Bot className="h-4 w-4" />
								<span>Loading orchestrators...</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					) : orchestrators.length === 0 ? (
						<SidebarMenuItem>
							<SidebarMenuButton disabled>
								<Bot className="h-4 w-4" />
								<span>No orchestrators found</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					) : (
						orchestrators.map((orchestrator) => (
							<SidebarMenuItem key={orchestrator.id} className="flex flex-col">
								<div className="flex w-full items-center">
									<SidebarMenuButton
										disabled={isIconMode}
										onClick={() => {
											if (!isIconMode) {
												toggleOrchestrator(orchestrator.id);
											}
										}}
										className="flex w-full justify-between pr-2 cursor-pointer"
										type="button"
										isActive={
											!!matchRoute({
												to: "/orchestrator/$orchestratorId",
												params: { orchestratorId: orchestrator.id },
												fuzzy: true,
											})
										}
									>
										<div className="flex items-center">
											<Bot className="mr-2 h-4 w-4 text-primary" />
											<span className="group-data-[collapsible=icon]:hidden">
												{orchestrator.name}
											</span>
										</div>
										{orchestrator.expanded ? (
											<ChevronDown className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
										) : (
											<ChevronRight className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
										)}
									</SidebarMenuButton>
								</div>

								{orchestrator.expanded && !isIconMode && (
									<div className="ml-6 mt-1 space-y-1 border-l pl-2">
										<SidebarMenuButton
											asChild
											className="justify-start cursor-pointer"
											isActive={
												!!matchRoute({
													to: "/orchestrator/$orchestratorId/playground",
													params: { orchestratorId: orchestrator.id },
												})
											}
										>
											<Link
												to="/orchestrator/$orchestratorId/playground"
												params={{ orchestratorId: orchestrator.id }}
											>
												<MessageSquare className="h-4 w-4" />
												<span className="text-sm">Playground</span>
											</Link>
										</SidebarMenuButton>
										<SidebarMenuButton
											asChild
											className="justify-start cursor-pointer"
											isActive={
												!!matchRoute({
													to: "/orchestrator/$orchestratorId/configuration",
													params: { orchestratorId: orchestrator.id },
												})
											}
										>
											<Link
												to="/orchestrator/$orchestratorId/configuration"
												params={{ orchestratorId: orchestrator.id }}
											>
												<Info className="h-4 w-4" />
												<span className="text-sm">Configuration</span>
											</Link>
										</SidebarMenuButton>{" "}
										<SidebarMenuButton
											asChild
											className="justify-start cursor-pointer"
											isActive={
												!!matchRoute({
													to: "/orchestrator/$orchestratorId/deployment",
													params: { orchestratorId: orchestrator.id },
												})
											}
										>
											<Link
												to="/orchestrator/$orchestratorId/deployment"
												params={{ orchestratorId: orchestrator.id }}
											>
												<GitFork className="h-4 w-4" />
												<span className="text-sm">Deployment</span>
											</Link>
										</SidebarMenuButton>{" "}
									</div>
								)}
							</SidebarMenuItem>
						))
					)}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
