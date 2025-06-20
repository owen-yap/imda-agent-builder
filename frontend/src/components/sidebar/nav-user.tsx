import { ChevronsUpDown, LogOut, User, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ModeToggle } from "./mode-toggle";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

export function NavUser() {
	const { isMobile } = useSidebar();
	const { signOut } = useAuth();
	const { profile } = useProfile();

	// Get initials for the avatar fallback
	const initials = profile?.display_name
		? profile.display_name
				.split(" ")
				.map((n: string) => n[0])
				.join("")
				.toUpperCase()
				.substring(0, 2)
		: "";

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								{profile?.avatar_url ? (
									<AvatarImage
										src={profile.avatar_url}
										alt={profile.display_name ?? ""}
									/>
								) : (
									<AvatarFallback className="rounded-lg">
										{initials || <User className="h-4 w-4" />}
									</AvatarFallback>
								)}
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								{profile ? (
									<>
										<span className="truncate font-semibold">
											{profile.display_name}
										</span>
										<span className="truncate text-xs">{profile.email}</span>
									</>
								) : (
									<>
										<Skeleton className="h-6 w-24" />
										<Skeleton className="h-4 w-32" />
									</>
								)}
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									{profile?.avatar_url ? (
										<AvatarImage
											src={profile.avatar_url}
											alt={profile.display_name ?? ""}
										/>
									) : (
										<AvatarFallback className="rounded-lg">
											{initials || <User className="h-4 w-4" />}
										</AvatarFallback>
									)}
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									{profile ? (
										<>
											<span className="truncate font-semibold">
												{profile.display_name}
											</span>
											<span className="truncate text-xs">{profile.email}</span>
										</>
									) : (
										<>
											<Skeleton className="h-6 w-24" />
											<Skeleton className="h-4 w-32" />
										</>
									)}
								</div>
								<ModeToggle />
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link to="/notifications" className="flex w-full items-center">
								<Bell />
								Notifications
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={signOut}>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
