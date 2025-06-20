import { createRetrievalTool } from "./ragTool.ts";
import { getWorkerById } from "../workers/workerService.ts";
import type { Tool } from "ai";

// Function to get available tools for a workspace
export function getAvailableTools(workspaceId: string) {
	return {
		// RAG tool for knowledge base access
		queryKnowledgeBase: createRetrievalTool(workspaceId),
	};
}

// Function to get tools based on a worker agent's configuration
export async function getToolsByWorkerId(workerId: string) {
	try {
		// Get the worker
		const worker = await getWorkerById(workerId);
		if (!worker) {
			throw new Error(`Worker with ID ${workerId} not found`);
		}

		// Get basic tools for the worker's workspace
		const tools = getAvailableTools(worker.workspaceId);

		// Parse the worker's tools configuration
		const workerTools = worker.tools as {
			name: string;
			description: boolean;
		}[];

		// Filter tools based on worker configuration
		const enabledTools: Record<string, Tool> = {};

		// Only include tools that are explicitly enabled for this worker
		for (const [toolName, toolImpl] of Object.entries(tools)) {
			const workerTool = workerTools.find((t) => t.name === toolName);

			// If the tool is explicitly configured and enabled, or if there's no configuration (default to enabled)
			if (workerTool) {
				enabledTools[toolName] = toolImpl;
			}
		}

		return enabledTools;
	} catch (error) {
		console.error("Error getting tools for worker:", error);
		// Return empty tools object on error
		return {};
	}
}

// Function to format system message with tools information
export function formatSystemMessageWithTools(baseSystemMessage: string) {
	return `${baseSystemMessage}

You have access to the following tools:
- queryKnowledgeBase: Use this tool when the user asks about specific documents or information that might be in the knowledge base.

Tool Usage Guidelines:
1. Use the queryKnowledgeBase tool when the user asks for information that might be in the knowledge base. You should judge if the user's question is related to the knowledge base by referring to the context you already have.
2. The queryKnowledgeBase tool uses cosine distance to find the most relevant information from the knowledge base, which might not be relevant to the user's question at all. In those cases, respond with "I can't reply to that as I don't have the relevant information in my knowledge base."
3. If there is information in the knowledge base that is relevant to the user's question, use the information to answer the question.
4. ONLY answer based on the information returned by the tool. Do not use prior knowledge.
`;
}
