export function InboxDetailsPane({ sessionId }: { sessionId: string | null }) {
	if (!sessionId) {
		return (
			<div className="p-6 h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
				<p className="text-muted-foreground">No session selected</p>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l">
			<div className="p-4 flex justify-between items-center border-b">
				<h2 className="text-lg font-semibold">Details</h2>
			</div>

			<div className="p-4 flex items-center justify-center h-full">
				<p className="text-muted-foreground">Coming soon</p>
			</div>
		</div>
	);
}
