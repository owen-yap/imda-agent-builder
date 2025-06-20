import { createFileRoute } from "@tanstack/react-router";
import { InboxContainer } from "@/components/inbox/inbox-container";

export const Route = createFileRoute("/_authenticated/_dashboardLayout/inbox")({
	component: InboxPage,
});

function InboxPage() {
	return (
		<div className="h-full w-full flex flex-col">
			<div className="p-4 pb-2 md:p-6 md:pb-2 flex-shrink-0 border-b">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Review and manage interactions across different agents.
					</p>
				</div>
			</div>

			<div className="flex-grow overflow-auto">
				<InboxContainer />
			</div>
		</div>
	);
}
