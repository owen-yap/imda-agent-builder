import { Hono } from "hono";
import { getOrchestratorById } from "../agents/orchestrator/orchestratorService.ts";
import type { Message as AIMessage } from "ai";
import { getDb } from "../db/drizzle.ts";
import { agentSessions } from "../db/schema/index.ts";
import { z } from "zod";
import { handleOrchestratorStream } from "../agents/orchestrator/orchestratorStreamingService.ts";
import { generateRandomSessionTitle } from "../lib/randomTitleGenerator.ts";

// Schema for chat message payloads
const chatSchema = z.object({
	messages: z.array(
		z
			.object({
				id: z.string().optional(),
				role: z.enum(["user", "assistant", "system", "tool", "function"]),
				content: z.string(),
				name: z.string().optional(),
			})
			.passthrough(),
	),
	orchestratorId: z.string(),
});

export const chatRouter = new Hono();

chatRouter.post("/", async (c) => {
	try {
		const contentType = c.req.header("Content-Type") || "";
		if (!contentType.includes("application/json")) {
			return c.json(
				{
					error: "Invalid Content-Type. Expected application/json",
				},
				400,
			);
		}

		let body: unknown;
		try {
			body = await c.req.json();
		} catch (error) {
			console.error("Error parsing request body:", error);
			return c.json(
				{
					error: "Invalid JSON in request body",
					details: error instanceof Error ? error.message : String(error),
				},
				400,
			);
		}

		// Validate request body
		const result = chatSchema.safeParse(body);
		if (!result.success) {
			console.error("Validation error:", result.error.format());
			return c.json(
				{
					error:
						"Invalid request body. An orchestratorId and valid messages array are required.",
					details: result.error.format(),
				},
				400,
			);
		}

		const { messages, orchestratorId } = result.data;
		const typedMessages = messages as AIMessage[];
		const db = getDb();

		// Ensure the orchestrator exists (no workspace check)
		const orchestrator = await getOrchestratorById(orchestratorId);
		if (!orchestrator) {
			return c.json(
				{
					error: "Orchestrator not found",
				},
				404,
			);
		}

		let currentAgentSessionId = c.req.header("X-Agent-Session-ID");

		if (!currentAgentSessionId) {
			// Generate a random two-word title for the new session
			const sessionTitle = generateRandomSessionTitle();

			// Get client IP address
			let ipAddress = "unknown";
			const xForwardedFor = c.req.header("x-forwarded-for");
			const xRealIp = c.req.header("X-Real-IP");

			if (xForwardedFor) {
				const ips = xForwardedFor.split(",");
				ipAddress = ips[0].trim();
			} else if (xRealIp) {
				ipAddress = xRealIp.trim();
			}

			// Basic IPv4 validation (can be made more robust)
			const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
			if (!ipv4Regex.test(ipAddress)) {
				ipAddress = "unknown"; // Reset if not a valid IPv4 format
			}

			// Create a new session
			const [newSession] = await db
				.insert(agentSessions)
				.values({
					title: sessionTitle,
					ipAddress,
					orchestratorId,
				})
				.returning();

			currentAgentSessionId = newSession.id;
		}

		console.log(
			"Chat endpoint processing with agent session ID:",
			currentAgentSessionId,
		);

		// Use the chat stream handler and pass the agent session ID for logging
		const response = handleOrchestratorStream(
			c,
			typedMessages,
			orchestratorId,
			currentAgentSessionId,
		);

		// Include the agent session ID in the response headers
		response.headers.set("X-Agent-Session-ID", currentAgentSessionId);
		// Allow the browser to expose this custom header to the client-side JavaScript
		response.headers.append(
			"Access-Control-Expose-Headers",
			"X-Agent-Session-ID",
		);
		return response;
	} catch (error) {
		console.error("Error in chat endpoint:", error);
		return c.json(
			{
				error: "Failed to process chat request",
				message: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
});
