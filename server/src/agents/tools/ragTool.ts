import { tool } from "ai";
import { getRelevantDocumentChunks } from "../../functions/rag/documentQueryService.ts";
import z from "zod";

// Interface for Retrieval tool parameters
interface RetrievalToolParams {
	query: string;
}

// Retrieval tool schema
const retrievalToolSchema = z.object({
	query: z
		.string()
		.describe("The user's question to search in the knowledge base"),
});

// Tool for retrieving knowledge from documents
export function createRetrievalTool(workspaceId: string) {
	return tool({
		description:
			"Query the knowledge base for information related to the user's question. Use this tool when the user asks about specific documents or information that might be in the knowledge base.",
		parameters: retrievalToolSchema,
		execute: async ({ query }: RetrievalToolParams) => {
			const maxContextTokens = 20000;
			console.log(`Retrieving relevant document chunks for query: "${query}"`);

			const relevantChunks = await getRelevantDocumentChunks(
				query,
				maxContextTokens,
				workspaceId,
			);

			if (relevantChunks.length === 0) {
				return {
					relevant: false,
					message: "No relevant information found in the knowledge base.",
					context: "",
				};
			}

			// Format the context from relevant chunks
			const context = relevantChunks
				.map((chunk) => {
					return `Content from "${chunk.documentTitle}":\n${chunk.content}`;
				})
				.join("\n\n");

			return {
				relevant: true,
				message: `Found ${relevantChunks.length} relevant document chunks.`,
				context,
			};
		},
	});
}
