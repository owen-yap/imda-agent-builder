import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import React from "react";
import { useProfile } from "@/lib/profile-context";

// Removed Mock Data Section

export interface AgentSession {
	id: string;
	title: string;
	ipAddress: string;
	createdAt: string;
	orchestratorId: string;
	orchestratorName?: string;
}

interface Orchestrator {
	id: string;
	name: string;
}

interface InboxSessionListProps {
	onSessionSelect: (sessionId: string) => void;
	selectedSessionId: string | null;
}

// Type for the Supabase query result, mapping snake_case to camelCase
interface AgentSessionQueryResult {
	id: string;
	title: string;
	ip_address: string;
	created_at: string;
	orchestrator_id: string;
	// Relation might return an array or null
	orchestrator_agents: { name: string }[] | null;
}

// Helper function for timestamp formatting
function formatSessionTimestamp(createdAt: string): string {
	const date = new Date(createdAt);
	const today = new Date();
	const isToday =
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear();

	const timeFormat: Intl.DateTimeFormatOptions = {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	};
	const timeString = date.toLocaleTimeString(undefined, timeFormat);

	if (isToday) {
		return `Today at ${timeString}`;
	}
	const dateFormat: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
	};
	const dateString = date.toLocaleDateString(undefined, dateFormat);
	return `${dateString} at ${timeString}`;
}

export function InboxSessionList({
	onSessionSelect,
	selectedSessionId,
}: InboxSessionListProps) {
	const [selectedOrchestratorId, setSelectedOrchestratorId] = React.useState<
		string | null
	>(null);
	const { profile, loading: profileLoading } = useProfile();

	const { data: orchestrators, isLoading: isLoadingOrchestrators } = useQuery<
		Orchestrator[]
	>({
		queryKey: ["orchestrators", profile?.workspace_id],
		queryFn: async () => {
			if (!profile?.workspace_id) return [];
			const { data, error } = await supabase
				.from("orchestrator_agents")
				.select("id, name")
				.eq("workspace_id", profile.workspace_id);
			if (error) throw error;
			return data || [];
		},
		enabled: !!profile?.workspace_id && !profileLoading,
	});

	const {
		data: sessions,
		isLoading: isLoadingSessions,
		error,
	} = useQuery({
		queryKey: [
			"agentSessions",
			selectedOrchestratorId,
			orchestrators?.map((o) => o.id).join(","),
		],
		queryFn: async () => {
			const selectString = `
        id,
        title,
        ip_address,
        created_at,
        orchestrator_id,
        orchestrator_agents(name)
      `;
			let query = supabase.from("agent_sessions").select(selectString);

			if (selectedOrchestratorId) {
				query = query.eq("orchestrator_id", selectedOrchestratorId);
			} else if (orchestrators && orchestrators.length > 0) {
				const orchestratorIds = orchestrators.map((o) => o.id);
				query = query.in("orchestrator_id", orchestratorIds);
			}

			const { data, error } = await query.order("created_at", {
				ascending: false,
			});

			if (error) {
				throw error;
			}

			if (!data) {
				return [];
			}

			const mappedSessions = (data as unknown as AgentSessionQueryResult[]).map(
				(session) => ({
					id: session.id,
					title: session.title,
					ipAddress: session.ip_address,
					createdAt: session.created_at,
					orchestratorId: session.orchestrator_id,
					orchestratorName: session.orchestrator_agents?.[0]?.name,
				}),
			);
			return mappedSessions;
		},
		enabled: !!orchestrators && orchestrators.length > 0 && !profileLoading,
	});

	const selectedOrchestrator = React.useMemo(() => {
		return orchestrators?.find((o) => o.id === selectedOrchestratorId);
	}, [orchestrators, selectedOrchestratorId]);

	React.useEffect(() => {
		if (orchestrators && orchestrators.length > 0 && !selectedOrchestratorId) {
			setSelectedOrchestratorId(orchestrators[0].id);
		}
	}, [orchestrators, selectedOrchestratorId]);

	if (error) {
		return <div className="p-4">Error loading sessions: {error.message}</div>;
	}

	const isLoading =
		isLoadingOrchestrators || isLoadingSessions || profileLoading;

	return (
		<div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
			<CardHeader className="p-4 border-b">
				<div className="flex flex-col">
					<CardTitle className="text-xl font-semibold mb-2">
						Agent Sessions
					</CardTitle>
					{orchestrators && orchestrators.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="text-xs h-8 self-start"
								>
									{selectedOrchestrator?.name || "Select Orchestrator"}
									<ChevronDownIcon className="ml-1 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start">
								{orchestrators.map((orchestrator) => (
									<DropdownMenuItem
										key={orchestrator.id}
										onSelect={() => setSelectedOrchestratorId(orchestrator.id)}
									>
										{orchestrator.name}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</CardHeader>
			<div className="flex-1 overflow-hidden">
				<ScrollArea
					className="h-[calc(100vh-var(--session-list-header-height,80px)-2rem)]"
					style={
						{ "--session-list-header-height": "80px" } as React.CSSProperties
					}
				>
					<div className="p-2 space-y-1">
						{isLoading ? (
							Array.from({ length: 7 }, (_, i) => (
								<SessionSkeleton key={`sess-skel-${i}-${Date.now()}`} />
							))
						) : sessions?.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								No sessions found for{" "}
								{selectedOrchestrator?.name || "the selected orchestrator"}
							</div>
						) : (
							sessions?.map((session) => (
								<SessionCard
									key={session.id}
									session={session}
									isSelected={session.id === selectedSessionId}
									onSelect={() => onSessionSelect(session.id)}
								/>
							))
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

const getInitials = (name: string) => {
	if (!name) return "??";
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.substring(0, 2)
		.toUpperCase();
};

function SessionCard({
	session,
	isSelected,
	onSelect,
}: {
	session: AgentSession;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const messageSnippet = session.orchestratorName
		? `Agent: ${session.orchestratorName.substring(0, 30)}...`
		: "No recent messages";
	const timeSince = formatSessionTimestamp(session.createdAt);

	return (
		<Button
			variant="ghost"
			className={`flex items-start w-full mb-1 p-3 h-auto rounded-md text-left focus-visible:ring-1 focus-visible:ring-ring ${
				isSelected
					? "bg-primary/10 dark:bg-primary/20 border-primary/50"
					: "hover:bg-muted/50 dark:hover:bg-muted/20 border-transparent"
			}`}
			onClick={onSelect}
		>
			<Avatar className="h-9 w-9 mr-3 mt-1">
				<AvatarFallback
					className={`${isSelected ? "bg-primary text-primary-foreground" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
				>
					{getInitials(session.title)}
				</AvatarFallback>
			</Avatar>
			<div className="flex-1 min-w-0">
				<div className="flex justify-between items-center">
					<span className="font-medium text-sm truncate pr-1">
						{session.title}
					</span>
					<span
						className={`text-xs whitespace-nowrap ${isSelected ? "text-primary" : "text-muted-foreground"}`}
					>
						{timeSince}
					</span>
				</div>
				<p
					className={`text-xs truncate ${isSelected ? "text-primary/80" : "text-muted-foreground/90"}`}
				>
					{messageSnippet}
				</p>
			</div>
		</Button>
	);
}

function SessionSkeleton() {
	return (
		<div className="flex items-start w-full mb-1 p-3 h-auto rounded-md">
			<Skeleton className="h-9 w-9 mr-3 mt-1 rounded-full" />
			<div className="flex-1 min-w-0">
				<div className="flex justify-between items-center">
					<Skeleton className="h-4 w-2/3 mb-1" />
					<Skeleton className="h-3 w-1/5" />
				</div>
				<Skeleton className="h-3 w-full" />
			</div>
		</div>
	);
}
