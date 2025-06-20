// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { embedMany, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "npm:zod";
import { encode } from "gpt-tokenizer";

// CORS headers for edge functions
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

// Interface definitions
interface DocumentChunk {
	pageContent: string;
	metadata: {
		id: string;
		title: string;
		fileName: string;
		source: string;
		chunkIndex: number;
		chunkType: string;
	};
}

// Initialize Supabase Admin Client (to perform database operations)
const getSupabaseAdmin = () => {
	const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
	const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
	return createClient(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
};

// Initialize Supabase Client (for authenticated user calls)
// const getSupabaseClient = (authHeader?: string) => {
// 	const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
// 	const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

// 	return createClient(supabaseUrl, supabaseAnonKey, {
// 		global: {
// 			headers: {
// 				Authorization: authHeader || "",
// 			},
// 		},
// 	});
// };

// Function to split text into semantic chunks using OpenAI
async function splitTextIntoChunks(
	text: string,
	metadata: Omit<DocumentChunk["metadata"], "chunkIndex">,
): Promise<DocumentChunk[]> {
	// Get OpenAI API key from environment
	const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
	if (!openaiApiKey) {
		throw new Error("OPENAI_API_KEY environment variable not set");
	}

	// For large documents, we need to break them down first to stay within token limits
	const MAX_CHUNK_SIZE = 120000; // Characters, not tokens
	const CHUNK_OVERLAP = 2000;

	const initialChunks: string[] = [];
	let startPos = 0;

	// Simple character-based chunking for initial breakdown
	while (startPos < text.length) {
		const endPos = Math.min(startPos + MAX_CHUNK_SIZE, text.length);
		// Include overlap except for last chunk
		const chunk = text.substring(startPos, endPos);
		initialChunks.push(chunk);
		startPos = endPos - (endPos < text.length ? CHUNK_OVERLAP : 0);
	}

	const documentChunks: DocumentChunk[] = [];

	// Define the schema for semantic chunks
	const chunksSchema = z.object({
		chunks: z
			.array(
				z.object({
					content: z.string().describe("The semantic chunk content"),
					context: z
						.string()
						.describe(
							"Brief contextual information about this chunk within the document",
						),
				}),
			)
			.describe("An array of semantic text chunks with contextual information"),
	});

	// Extract document title for context
	const documentTitle = metadata.title;

	// Process each initial chunk with OpenAI to create semantic chunks
	for (let i = 0; i < initialChunks.length; i++) {
		const initialChunk = initialChunks[i];

		try {
			// Use AI SDK's generateObject for structured output
			const { object: result } = await generateObject({
				model: openai("gpt-4o", {
					structuredOutputs: true,
				}),
				schema: chunksSchema,
				schemaName: "DocumentChunks",
				schemaDescription:
					"Semantic chunks of a document with contextual information for efficient retrieval",
				system:
					"You are an expert at splitting text into semantically meaningful chunks for document retrieval. " +
					"Each chunk should be a self-contained unit of information that can be understood without additional context. " +
					"For each chunk, provide: 1) The chunk content, and 2) A brief context description that situates this chunk within the document. " +
					"Do not include ambiguous references in the context, use full names and be as explicit as possible." +
					"Maintain the original ordering of information. " +
					"Split the document where there are natural topical transitions. " +
					"Each chunk should include enough contextual information to be understandable on its own. " +
					"Ensure EVERY piece of information from the original text is preserved in the chunks.",
				prompt: `Split the following text from document "${documentTitle}" into semantic chunks for a retrieval system. Make each chunk self-contained with necessary context so it can be understood independently. Make sure to preserve ALL information:\n\n${initialChunk}`,
			});

			// Add each chunk to our result with appropriate metadata
			const typedResult = result as z.infer<typeof chunksSchema>;
			for (const chunk of typedResult.chunks) {
				// Combine the content with a brief context prefix for self-containment
				const contextualizedContent = `[Context: ${chunk.context}]\n\n${chunk.content}`;

				documentChunks.push({
					pageContent: contextualizedContent,
					metadata: {
						...metadata,
						chunkIndex: documentChunks.length,
						chunkType: "openai-semantic-contextualized",
					},
				});
			}
		} catch (error) {
			throw new Error(
				`Failed to generate semantic chunks: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	console.log(
		`Created ${documentChunks.length} self-contained semantic chunks`,
	);

	return documentChunks;
}

// Function to generate embeddings for document chunks
async function generateEmbeddings(
	chunks: DocumentChunk[],
): Promise<{ chunk: DocumentChunk; embedding: number[] }[]> {
	try {
		// Extract content from chunks for embedding
		const chunkContents = chunks.map((chunk) => chunk.pageContent);
		console.log(`Generating embeddings for ${chunkContents.length} chunks...`);

		// Generate embeddings using OpenAI
		const { embeddings } = await embedMany({
			model: openai.embedding("text-embedding-3-large"),
			values: chunkContents,
			maxRetries: 3,
		});

		if (!embeddings || embeddings.length !== chunks.length) {
			throw new Error(
				`Expected ${chunks.length} embeddings but received ${embeddings?.length || 0}`,
			);
		}

		// Validate embedding dimensions
		const expectedDimensions = 3072;
		for (const embedding of embeddings) {
			if (embedding.length !== expectedDimensions) {
				throw new Error(
					`Invalid embedding dimensions. Expected ${expectedDimensions}, got ${embedding.length}`,
				);
			}
		}

		// Map embeddings back to their chunks
		const embeddingResults = chunks.map((chunk, index) => ({
			chunk,
			embedding: embeddings[index],
		}));

		console.log(
			`Successfully generated embeddings for ${embeddingResults.length} chunks`,
		);
		return embeddingResults;
	} catch (error) {
		console.error("Error generating embeddings:", error);
		throw new Error(
			`Failed to generate semantic chunks: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

// Background task to process document: chunk, store, and generate embeddings
async function processDocumentTask(
	documentId: string,
	documentContent: string,
	taskId: string,
): Promise<void> {
	console.log(
		`Starting background task for document processing: ${documentId}`,
	);
	const supabase = getSupabaseAdmin();

	try {
		// Update task status to processing
		const { error: taskUpdateError } = await supabase
			.from("document_tasks")
			.update({ status: "processing" })
			.eq("id", taskId);

		if (taskUpdateError) {
			console.error(
				"Failed to update task status to processing:",
				taskUpdateError,
			);
			throw new Error(
				`Failed to update task status: ${taskUpdateError.message}`,
			);
		}

		// Get document metadata
		const { data: document, error: docError } = await supabase
			.from("documents")
			.select("title, file_name")
			.eq("id", documentId)
			.single();

		if (docError || !document) {
			const errorMessage = `Document metadata not found: ${docError?.message || "Unknown error"}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		const docTitle = document.title;
		const docFileName = document.file_name;

		// Split document into chunks
		const chunks = await splitTextIntoChunks(documentContent, {
			id: documentId,
			title: docTitle,
			fileName: docFileName,
			source: `documents/${documentId}`,
			chunkType: "openai-semantic",
		});

		console.log(
			`Split document ${documentId} into ${chunks.length} semantic chunks`,
		);

		// Generate embeddings for chunks
		console.log(`Generating embeddings for ${chunks.length} chunks`);
		const embeddingResults = await generateEmbeddings(chunks);

		// Prepare chunk data for insertion with embeddings
		const chunksToInsert = embeddingResults.map(({ chunk, embedding }) => {
			// Calculate token size using gpt-tokenizer
			const tokenSize = encode(chunk.pageContent).length;

			// Ensure metadata matches expected structure
			const metadata = {
				id: chunk.metadata.id,
				title: chunk.metadata.title,
				fileName: chunk.metadata.fileName,
				source: chunk.metadata.source,
				chunkIndex: chunk.metadata.chunkIndex,
				chunkType: chunk.metadata.chunkType,
			};

			return {
				document_id: documentId,
				content: chunk.pageContent,
				metadata: metadata,
				embedding: embedding,
				token_size: tokenSize,
			};
		});

		// Insert chunks into database
		if (chunksToInsert.length > 0) {
			console.log(
				`Inserting ${chunksToInsert.length} chunks with embeddings into database`,
			);
			const { error: insertError } = await supabase
				.from("document_chunks")
				.insert(chunksToInsert);

			if (insertError) {
				throw new Error(
					`Failed to insert chunks with embeddings: ${insertError.message}`,
				);
			}
		}

		// Update document status
		const { error: docUpdateError } = await supabase
			.from("documents")
			.update({ is_processed: true })
			.eq("id", documentId);

		if (docUpdateError) {
			console.error("Failed to update document status:", docUpdateError);
			throw new Error(
				`Failed to update document status: ${docUpdateError.message}`,
			);
		}

		// Update task status to completed
		const { error: taskCompleteError } = await supabase
			.from("document_tasks")
			.update({
				status: "completed",
				updated_at: new Date().toISOString(),
			})
			.eq("id", taskId);

		if (taskCompleteError) {
			console.error(
				"Failed to update task status to completed:",
				taskCompleteError,
			);
			throw new Error(
				`Failed to update task status: ${taskCompleteError.message}`,
			);
		}

		console.log(
			`Completed document processing for ${documentId}, task ${taskId}`,
		);
	} catch (error) {
		console.error(`Error processing document ${documentId}:`, error);

		// Update task status to failed
		const { error: taskFailError } = await supabase
			.from("document_tasks")
			.update({
				status: "failed",
				updated_at: new Date().toISOString(),
			})
			.eq("id", taskId);

		if (taskFailError) {
			console.error("Failed to update task status to failed:", taskFailError);
		}

		throw error;
	}
}

// Main request handler
Deno.serve(async (req) => {
	// Handle OPTIONS request for CORS
	if (req.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: corsHeaders,
		});
	}

	try {
		// Parse the request body
		const requestBody = await req.json();
		const { documentId, documentContent, taskId } = requestBody;

		if (!documentId || !documentContent || !taskId) {
			return new Response(
				JSON.stringify({
					error: "documentId, documentContent, and taskId are required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				},
			);
		}

		// Start the background task
		EdgeRuntime.waitUntil(
			processDocumentTask(documentId, documentContent, taskId),
		);

		// Return immediately with a successful response
		return new Response(
			JSON.stringify({
				success: true,
				message: "Document processing started in the background",
				documentId,
				taskId,
			}),
			{
				status: 202,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders,
				},
			},
		);
	} catch (error) {
		console.error("Error handling request:", error);

		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders,
				},
			},
		);
	}
});
