import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatRelative } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar as ShadcnAvatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Paperclip, Smile, Bot, User } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

// Removed Mock Data Section

export interface AgentAction {
	id: string;
	role: "user" | "assistant";
	actionType:
		| "user-message"
		| "tool-invocation"
		| "orchestration-decision"
		| "assistant-message";
	content: string;
	createdAt: string;
}

interface InboxActionListProps {
	sessionId: string | null;
	// hasSessions: boolean; // Removed
}

// Type for the Supabase query result mapping snake_case fields
interface ActionQueryResult {
	id: string;
	role: "user" | "assistant";
	action_type: AgentAction["actionType"];
	content: string;
	created_at: string;
}

// Type for the Supabase query result for session details
interface SessionDetailsQueryResult {
	title: string;
	ip_address: string;
	// Relation might return an array or null
	orchestrator_agents: { name: string }[] | null;
}

export function InboxActionList({ sessionId }: InboxActionListProps) {
	const {
		data: actions,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["agentActions", sessionId],
		queryFn: async () => {
			if (!sessionId) {
				return [];
			}

			const { data, error } = await supabase
				.from("agent_actions")
				.select(`
          id,
          role,
          action_type,
          content,
          created_at
        `)
				.eq("agent_session_id", sessionId)
				.order("created_at", { ascending: true });

			if (error) {
				throw error;
			}

			if (!data) {
				return [];
			}

			// Map the snake_case results from Supabase to camelCase AgentAction
			return (data as ActionQueryResult[]).map((action) => ({
				id: action.id,
				role: action.role,
				actionType: action.action_type,
				content: action.content,
				createdAt: action.created_at,
			}));
		},
		enabled: !!sessionId,
	});

	const { data: sessionData } = useQuery({
		queryKey: ["agentSessionDetails", sessionId],
		queryFn: async () => {
			if (!sessionId) {
				return null;
			}
			const { data, error } = await supabase
				.from("agent_sessions")
				.select(`
					title,
					ip_address,
					orchestrator_agents(name)
				`)
				.eq("id", sessionId)
				.single(); // Use single() for fetching one record

			if (error) {
				console.error("Error fetching session details:", error);
				return null;
			}

			// Type assertion for safety
			const typedData = data as SessionDetailsQueryResult | null;

			if (!typedData) {
				return null;
			}

			let orchestratorName: string | undefined;
			if (typedData.orchestrator_agents) {
				// Handle both single object (from .single()) and array (potential fallback)
				if (Array.isArray(typedData.orchestrator_agents)) {
					orchestratorName = typedData.orchestrator_agents[0]?.name;
				} else {
					// This case might not happen with .single(), but handles type flexibility
					orchestratorName = (typedData.orchestrator_agents as { name: string })
						?.name;
				}
			}

			return {
				title: typedData.title,
				ipAddress: typedData.ip_address,
				orchestratorName: orchestratorName,
			};
		},
		enabled: !!sessionId,
	});

	if (!sessionId) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center text-muted-foreground p-8">
					Select a session to view the conversation
				</div>
			</div>
		);
	}

	if (error) {
		// Display action loading error, session details error is logged to console
		return <div className="p-4">Error loading actions: {error.message}</div>;
	}

	// Determine header height for ScrollArea calculation
	const headerHeight = sessionData ? "140px" : "70px"; // Approximate, adjust as needed

	return (
		<div className="h-full flex flex-col bg-white dark:bg-slate-950">
			{/* Updated Header Section */}
			{sessionData && (
				<div className="p-4 border-b flex justify-between items-center">
					<div>
						<h2 className="font-semibold text-lg">
							{sessionData.title || "Conversation"}
						</h2>
					</div>
					<div className="flex items-center space-x-2">
						<Button variant="ghost" size="icon">
							<MoreHorizontal className="h-5 w-5 text-muted-foreground" />
						</Button>
					</div>
				</div>
			)}
			{!sessionData &&
				isLoading && ( // Skeleton for header when loading
					<div className="p-4 border-b">
						<Skeleton className="h-6 w-1/2 mb-1" />
						<Skeleton className="h-4 w-1/4" />
					</div>
				)}

			<div className="flex-1 overflow-hidden">
				{/* Adjusted ScrollArea height calculation */}
				<ScrollArea
					className="h-[calc(100vh-var(--header-height,140px)-var(--input-area-height,80px)-2rem)] pb-4"
					style={
						{
							"--header-height": headerHeight,
							"--input-area-height": "80px",
						} as React.CSSProperties
					}
				>
					<div className="p-4 space-y-4">
						{isLoading ? (
							// Render multiple skeletons for loading state
							Array.from({ length: 5 }, (_, i) => (
								<ActionSkeleton
									key={`action-skeleton-${i}-${Date.now()}`}
									isRightAligned={i % 2 === 0}
								/>
							))
						) : actions && actions.length > 0 ? (
							actions.map((action) => (
								<ActionMessage key={action.id} action={action} />
							))
						) : (
							<div className="text-center py-8 text-muted-foreground">
								No messages in this conversation
							</div>
						)}
					</div>
				</ScrollArea>
			</div>

			<div className="p-4 border-t">
				<div className="relative">
					<textarea
						placeholder="Type your message..."
						className="w-full p-2 pr-20 rounded-md border bg-muted focus:ring-1 focus:ring-primary resize-none"
						rows={1}
						disabled
					/>
					<div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
						<Button variant="ghost" size="icon" disabled>
							<Smile className="w-5 h-5 text-muted-foreground" />
						</Button>
						<Button variant="ghost" size="icon" disabled>
							<Paperclip className="w-5 h-5 text-muted-foreground" />
						</Button>
						<Button size="sm" disabled>
							Send
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

// Simple Avatar Component
const MessageAvatar = ({
	variant,
}: { variant: "user" | "assistant" | "system"; name?: string }) => {
	let bgColor = "bg-gray-400";
	let iconColor = "text-white";

	if (variant === "user") {
		bgColor = "bg-blue-500";
	} else if (variant === "assistant") {
		bgColor = "bg-slate-500";
	} else if (variant === "system") {
		bgColor = "bg-amber-500"; // Color for system/tool avatar
		iconColor = "text-amber-100";
	}

	return (
		<ShadcnAvatar className={`h-8 w-8 ${bgColor}`}>
			<AvatarFallback className={`${bgColor} ${iconColor} text-xs`}>
				{variant === "user" && <User className="h-5 w-5" />}
				{variant === "assistant" && <Bot className="h-5 w-5" />}
				{variant === "system" && <Bot className="h-5 w-5" />}{" "}
			</AvatarFallback>
		</ShadcnAvatar>
	);
};

function ActionMessage({ action }: { action: AgentAction }) {
	const isUser = action.role === "user";
	const isToolOrDecision =
		action.actionType === "tool-invocation" ||
		action.actionType === "orchestration-decision";

	let bubbleClasses = "max-w-[85%] p-3 rounded-lg text-left shadow-sm ";
	let bubbleContainerClasses = "flex items-end space-x-2 ";
	let avatarName = "Agent"; // Default for assistant/system

	if (isUser) {
		bubbleClasses += "bg-blue-500 text-white rounded-br-none";
		bubbleContainerClasses += "justify-end";
		avatarName = "User"; // Or a dynamic user name if available
	} else if (isToolOrDecision) {
		// Yellowish/Amber color for tool/decision messages
		bubbleClasses +=
			"bg-amber-100 text-amber-800 border border-amber-200 rounded-bl-none";
	} else {
		// Assistant message
		bubbleClasses +=
			"bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none";
	}

	// Content of the message (badges, text, time)
	const messageContent = (
		<div className={bubbleClasses}>
			<div className="flex items-center gap-2 mb-1.5">
				<Badge
					variant={isUser ? "outline" : "secondary"}
					className={`text-xs ${isUser ? "border-white/50 text-white/80" : isToolOrDecision ? "bg-amber-200 text-amber-700" : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"}`}
				>
					{isUser ? "User" : isToolOrDecision ? "System" : "Assistant"}
				</Badge>
				<Badge
					variant="outline"
					className={`text-xs ${isUser ? "border-white/50 text-white/80" : isToolOrDecision ? "border-amber-300 text-amber-600" : "dark:border-slate-500"}`}
				>
					{formatActionType(action.actionType)}
				</Badge>
			</div>
			{action.role === "assistant" &&
			action.actionType === "assistant-message" ? (
				<MarkdownRenderer content={action.content} />
			) : (
				action.content
			)}
			<div
				className={`text-xs mt-1.5 ${isUser ? "text-blue-200" : isToolOrDecision ? "text-amber-600" : "text-muted-foreground/80"}`}
			>
				{formatRelative(new Date(action.createdAt), new Date())}
			</div>
		</div>
	);

	return (
		<div className={bubbleContainerClasses}>
			{!isUser && (
				<MessageAvatar
					variant={isToolOrDecision ? "system" : "assistant"}
					name={isToolOrDecision ? "Tool" : avatarName}
				/>
			)}
			{messageContent}
			{isUser && (
				<div className="ml-2">
					<MessageAvatar variant="user" name={avatarName} />
				</div>
			)}
		</div>
	);
}

function ActionSkeleton({ isRightAligned }: { isRightAligned?: boolean }) {
	return (
		<div
			className={`flex items-end space-x-2 mb-4 ${isRightAligned ? "justify-end" : ""}`}
		>
			{!isRightAligned && (
				<ShadcnAvatar className="h-8 w-8">
					<AvatarFallback>
						<Skeleton className="h-8 w-8 rounded-full" />
					</AvatarFallback>
				</ShadcnAvatar>
			)}
			<div className="p-3 rounded-lg bg-muted max-w-[70%]">
				<Skeleton className="h-3 w-20 mb-2" />
				<Skeleton className="h-4 w-full mb-1.5" />
				<Skeleton className="h-4 w-3/4 mb-2" />
				<Skeleton className="h-2.5 w-16" />
			</div>
			{isRightAligned && (
				<ShadcnAvatar className="h-8 w-8">
					<AvatarFallback>
						<Skeleton className="h-8 w-8 rounded-full" />
					</AvatarFallback>
				</ShadcnAvatar>
			)}
		</div>
	);
}

/**
 * Formats the agent action type for display.
 */
function formatActionType(type: AgentAction["actionType"]): string {
	switch (type) {
		case "user-message":
		case "assistant-message":
			return "Message";
		case "tool-invocation":
			return "Tool";
		case "orchestration-decision":
			return "Decision";
		default:
			// Return the original type if it's unknown or needs specific handling
			return type;
	}
}
