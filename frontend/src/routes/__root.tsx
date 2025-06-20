import {
	createRootRouteWithContext,
	Outlet,
	useMatchRoute,
} from "@tanstack/react-router";
import { useEffect } from 'react';
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ProfileGuard } from "@/lib/profile-guard";
import type { User } from "@supabase/supabase-js";

// Define the shape of the auth context to be passed to the router
export interface RouterAuthContext {
	user: User | null;
	loading: boolean;
}

// Define the overall router context
export interface MyRouterContext {
	auth: RouterAuthContext;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
});

function RootComponent() {
	const matchRoute = useMatchRoute();
	const isAuthRoute =
		matchRoute({ to: "/login" }) || matchRoute({ to: "/auth/callback" });

	const isPublicChatRoute = matchRoute({ to: "/chat" });
	const isOnboardingRoute = matchRoute({ to: "/welcome" });

	useEffect(() => {
		const bodyStyle = document.body.style;
		const docStyle = document.documentElement.style;
		const originalBodyOverflow = bodyStyle.overflow;
		const originalDocOverflow = docStyle.overflow;

		if (isPublicChatRoute) {
			bodyStyle.overflow = 'hidden';
			docStyle.overflow = 'hidden';
		} else {
			bodyStyle.overflow = originalBodyOverflow;
			docStyle.overflow = originalDocOverflow;
		}

		return () => {
			bodyStyle.overflow = originalBodyOverflow;
			docStyle.overflow = originalDocOverflow;
		};
	}, [isPublicChatRoute]);

	return (
		<>
			{isPublicChatRoute ? (
					<Outlet />
			) : (
				<>
					{isAuthRoute || isOnboardingRoute ? (
							<Outlet />
					) : (
						<ProfileGuard>
							<div className="flex h-screen bg-background">
								<SidebarProvider>
									<AppSidebar />
									<SidebarInset>
										<main className="flex-1 flex justify-center overflow-y-auto w-full">
											<div className="w-full h-[100%] flex flex-col">
												<Outlet />
											</div>
										</main>
									</SidebarInset>
								</SidebarProvider>
							</div>
						</ProfileGuard>
					)}
					<TanStackRouterDevtools position="bottom-right" />
				</>
			)}
		</>
	);
}
