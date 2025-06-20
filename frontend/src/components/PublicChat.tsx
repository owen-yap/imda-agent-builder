import { useState, useRef, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getContrastColor } from "@/lib/colors";

interface PublicChatProps {
	orchestratorId: string;
	botName?: string;
	primaryColor?: string;
}

// Component for rendering a single message
const ChatMessage = ({
	message,
	isLoading,
	primaryColor,
}: {
	message: Message;
	isLoading?: boolean;
	primaryColor?: string;
}) => {
	const isUser = message.role === "user";
	const isEmpty =
		!message.content && (!message.parts || message.parts.length === 0);

	// Don't render empty assistant messages unless loading
	if (!isUser && isEmpty && !isLoading) {
		return null;
	}

	const defaultPrimaryColor = "#A7C7E7"; // Fallback if primaryColor is invalid
	const effectivePrimaryColor = primaryColor && primaryColor.startsWith("#") ? primaryColor : defaultPrimaryColor;

	const userMessageBgColor = effectivePrimaryColor;
	const userMessageFgColor = getContrastColor(effectivePrimaryColor);

	// Assistant messages will have a light grey background, text color will be standard.
	const assistantMessageBg = "#F0F0F0"; // A light, neutral grey
	const assistantMessageFg = "#000000"; // Black text for readability

	const botIconBgColor = `${effectivePrimaryColor}33`; // Primary color with low opacity
	const botIconFgColor = effectivePrimaryColor;

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
					{message.parts.map((part, index) => {
						if (part.type === "text") {
							return (
								<MarkdownRenderer
									key={`${message.id}-part-${index}`}
									content={part.text || ""}
								/>
							);
						}
						return null;
					})}
				</div>
			);
		}
		return <MarkdownRenderer content={message.content} />;
	};

	return (
		<div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
			{!isUser && (
				<div
					className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
					style={{
						backgroundColor: botIconBgColor,
						color: botIconFgColor,
					}}
				>
					<Bot className="h-4 w-4" />
				</div>
			)}
			<div
				className="rounded-lg px-4 py-2 max-w-[85%] backdrop-blur-sm shadow-sm"
				style={{
					backgroundColor: isUser ? userMessageBgColor : assistantMessageBg,
					color: isUser ? userMessageFgColor : assistantMessageFg,
				}}
			>
				{isUser ? message.content : renderContent()}
			</div>
			{isUser && (
				<div
					className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
					style={{
						backgroundColor: effectivePrimaryColor,
					}}
				>
					<User
						className="h-4 w-4"
						style={{ color: userMessageFgColor }}
					/>
				</div>
			)}
		</div>
	);
};

export function PublicChat({
	orchestratorId,
	botName = "AI Assistant",
	primaryColor,
}: PublicChatProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [agentSessionId, setAgentSessionId] = useState<string | null>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
	const inputRef = useRef<HTMLInputElement>(null);

	const {
		messages,
		input,
		handleInputChange,
		handleSubmit: originalHandleSubmit,
		isLoading: chatIsLoading,
	} = useChat({
		api: `${import.meta.env.VITE_BACKEND_API_URL}/public/chat`,
		headers: {
			"Content-Type": "application/json",
			"x-Agent-Session-ID": agentSessionId || "",
		},
		body: {
			orchestratorId,
		},
		maxSteps: 5,
		initialMessages: [
			{
				id: "initial-message",
				role: "assistant",
				content: `👋 Hi! I am ${botName}, how can I help you today?`,
			},
		],
		onError: (error) => {
			console.error("Chat API error:", error);
			setIsLoading(false);
		},
		onResponse: (response) => {
			if (!response.ok) {
				console.error("API returned error status:", response.status);
			}
			const newAgentSessionId = response.headers.get("X-Agent-Session-ID");

			if (newAgentSessionId) {
				setAgentSessionId(newAgentSessionId);
			}
			setIsLoading(false);
		},
		onFinish: () => {
			setIsLoading(false);
		},
	});

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
	}, [
		shouldAutoScroll,
		messages.length,
		messages[messages.length - 1]?.content,
	]);

	const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		setIsLoading(true);
		e.preventDefault();

		if (!input.trim()) {
			setIsLoading(false);
			return;
		}

		setShouldAutoScroll(true);
		originalHandleSubmit(e);
		if (inputRef.current) {
			inputRef.current.blur();
		}
	};

	// Define fixed colors and derive from primaryColor if valid
	const CHAT_SCROLL_AREA_BG = "#FFFFFF";
	const INPUT_SECTION_BG = "#F0F0F0";
	const INPUT_BORDER_COLOR = "#E0E0E0";
	const INPUT_FIELD_BG = "#FFFFFF";
	const INPUT_FIELD_FG = "#000000";
	const INPUT_FIELD_BORDER = "#CCCCCC";

	const defaultHeaderBg = "#4A4A4A"; // Default dark gray for header
	const effectivePrimaryColor = (primaryColor && primaryColor.startsWith("#")) ? primaryColor : defaultHeaderBg;
	const headerBg = effectivePrimaryColor;
	const headerFg = getContrastColor(headerBg);
	const headerEffectiveStyle = { backgroundColor: headerBg, color: headerFg };
	const headerBaseClasses = "py-3 px-4 h-[10%] max-h-16 flex items-center font-semibold";

	const sendButtonBg = `${effectivePrimaryColor}7A`; // 10% opacity of accent color (was 1A which is ~10%)
	const sendButtonIconColor = "black"; // Icon color same as primary color

	return (
		<div
			className="flex flex-col rounded-none shadow-none border-0 p-0"
			style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
		>
			<div style={headerEffectiveStyle} className={headerBaseClasses}>
				<div className="flex flex-col items-start">
					<h2 className="text-lg">{botName}</h2>
					<p className="text-xs" style={{ color: headerFg, opacity: 0.8 }}>
						Get your own agent at{" "}
						<a
							href="https://mona.sg"
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
							style={{ color: headerFg }}
						>
							mona.sg
						</a>
					</p>
				</div>
			</div>

			<div
				className="flex-1 flex flex-col overflow-hidden min-h-0"
				style={{ backgroundColor: CHAT_SCROLL_AREA_BG }}
			>
				<ScrollArea
					className="flex-1 min-h-0 w-full px-4"
					viewportRef={viewportRef}
					onScroll={handleScroll}
				>
					<div className="space-y-4 py-4">
						{messages.map((message) => (
							<ChatMessage
								key={message.id}
								message={message}
								isLoading={chatIsLoading && messages[messages.length -1]?.id === message.id && message.role === 'assistant'}
								primaryColor={primaryColor}
							/>
						))}
					</div>
				</ScrollArea>
				<div
					className="w-full p-4 border-t"
					style={{ backgroundColor: INPUT_SECTION_BG, borderTopColor: INPUT_BORDER_COLOR }}
				>
					<form
						onSubmit={handleFormSubmit}
						className="flex gap-2 w-full justify-between align-middle"
					>
						<Input
							ref={inputRef}
							value={input}
							onChange={handleInputChange}
							placeholder="Type your message..."
							className="flex-1 shadow-sm h-12 rounded-md px-4 min-w-0" // Removed bg-background
							style={{
								backgroundColor: INPUT_FIELD_BG,
								color: INPUT_FIELD_FG,
								border: `1px solid ${INPUT_FIELD_BORDER}`,
							}}
						/>
						<Button
							type="submit"
							size="icon"
							disabled={isLoading || !input.trim()}
							className="shadow-sm h-11 w-11" // Removed hover:bg-primary/20
							style={{
								backgroundColor: sendButtonBg,
								color: sendButtonIconColor,
							}}
						>
							<Send className="h-4 w-4" />
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
