import { ChevronsUpDown, Plus } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { type ElementType, useState, useEffect } from "react";
import { useProfile } from "@/lib/profile-context";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

export function WorkspaceSwitcher({
	workspaces,
}: {
	workspaces: {
		id?: string;
		name: string;
		logo: ElementType;
	}[];
}) {
	const { isMobile } = useSidebar();
	const { profile, updateProfile } = useProfile();
	const [activeWorkspace, setActiveWorkspace] = useState<
		(typeof workspaces)[0] | null
	>(workspaces.length > 0 ? workspaces[0] : null);
	const [isCreateWorkspaceDialogOpen, setCreateWorkspaceDialogOpen] =
		useState(false);

	// Set initial active workspace based on profile whenever workspaces or profile changes
	useEffect(() => {
		if (workspaces.length === 0) return;

		const workspaceFromProfile = profile?.workspace_id
			? workspaces.find((w) => w.id === profile.workspace_id)
			: null;

		setActiveWorkspace(workspaceFromProfile || workspaces[0]);
	}, [profile?.workspace_id, workspaces]);

	const handleWorkspaceChange = async (workspace: (typeof workspaces)[0]) => {
		setActiveWorkspace(workspace);

		// Only update profile if workspace has an ID and it's different from current
		if (workspace.id && workspace.id !== profile?.workspace_id) {
			await updateProfile({ workspace_id: workspace.id });
		}
	};

	// Check if workspaces are still loading or if active workspace is not set
	const isLoading = workspaces.length === 0 || !activeWorkspace;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							{isLoading ? (
								<>
									<Skeleton className="size-8 rounded-lg" />
									<div className="grid flex-1 gap-1">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-16" />
									</div>
									<ChevronsUpDown className="ml-auto" />
								</>
							) : (
								activeWorkspace && (
									<>
										<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
											<activeWorkspace.logo className="size-4" />
										</div>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-semibold">
												{activeWorkspace.name}
											</span>
										</div>
										<ChevronsUpDown className="ml-auto" />
									</>
								)
							)}
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Workspaces
						</DropdownMenuLabel>
						{isLoading ? (
							<div className="p-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="mt-2 h-8 w-full" />
							</div>
						) : (
							workspaces.map((workspace, index) => (
								<DropdownMenuItem
									key={workspace.id || workspace.name + index}
									onClick={() => handleWorkspaceChange(workspace)}
									className="gap-2 p-2"
								>
									<div className="flex size-6 items-center justify-center rounded-sm border">
										<workspace.logo className="size-4 shrink-0" />
									</div>
									{workspace.name}
								</DropdownMenuItem>
							))
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
								setCreateWorkspaceDialogOpen(true);
							}}
							className="gap-2 p-2 cursor-pointer"
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-background">
								<Plus className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								Add workspace
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<CreateWorkspaceDialog
					open={isCreateWorkspaceDialogOpen}
					onOpenChange={setCreateWorkspaceDialogOpen}
					onWorkspaceCreated={(newWorkspace) => {
						console.log("New workspace created:", newWorkspace);
						if (newWorkspace.id) {
							updateProfile({ workspace_id: newWorkspace.id });
						}
					}}
				/>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
