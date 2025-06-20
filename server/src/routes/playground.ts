import { Hono } from "hono";
import { z } from "zod";
import type { Message as AIMessage } from "ai";
import { workspaceRequiredMiddleware } from "../middleware/workspaceRequiredMiddleware.ts";
import { getOrchestratorById } from "../agents/orchestrator/orchestratorService.ts";
import { handleOrchestratorStream } from "../agents/orchestrator/orchestratorStreamingService.ts";

// Schema for playground message payloads
const playgroundSchema = z.object({
	messages: z.array(
		z
			.object({
				id: z.string().optional(),
				role: z.enum(["user", "assistant", "system", "tool", "function"]),
				content: z.string(),
				name: z.string().optional(),
				// Allow for additional properties that might be present in the SDK messages
			})
			.passthrough(),
	),
	orchestratorId: z.string(),
});

// Create playground router
export const playgroundRouter = new Hono();

// Apply workspace middleware
playgroundRouter.use("*", workspaceRequiredMiddleware);

// Main playground endpoint - requires orchestratorId
playgroundRouter.post("/", async (c) => {
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
		const result = playgroundSchema.safeParse(body);
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
		const workspaceId = c.get("workspaceId");

		// Type safety check after middleware
		if (!workspaceId) {
			return c.json({ error: "Workspace ID is required" }, 400);
		}

		// Ensure the orchestrator belongs to the workspace
		const orchestrator = await getOrchestratorById(orchestratorId);
		if (!orchestrator || orchestrator.workspaceId !== workspaceId) {
			return c.json(
				{
					error: "Orchestrator does not belong to the workspace",
				},
				403,
			);
		}

		return handleOrchestratorStream(
			c,
			typedMessages,
			orchestratorId,
			undefined,
			true,
		);
	} catch (error) {
		console.error("Error in playground endpoint:", error);
		return c.json(
			{
				error: "Failed to process playground request",
				message: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
});
