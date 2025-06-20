import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	ArrowRight,
	BotMessageSquare,
	BrainCircuit,
	Inbox,
} from "lucide-react";

export function HomeDashboard() {
	return (
		<div className="space-y-12 p-12">
			<div className="text-center">
				<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
					Welcome to Mona
				</h1>
				<p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
					Mona empowers you to build, customize, and deploy intelligent AI
					assistants. Tailor your assistant with your own knowledge base and
					interact with it in a dedicated playground.
				</p>
			</div>

			<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				<div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm flex flex-col">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
							<BrainCircuit className="h-5 w-5 text-primary" />
						</div>
						<h3 className="text-xl font-semibold">Knowledge Base</h3>
					</div>
					<p className="text-muted-foreground flex-grow mb-6">
						Upload documents, add text, or connect data sources to create a
						custom knowledge base. This information will be used by your AI
						assistant to provide relevant and accurate answers.
					</p>
					<Button asChild variant="outline" className="mt-auto">
						<Link to="/knowledge">
							Manage Knowledge <ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>

				{/* Inbox Card - Replaces Orchestrators Card */}
				<div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm flex flex-col">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
							<Inbox className="h-5 w-5 text-primary" />
						</div>
						<h3 className="text-xl font-semibold">Inbox</h3>
					</div>
					<p className="text-muted-foreground flex-grow mb-6">
						Check your latest messages, notifications, and tasks related to your
						AI assistants and collaborations.
					</p>
					<Button asChild variant="outline" className="mt-auto">
						<Link to="/inbox">
							Go to Inbox <ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>

				{/* Public Chat Card */}
				<div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm flex flex-col">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
							<BotMessageSquare className="h-5 w-5 text-primary" />
						</div>
						<h3 className="text-xl font-semibold">Public Chat</h3>
					</div>
					<p className="text-muted-foreground flex-grow mb-6">
						Integrate a public-facing chat interface into your applications or
						websites. Customize its appearance and connect it to your configured
						AI orchestrators.
					</p>
					<Button asChild variant="outline" className="mt-auto">
						<Link to="/chat">
							Explore Public Chat <ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
