import type { Context } from "hono";
import type { Message as AIMessage, ToolSet } from "ai";
import { streamText, createDataStreamResponse } from "ai";
import { getOpenAIModel } from "../../functions/clients/openai.ts";
import { orchestrateQuery } from "./orchestratorService.ts";
import { getDb } from "../../db/drizzle.ts";
import { agentActions } from "../../db/schema/index.ts";

type ActionType =
	| "user-message"
	| "tool-invocation"
	| "orchestration-decision"
	| "assistant-message";

/**
 * Logs a message to the database for a session
 * @param sessionId The session ID to log for
 * @param role The role of the message sender (user/assistant)
 * @param actionType The type of action being logged
 * @param content The content of the message
 */
async function saveMessageForSession(
	sessionId: string,
	role: "user" | "assistant",
	actionType: ActionType,
	content: string,
): Promise<void> {
	if (!sessionId) return;

	const db = getDb();

	// Log the message to the database
	await db.insert(agentActions).values({
		agentSessionId: sessionId,
		role,
		actionType,
		content,
	});
}

/**
 * Cleans up messages by keeping only the latest tool call results
 * @param messages Array of AI messages to clean up
 * @returns Cleaned up array of AI messages
 */
function cleanupMessages(messages: AIMessage[]): AIMessage[] {
	return messages.map((message) => {
		// If message has no parts, return as is
		if (
			!message.parts ||
			!Array.isArray(message.parts) ||
			message.parts.length === 0
		) {
			return message;
		}

		// Find all tool invocation parts
		const toolInvocationParts = message.parts.filter(
			(part: { type: string; toolInvocation?: { toolCallId: string } }) =>
				part.type === "tool-invocation",
		);

		// If no tool invocation parts, return as is
		if (toolInvocationParts.length === 0) {
			return message;
		}

		// Get the latest tool invocation part
		const latestToolInvocationPart =
			toolInvocationParts[toolInvocationParts.length - 1];
		const latestToolCallId = (
			latestToolInvocationPart as { toolInvocation?: { toolCallId: string } }
		).toolInvocation?.toolCallId;

		// Create a new message with only the latest tool invocation in parts
		const cleanedParts = message.parts.filter(
			(part: { type: string; toolInvocation?: { toolCallId: string } }) => {
				// Keep non-tool-invocation parts
				if (part.type !== "tool-invocation") return true;
				// Keep only the latest tool invocation part
				return (
					(part as { toolInvocation?: { toolCallId: string } }).toolInvocation
						?.toolCallId === latestToolCallId
				);
			},
		);

		// Create a new version of the message with cleaned parts
		const cleanedMessage = {
			...message,
			parts: cleanedParts,
		};

		// Also clean up toolInvocations field if it exists (for backward compatibility)
		if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
			cleanedMessage.toolInvocations = message.toolInvocations.filter(
				(invocation: { toolCallId: string }) =>
					invocation.toolCallId === latestToolCallId,
			);
		}

		return cleanedMessage;
	});
}

/**
 * Handles streaming responses for both chat and playground using the orchestrator
 * @param c Hono context
 * @param messages Array of AI messages from the conversation
 * @param orchestratorId ID of the orchestrator to use
 * @param sessionId Optional session ID for logging interactions
 * @param isPlayground Whether this is a playground request (defaults to false)
 * @returns Streamed response
 */
export function handleOrchestratorStream(
	c: Context,
	messages: AIMessage[],
	orchestratorId: string,
	sessionId?: string,
	isPlayground = false,
) {
	try {
		// Clean up messages before processing
		const cleanedMessages = cleanupMessages(messages);
		console.log("Cleaned messages:", cleanedMessages);
		console.log(
			"Received last message:",
			cleanedMessages[cleanedMessages.length - 1],
		);

		if (
			!cleanedMessages ||
			!Array.isArray(cleanedMessages) ||
			cleanedMessages.length === 0
		) {
			return c.json({ error: "No messages provided in the request" }, 400);
		}

		const lastMessage = cleanedMessages[cleanedMessages.length - 1];

		if (!isPlayground && sessionId) {
			if (lastMessage && lastMessage.role === "user") {
				// Existing session: Log only the latest user message
				const userMessageContent = lastMessage.content;
				saveMessageForSession(
					sessionId,
					"user",
					"user-message",
					userMessageContent,
				);
			}
		}

		// Find the last user message for processing (not necessarily the last in the array)
		let lastUserMessage: AIMessage | undefined;
		for (let i = cleanedMessages.length - 1; i >= 0; i--) {
			if (cleanedMessages[i].role === "user") {
				lastUserMessage = cleanedMessages[i];
				break;
			}
		}

		// Handle case where no user message is found
		if (!lastUserMessage) {
			return c.json(
				{
					error:
						"No user message found in the conversation. Please include at least one user message.",
				},
				400,
			);
		}

		// Extract content, handling string or object formats
		const query =
			typeof lastUserMessage.content === "string"
				? lastUserMessage.content
				: "";

		if (!query) {
			return c.json(
				{ error: "No query content found in the user message" },
				400,
			);
		}

		console.log(
			`Processing ${isPlayground ? "playground" : "chat"} query:`,
			query,
		);

		// Use the AI SDK to create a data stream response
		const response = createDataStreamResponse({
			// Execute function for handling the stream
			execute: async (dataStream) => {
				try {
					// Write initial orchestration message
					dataStream.writeData({
						type: "start",
						timestamp: new Date().toISOString(),
						message: "Orchestrating your query...",
					});

					// Use orchestrator to select and prepare the worker agent
					const orchestrationResult = await orchestrateQuery(
						orchestratorId,
						query,
						cleanedMessages,
					);

					// Error handling if no worker is found
					if (
						!orchestrationResult.worker ||
						!orchestrationResult.systemMessage
					) {
						dataStream.writeData({
							type: "error",
							timestamp: new Date().toISOString(),
							message:
								"Failed to select a worker agent. No suitable worker found for this query.",
						});
						return;
					}

					// Write worker selection info
					dataStream.writeData({
						type: "worker_selected",
						timestamp: new Date().toISOString(),
						message: `Selected ${orchestrationResult.worker.name}`,
					});

					// Log orchestration decision if this is not playground
					if (!isPlayground && sessionId) {
						saveMessageForSession(
							sessionId,
							"assistant",
							"orchestration-decision",
							`Selected ${orchestrationResult.worker.name}`,
						).catch((error) => {
							console.error("Error logging orchestration decision:", error);
						});
					}

					// Get OpenAI model
					const model = getOpenAIModel();

					// Stream the AI response
					const result = streamText({
						model,
						messages: cleanedMessages,
						system: orchestrationResult.systemMessage,
						tools: orchestrationResult.tools as ToolSet,
						onStepFinish: async (stepResult) => {
							// Only process tool calls or results in non-playground mode with a session ID
							if (isPlayground || !sessionId) return;

							// Log tool calls and results
							if (stepResult.toolCalls && stepResult.toolCalls.length > 0) {
								for (const toolCall of stepResult.toolCalls) {
									try {
										await saveMessageForSession(
											sessionId,
											"assistant",
											"tool-invocation",
											toolCall.toolName, // Log only the tool name
										);
									} catch (error) {
										console.error("Error logging tool call:", error);
									}
								}
							}
						},
						onFinish: async (finishResult) => {
							// Log the full assistant response when everything is done
							if (!isPlayground && sessionId && finishResult.text) {
								try {
									await saveMessageForSession(
										sessionId,
										"assistant",
										"assistant-message",
										finishResult.text,
									);
									console.log(
										"Logged assistant response for session:",
										sessionId,
									);
								} catch (error) {
									console.error("Error logging assistant response:", error);
								}
							}
						},
					});

					// Merge the AI response stream into our data stream
					result.mergeIntoDataStream(dataStream);
				} catch (error) {
					console.error("Error in execute function:", error);
					dataStream.writeData({
						type: "error",
						timestamp: new Date().toISOString(),
						message: error instanceof Error ? error.message : String(error),
					});
				}
			},
			onError: (error) => {
				console.error(
					`Error in orchestrator ${isPlayground ? "playground" : "chat"}:`,
					error,
				);
				return error instanceof Error ? error.message : String(error);
			},
		});

		// If this is not playground and we have a session ID, just set the session ID header
		if (!isPlayground && sessionId) {
			// We'll wrap the response with a custom header
			const originalResponse = response;
			const finalResponse = new Response(
				originalResponse.body,
				originalResponse,
			);

			// Set the session ID header
			finalResponse.headers.set("X-Session-ID", sessionId);

			return finalResponse;
		}

		return response;
	} catch (error) {
		console.error(
			`Error in orchestrator ${isPlayground ? "playground" : "chat"} stream:`,
			error,
		);
		return c.json(
			{
				error: `Failed to process orchestrated ${isPlayground ? "playground" : "chat"} request`,
				message: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
}
