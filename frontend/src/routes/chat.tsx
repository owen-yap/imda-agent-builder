import { createFileRoute } from "@tanstack/react-router";
import { PublicChat } from "@/components/PublicChat";
import { useState, useEffect } from "react";
import { Loader } from "lucide-react";

// You can modify these defaults to match your branding
const DEFAULT_ORCHESTRATOR_ID = "your-default-orchestrator-id"; // Replace with your default orchestrator ID
const DEFAULT_PRIMARY_COLOR = "bg-slate-100";
const DEFAULT_BOT_NAME = "Mona Chat";

export const Route = createFileRoute("/chat")({
	component: PublicChatRoute,
});

function PublicChatRoute() {
	const [isLoading, setIsLoading] = useState(true);

	// Get URL parameters for customization
	const searchParams = new URLSearchParams(window.location.search);
	const orchestratorId =
		searchParams.get("orchestratorId") || DEFAULT_ORCHESTRATOR_ID;
	const primaryColor =
		searchParams.get("primaryColor") || DEFAULT_PRIMARY_COLOR;
	const botName = searchParams.get("botName") || DEFAULT_BOT_NAME;

	// Simulate loading state (replace with actual initialization if needed)
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="h-screen w-screen flex flex-col overflow-hidden p-0 m-0">
			{isLoading ? (
				<div className="flex flex-col items-center justify-center h-full">
					<Loader className="w-8 h-8 animate-spin text-primary" />
					<p className="mt-4 text-muted-foreground">Loading chat...</p>
				</div>
			) : (
				<PublicChat
					orchestratorId={orchestratorId}
					primaryColor={primaryColor}
					botName={botName}
				/>
			)}
		</div>
	);
}
