import { getDb } from "../../db/drizzle.ts";
import { sql } from "drizzle-orm";
import { getOpenAIModel, getOpenAIEmbeddingModel } from "../clients/openai.ts";
import { embed, generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { encode } from "gpt-tokenizer";

// Interface for document chunk results
interface DocumentChunkResult {
	chunkId: string;
	documentId: string;
	documentTitle: string;
	content: string;
	tokenSize: number;
	metadata: Record<string, unknown>;
	similarity: number;
}

/**
 * Retrieves relevant document chunks for a given query
 * @param query The user's query
 * @param maxTokens Maximum number of tokens to use in context (default: 7000)
 * @param workspaceId Optional workspace ID to filter results by
 * @returns Array of relevant document chunks with their content and metadata
 */
export async function getRelevantDocumentChunks(
	query: string,
	maxTokens = 20000, // Reasonable default that works for most models
	workspaceId?: string,
): Promise<DocumentChunkResult[]> {
	console.log(`Generating embedding for query: "${query}"...`);
	if (workspaceId) {
		console.log(`Filtering results by workspace ID: ${workspaceId}`);
	}

	try {
		// Generate embedding for the query using AI SDK
		const embeddingModel = getOpenAIEmbeddingModel();
		const { embedding: queryEmbedding } = await embed({
			model: embeddingModel,
			value: query,
			maxRetries: 2,
		});

		console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);

		const db = getDb();
		const embeddingStr = `[${queryEmbedding.join(",")}]`;

		// Use a higher limit initially so we can maximize context based on token size
		const initialLimit = 1000; // Get more chunks than we might need so we can select based on tokens

		console.log("Performing direct vector similarity search...");

		// Add workspace filter if provided
		const workspaceFilter = workspaceId
			? sql`AND d.workspace_id = ${workspaceId}`
			: sql``;

		const results = await db.execute(sql`
				SELECT 
					dc.id as "chunkId",
					dc.document_id as "documentId",
					dc.content,
					dc.token_size as "tokenSize",
					dc.metadata,
					d.title as "documentTitle",
					1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
				FROM document_chunks dc
				JOIN documents d ON dc.document_id = d.id
				WHERE 1=1 ${workspaceFilter}
				ORDER BY dc.embedding <=> ${embeddingStr}::vector
				LIMIT ${initialLimit}
			`);

		// Convert the results
		const chunks = results as unknown as DocumentChunkResult[];

		// Approximate token size for query and system message
		const estimatedQueryAndSystemTokens = encode(query).length + 1000; // 1000 is a buffer for system message

		// Token budget for context chunks
		const tokenBudget = maxTokens - estimatedQueryAndSystemTokens;

		// Select chunks to fit within token budget
		const selectedChunks: DocumentChunkResult[] = [];
		let totalTokens = 0;

		// Sort by similarity (most relevant first)
		chunks.sort((a, b) => b.similarity - a.similarity);

		// Add chunks until we reach token budget
		for (const chunk of chunks) {
			if (totalTokens + chunk.tokenSize <= tokenBudget) {
				selectedChunks.push(chunk);
				totalTokens += chunk.tokenSize;
			} else if (selectedChunks.length === 0) {
				// If no chunks fit, at least include the most relevant one
				selectedChunks.push(chunk);
				totalTokens = chunk.tokenSize;
				break;
			}
		}

		console.log(
			`Selected ${selectedChunks.length} chunks using ${totalTokens} tokens (${Math.round((totalTokens / maxTokens) * 100)}% of available context)`,
		);
		return selectedChunks;
	} catch (error) {
		console.error("Error retrieving document chunks:", error);
		throw new Error(
			`Error in document chunk retrieval: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Generates a response to a user query using retrieved document chunks
 * @param query The user's query
 * @param relevantChunks Array of relevant document chunks
 * @returns Generated response and source information
 */
async function _generateQueryResponse(
	query: string,
	relevantChunks: Array<{
		chunkId: string;
		documentId: string;
		documentTitle: string;
		content: string;
		metadata: Record<string, unknown>;
		similarity: number;
	}>,
): Promise<{
	answer: string;
	sources: Array<{
		documentId: string;
		documentTitle: string;
		chunkId: string;
	}>;
}> {
	// Extract sources for citation
	const sources = relevantChunks.map((chunk) => ({
		documentId: chunk.documentId,
		documentTitle: chunk.documentTitle,
		chunkId: chunk.chunkId,
	}));

	// If no chunks were found, return a standard message
	if (relevantChunks.length === 0) {
		return {
			answer:
				"I couldn't find any relevant information to answer your question.",
			sources: [],
		};
	}

	// Get OpenAI model
	const model = getOpenAIModel();

	// Prepare context from relevant chunks
	const context = relevantChunks.map((chunk) => chunk.content).join("\n\n");

	// Define schema for structured response
	const responseSchema = z.object({
		answer: z
			.string()
			.describe(
				"The comprehensive answer to the user's question based on the provided context",
			),
	});

	try {
		// Generate response using AI SDK with structured output
		const { object } = await generateObject({
			model,
			schema: responseSchema,
			schemaName: "QueryResponse",
			schemaDescription:
				"A comprehensive response to a user query based on provided context",
			system:
				"You are a friendly and helpful assistant providing information to users. " +
				"Answer questions based on the provided context in a natural, conversational tone. " +
				"Never refer to 'the context' or 'the provided information' in your response. " +
				"If the answer cannot be found in the context, politely say you don't have that information. " +
				"Make your responses sound human, warm, and engaging. " +
				"Format your answer using Markdown when appropriate for readability. " +
				"Be concise but thorough, focusing on what would be most helpful to the user.",
			prompt: `Context information is below.\n\n${context}\n\nGiven the context information and not prior knowledge, answer the question: ${query}`,
		});

		return {
			answer: (object as z.infer<typeof responseSchema>).answer,
			sources,
		};
	} catch (error) {
		console.error("Error generating query response:", error);

		// Handle structured output errors specifically
		if (NoObjectGeneratedError.isInstance(error)) {
			console.log("Failed to generate structured response:", error.text);
			// Return a default response in case of failure
			return {
				answer:
					"I had trouble processing your question. Please try rephrasing it or asking something else.",
				sources,
			};
		}

		throw new Error(
			`Error generating response: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
