import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface NotificationTab {
	id: string;
	label: string;
	count?: number;
}

interface NotificationsLayoutProps {
	title: string;
	subtitle?: string;
	tabs: NotificationTab[];
	activeTabId: string;
	children: React.ReactNode;
	onTabChange?: (tabId: string) => void;
}

export function NotificationsLayout({
	title,
	subtitle,
	tabs,
	activeTabId,
	children,
	onTabChange,
}: NotificationsLayoutProps) {
	return (
		<div className="flex flex-col h-full">
			<header className="py-6 px-8 border-b">
				<h1 className="text-2xl font-semibold">{title}</h1>
				{subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
			</header>
			<div className="flex flex-1 overflow-hidden">
				<aside className="w-64 border-r p-6">
					<Tabs
						value={activeTabId}
						onValueChange={onTabChange}
						orientation="vertical"
						className="h-full"
					>
						<TabsList className="flex flex-col items-stretch h-auto p-0 bg-transparent border-none">
							{tabs.map((tab) => (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									className={cn(
										"justify-start px-3 py-2 text-sm font-medium rounded-md",
										"data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
										"hover:bg-muted/50",
									)}
								>
									<span>{tab.label}</span>
									{tab.count !== undefined && tab.count > 0 && (
										<span className="ml-auto bg-primary text-primary-foreground text-xs font-semibold px-1.5 py-0.5 rounded-full">
											{tab.count}
										</span>
									)}
								</TabsTrigger>
							))}
						</TabsList>
						{/* Content is rendered outside the tabs list for vertical tabs in this layout */}
					</Tabs>
				</aside>
				<main className="flex-1 p-8 overflow-y-auto">
					{/* This structure assumes TabsContent is not used directly with vertical TabsList for layout purposes */}
					{/* Instead, the children prop dynamically renders content based on activeTabId */}
					{children}
				</main>
			</div>
		</div>
	);
}
