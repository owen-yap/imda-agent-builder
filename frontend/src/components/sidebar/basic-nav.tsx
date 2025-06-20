import { Link, useMatchRoute } from "@tanstack/react-router";
import { Calendar, Home, Inbox } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
	{
		title: "Home",
		path: "/",
		icon: Home,
	},
	{
		title: "Knowledge",
		path: "/knowledge",
		icon: Calendar,
	},
	{
		title: "Inbox",
		path: "/inbox",
		icon: Inbox,
	},
];

export function BasicNav() {
	const matchRoute = useMatchRoute();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>The basics</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const isActive = matchRoute({ to: item.path, fuzzy: true });

						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild isActive={!!isActive}>
									<Link to={item.path}>
										<item.icon />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
