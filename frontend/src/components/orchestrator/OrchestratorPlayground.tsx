import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Wand2, Info, Clock, ArrowRight } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { useAuth } from "@/lib/auth-context";
import { useRouteContext } from "@tanstack/react-router";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface OrchestratorPlaygroundProps {
	orchestratorId: string;
}

// New type for activity logs
interface ActivityLog {
	id: string;
	timestamp: Date;
	type:
		| "user-message"
		| "orchestrator-activity"
		| "worker-selection"
		| "tool-usage"
		| "assistant-response"
		| "error";
	details: string;
}

// Type for data stream events
interface StreamDataEvent {
	type?: string;
	message?: string;
	timestamp?: string;
}

// Component for rendering a single message
const ChatMessage = ({
	message,
	isLoading,
}: { message: Message; isLoading?: boolean }) => {
	const isUser = message.role === "user";
	const isEmpty =
		!message.content && (!message.parts || message.parts.length === 0);

	// Don't render empty assistant messages unless loading
	if (!isUser && isEmpty && !isLoading) {
		return null;
	}

	const renderContent = () => {
		// If it's an empty assistant message and loading, show loading state
		if (!isUser && isEmpty && isLoading) {
			return (
				<TextShimmer className="text-sm" duration={1}>
					Assistant is responding...
				</TextShimmer>
			);
		}

		if (message.parts && message.parts.length > 0) {
			return (
				<div className="space-y-2">
					{message.parts.map((part, index) =>
						part.type === "text" ? (
							<MarkdownRenderer
								key={`${message.id}-part-${index}`}
								content={part.text || ""}
							/>
						) : null,
					)}
				</div>
			);
		}
		return <MarkdownRenderer content={message.content} />;
	};

	return (
		<div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
			{!isUser && (
				<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
					<Bot className="h-5 w-5 text-primary" />
				</div>
			)}
			<div
				className={`rounded-lg px-4 py-3 max-w-[80%] shadow-lg backdrop-blur-sm ${
					isUser ? "bg-primary/90 text-primary-foreground" : "bg-card/90"
				}`}
			>
				{isUser ? message.content : renderContent()}
			</div>
			{isUser && (
				<div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-md">
					<User className="h-5 w-5 text-primary-foreground" />
				</div>
			)}
		</div>
	);
};

export function OrchestratorPlayground({
	orchestratorId,
}: OrchestratorPlaygroundProps) {
	const { session } = useAuth();
	const { orchestratorWithWorkers } = useRouteContext({
		from: "/_authenticated/orchestrator/$orchestratorId",
	});
	const [isLoading, setIsLoading] = useState(false);
	const viewportRef = useRef<HTMLDivElement>(null);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
	const [shouldActivityLogAutoScroll, setShouldActivityLogAutoScroll] =
		useState(true);
	const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
	const logViewportRef = useRef<HTMLDivElement>(null);
	const prevMessagesRef = useRef<Message[]>([]);

	const addActivityLog = (newLog: ActivityLog) => {
		const exists = activityLogs.some((log) => log.id === newLog.id);
		if (exists) {
			return; // Return previous logs if the new log already exists
		}
		setActivityLogs((prev) => [...prev, newLog]);
		setShouldActivityLogAutoScroll(true);
	};

	const {
		messages,
		input,
		handleInputChange,
		handleSubmit: originalHandleSubmit,
		data,
		setData,
	} = useChat({
		api: `${import.meta.env.VITE_BACKEND_API_URL}/authenticated/playground`,
		headers: {
			Authorization: `Bearer ${session?.access_token}`,
			"Content-Type": "application/json",
		},
		body: {
			orchestratorId,
		},
		maxSteps: 5,
		initialMessages: [
			{
				id: "initial-message",
				role: "assistant",
				content: "Hello! I'm your AI assistant. How can I help you today?",
			},
		],
		onError: (error) => {
			console.error("Chat API error:", error);
			// Log errors to activity log
			addActivityLog({
				id: `log-${Date.now()}`,
				timestamp: new Date(),
				type: "error",
				details: `Error: ${error.message || "Unknown error occurred"}`,
			});
		},
		onToolCall: (_toolCall) => {
			setIsLoading(true);
		},
		onResponse: (response) => {
			if (!response.ok) {
				console.error("API returned error status:", response.status);
				response
					.json()
					.then((data) => {
						console.error("Error details:", data);
					})
					.catch((err) => {
						console.error("Failed to parse error response:", err);
					});
			}
		},
		onFinish: () => {
			setIsLoading(false);
			// Log completion
			addActivityLog({
				id: `log-${Date.now()}`,
				timestamp: new Date(),
				type: "assistant-response",
				details: "Assistant responded",
			});
		},
	});

	// Track data stream changes
	useEffect(() => {
		if (!data) return;
		const lastStreamData = data[data.length - 1] as StreamDataEvent;

		// Check for specific data events from the orchestrator
		if (lastStreamData.timestamp && lastStreamData.message) {
			if (lastStreamData.type === "worker_selected") {
				addActivityLog({
					id: `${lastStreamData.type}-${lastStreamData.timestamp}`,
					timestamp: new Date(lastStreamData.timestamp),
					type: "worker-selection",
					details: lastStreamData.message,
				});
			} else if (lastStreamData.type === "start") {
				addActivityLog({
					id: `${lastStreamData.type}-${lastStreamData.timestamp}`,
					timestamp: new Date(lastStreamData.timestamp),
					type: "orchestrator-activity",
					details: lastStreamData.message,
				});
			} else if (lastStreamData.type === "error") {
				// Log any other data events
				addActivityLog({
					id: `${lastStreamData.type}-${lastStreamData.timestamp}`,
					timestamp: new Date(lastStreamData.timestamp),
					type: "error",
					details: lastStreamData.message,
				});
			} else {
				addActivityLog({
					id: `${lastStreamData.type}-${lastStreamData.timestamp}`,
					timestamp: new Date(lastStreamData.timestamp),
					type: "orchestrator-activity",
					details: lastStreamData.message,
				});
			}
		}
	}, [data]);

	// Track message changes to detect tool invocations
	useEffect(() => {
		if (messages.length === 0) return;

		// Get the newest message
		const latestMessage = messages[messages.length - 1];

		// If this is a user message and it's new (not in prevMessagesRef)
		if (
			latestMessage.role === "user" &&
			(!prevMessagesRef.current[messages.length - 1] ||
				prevMessagesRef.current[messages.length - 1]?.id !== latestMessage.id)
		) {
			addActivityLog({
				id: `user-message-${Date.now()}`,
				timestamp: new Date(),
				type: "user-message",
				details: "User sent a message",
			});
		}

		// If this is an assistant message with parts that contain tool invocations
		if (latestMessage.role === "assistant" && latestMessage.parts) {
			// Get tool invocation parts
			const toolParts = latestMessage.parts.filter(
				(part) =>
					part.type === "tool-invocation" &&
					"toolInvocation" in part &&
					part.toolInvocation,
			);

			// Process tool parts and log new ones using toolCallId for uniqueness
			for (const part of toolParts) {
				if (
					"toolInvocation" in part &&
					part.toolInvocation &&
					"toolCallId" in part.toolInvocation &&
					part.toolInvocation.toolCallId
				) {
					const { toolCallId, toolName } = part.toolInvocation;

					// Check if this tool call is already logged using its ID
					const alreadyLogged = activityLogs.some(
						(log) => log.id === `tool-${toolCallId}`,
					);

					// Only log if it's a new tool call
					if (!alreadyLogged) {
						addActivityLog({
							id: `tool-${toolCallId}`,
							timestamp: new Date(),
							type: "tool-usage",
							details: `Using tool: ${toolName || "unknown"}`,
						});
					}
				}
			}
		}

		// Update the previous messages ref
		prevMessagesRef.current = [...messages];
	}, [messages, activityLogs]);

	// Handle scroll events to determine if we should auto-scroll
	const handleScroll = () => {
		if (!viewportRef.current) return;

		const viewport = viewportRef.current;
		const isAtBottom =
			Math.abs(
				viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight,
			) < 10;
		setShouldAutoScroll(isAtBottom);
	};

	// Handle scroll events to determine if we should auto-scroll
	const handleActivityLogScroll = () => {
		if (!logViewportRef.current) return;

		const viewport = logViewportRef.current;
		const isAtBottom =
			Math.abs(
				viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight,
			) < 10;
		setShouldActivityLogAutoScroll(isAtBottom);
	};

	// Scroll to bottom when new messages arrive
	useLayoutEffect(() => {
		if (!viewportRef.current || !shouldAutoScroll) return;

		const viewport = viewportRef.current;
		const targetScroll = viewport.scrollHeight - viewport.clientHeight;

		// Only scroll if we're not already at the bottom
		if (Math.abs(viewport.scrollTop - targetScroll) > 10) {
			viewport.scrollTo({
				top: targetScroll,
				behavior: "smooth",
			});
		}
	}, [shouldAutoScroll, messages]);

	// Scroll log to bottom when new activities arrive
	useLayoutEffect(() => {
		if (!logViewportRef.current || !shouldActivityLogAutoScroll) return;

		const viewport = logViewportRef.current;
		const targetScroll = viewport.scrollHeight - viewport.clientHeight;

		if (Math.abs(viewport.scrollTop - targetScroll) > 10) {
			viewport.scrollTo({
				top: targetScroll,
				behavior: "smooth",
			});
		}
	}, [shouldActivityLogAutoScroll, activityLogs]);

	const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		setIsLoading(true);
		e.preventDefault();

		if (!input.trim()) return;

		setData(undefined);
		setShouldAutoScroll(true);

		originalHandleSubmit(e);
	};

	// Render an activity log item with appropriate icon and styling
	const renderActivityLog = (log: ActivityLog) => {
		const time = log.timestamp.toLocaleTimeString();

		let icon = <Info className="h-3 w-3 text-muted-foreground" />;
		const textColor = "text-foreground";

		switch (log.type) {
			case "user-message":
				icon = <User className="h-3 w-3 text-primary" />;
				break;
			case "orchestrator-activity":
				icon = <Clock className="h-3 w-3 text-amber-500" />;
				break;
			case "worker-selection":
				icon = <ArrowRight className="h-3 w-3 text-green-500" />;
				break;
			case "tool-usage":
				icon = <Wand2 className="h-3 w-3 text-blue-500" />;
				break;
			case "assistant-response":
				icon = <Bot className="h-3 w-3 text-primary" />;
				break;
		}

		return (
			<div key={log.id} className="py-2 border-b border-border last:border-0">
				<div className="flex items-center space-x-2 text-sm">
					{icon}
					<span className="text-xs text-muted-foreground">{time}</span>
					<span className={textColor}>{log.details}</span>
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col h-full max-w-[1200px] w-[90%] mx-auto">
			<div className="mb-4">
				<h1 className="text-2xl font-semibold">
					Playground: {orchestratorWithWorkers?.name}
				</h1>
			</div>
			<div className="flex h-[calc(100%-3rem)] pt-10">
				<div className="relative w-[60%] h-full pr-4">
					<ScrollArea
						className="h-[calc(100%-6rem)] w-full"
						viewportRef={viewportRef}
						onScroll={handleScroll}
					>
						<div className="space-y-6 pb-10 pr-4">
							{messages.map((message) => (
								<ChatMessage
									key={message.id}
									message={message}
									isLoading={isLoading}
								/>
							))}
						</div>
					</ScrollArea>

					<div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
						<form onSubmit={handleFormSubmit} className="flex gap-2">
							<Input
								value={input}
								onChange={handleInputChange}
								placeholder="Type your message..."
								className="flex-1 bg-background shadow-lg h-12"
							/>
							<Button
								type="submit"
								size="icon"
								disabled={isLoading}
								className="shadow-lg h-12 w-12"
							>
								<Send className="h-4 w-4" />
							</Button>
						</form>
					</div>
				</div>

				<div className="w-[35%] h-full">
					<Card className="h-[85%] overflow-hidden shadow-lg bg-accent border relative flex flex-col">
						<CardHeader className="pl-4">
							<CardTitle>Agent Activity Log</CardTitle>
						</CardHeader>
						<CardContent className="p-0 flex-1 overflow-hidden">
							<ScrollArea
								className="h-full"
								viewportRef={logViewportRef}
								onScroll={handleActivityLogScroll}
							>
								<div className="space-y-1 p-4">
									{activityLogs.length === 0 ? (
										<div className="text-sm text-muted-foreground text-center py-4">
											No activity yet. Start a conversation to see agent
											decisions.
										</div>
									) : (
										activityLogs.map((log) => renderActivityLog(log))
									)}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
