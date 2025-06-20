import { getDb } from "../../db/drizzle.ts";
import { eq } from "drizzle-orm";
import { documents } from "../../db/schema/documents.ts";
import { documentTasks } from "../../db/schema/document_tasks.ts";
import { getSupabase } from "../../db/supabaseClient.ts";
import { extractTextFromPdf } from "./pdfProcessor.ts";

export interface ProcessingResult {
	documentId: string;
	taskId: string;
}

/**
 * Creates a task for document processing
 * @param documentId ID of the document to process
 * @returns Task ID
 */
export async function createDocumentProcessingTask(
	documentId: string,
): Promise<string> {
	console.log(`Creating document processing task for document ${documentId}`);
	const db = getDb();

	// Create a task
	const [task] = await db
		.insert(documentTasks)
		.values({
			documentId,
			status: "pending",
		})
		.returning();

	console.log(
		`Created document processing task ${task.id} for document ${documentId}`,
	);
	return task.id;
}

/**
 * Triggers document processing in the edge function
 * @param documentId ID of the document to process
 * @param documentContent Content of the document
 * @param taskId ID of the task to update
 */
export async function triggerDocumentProcessing(
	documentId: string,
	documentContent: string,
	taskId: string,
): Promise<void> {
	console.log(`Triggering document processing for task ${taskId}`);
	const supabase = getSupabase();

	// Call the edge function to process the document
	const { error } = await supabase.functions.invoke("process-document", {
		body: { documentId, documentContent, taskId },
	});

	if (error) {
		console.error(`Error invoking edge function for task ${taskId}:`, error);

		// Update task status to failed
		const db = getDb();
		await db
			.update(documentTasks)
			.set({ status: "failed" })
			.where(eq(documentTasks.id, taskId));

		throw new Error(`Failed to trigger document processing: ${error.message}`);
	}

	console.log(`Successfully triggered document processing for task ${taskId}`);
}

/**
 * Processes a document for RAG: extracts content and sends it to the edge function
 * @param documentId ID of the document to process
 * @returns ProcessingResult containing task ID
 */
export async function processDocumentForRag(
	documentId: string,
): Promise<ProcessingResult> {
	console.log(`Processing document ${documentId} for RAG`);

	// Get document from database
	const db = getDb();
	const [document] = await db
		.select()
		.from(documents)
		.where(eq(documents.id, documentId));

	if (!document) {
		throw new Error(`Document with ID ${documentId} not found`);
	}

	// Create a task for document processing
	const taskId = await createDocumentProcessingTask(documentId);

	// Get the document content from storage
	const supabase = getSupabase();
	const { data: fileData, error: storageError } = await supabase.storage
		.from("knowledge-documents")
		.download(document.storagePath);

	if (storageError) {
		throw new Error(`Failed to download document: ${storageError.message}`);
	}

	// Extract text based on file type
	let documentContent: string;
	const isPdf = document.fileType.includes("pdf");

	if (isPdf) {
		// For PDFs, use the PDF processor
		console.log(`Extracting text from PDF document: ${document.fileName}`);
		const arrayBuffer = await fileData.arrayBuffer();
		documentContent = await extractTextFromPdf(arrayBuffer);
	} else {
		// For text-based documents, just convert the blob to text
		console.log(
			`Extracting text from text-based document: ${document.fileName}`,
		);
		documentContent = await fileData.text();
	}

	// Trigger the document processing in the edge function
	try {
		await triggerDocumentProcessing(documentId, documentContent, taskId);
	} catch (error) {
		console.error(
			`Error triggering document processing for document ${documentId}:`,
			error,
		);
		throw error;
	}

	return {
		documentId: document.id,
		taskId,
	};
}

/**
 * Processes multiple documents for RAG
 * @param documentIds Array of document IDs to process
 * @returns Array of processing results
 */
export async function processDocumentsForRag(
	documentIds: string[],
): Promise<ProcessingResult[]> {
	const results: ProcessingResult[] = [];

	for (const documentId of documentIds) {
		try {
			const result = await processDocumentForRag(documentId);
			results.push(result);
		} catch (error) {
			console.error(`Error processing document ${documentId}:`, error);
			// Continue with other documents
		}
	}

	return results;
}

/**
 * Processes all unprocessed documents for RAG
 * @returns Array of processing results
 */
export async function processAllUnprocessedDocuments(): Promise<
	ProcessingResult[]
> {
	try {
		const db = getDb();

		// Get all unprocessed documents
		const unprocessedDocs = await db
			.select()
			.from(documents)
			.where(eq(documents.isProcessed, false));

		if (unprocessedDocs.length === 0) {
			console.log("No unprocessed documents found");
			return [];
		}

		console.log(`Found ${unprocessedDocs.length} unprocessed documents`);

		// Process each document
		const documentIds = unprocessedDocs.map((doc) => doc.id);
		return await processDocumentsForRag(documentIds);
	} catch (error) {
		console.error("Error processing unprocessed documents:", error);
		throw error;
	}
}

/**
 * Get the status of a document processing task
 * @param taskId ID of the task to check
 * @returns Task status
 */
export async function getTaskStatus(
	taskId: string,
): Promise<{ status: string; documentId: string }> {
	const db = getDb();
	const [task] = await db
		.select()
		.from(documentTasks)
		.where(eq(documentTasks.id, taskId));

	if (!task) {
		throw new Error(`Task with ID ${taskId} not found`);
	}

	return {
		status: task.status || "unknown",
		documentId: task.documentId,
	};
}
