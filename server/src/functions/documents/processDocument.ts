import { getDb } from "../../db/drizzle.ts";
import { documents } from "../../db/schema/documents.ts";
import { sql } from "drizzle-orm";
import {
	processDocumentForRag,
	processAllUnprocessedDocuments,
	getTaskStatus,
} from "../rag/documentRagService.ts";

export async function processDocument(id: string, workspaceId: string) {
	try {
		// Check if document belongs to user's workspace
		const db = getDb();
		const [document] = await db
			.select()
			.from(documents)
			.where(
				sql`${documents.id} = ${id} AND ${documents.workspaceId} = ${workspaceId}`,
			);

		if (!document) {
			return { error: "Document not found", status: 404 };
		}

		// Process the document
		const result = await processDocumentForRag(id);

		return {
			data: {
				message: "Document processing started successfully",
				documentId: result.documentId,
				taskId: result.taskId,
			},
			status: 200,
		};
	} catch (error) {
		console.error("Error processing document:", error);
		return {
			error: "Failed to process document",
			message: error instanceof Error ? error.message : String(error),
			status: 500,
		};
	}
}

export async function processAllDocuments() {
	try {
		// Process all unprocessed documents
		const results = await processAllUnprocessedDocuments();

		return {
			data: {
				message: `Started processing ${results.length} documents`,
				documents: results.map((r) => ({
					documentId: r.documentId,
					taskId: r.taskId,
				})),
			},
			status: 200,
		};
	} catch (error) {
		console.error("Error processing documents:", error);
		return {
			error: "Failed to process documents",
			message: error instanceof Error ? error.message : String(error),
			status: 500,
		};
	}
}

export async function checkTaskStatus(taskId: string) {
	try {
		// Get task status
		const status = await getTaskStatus(taskId);

		return {
			data: {
				taskId,
				status: status.status,
				documentId: status.documentId,
			},
			status: 200,
		};
	} catch (error) {
		console.error("Error retrieving task status:", error);
		return {
			error: "Failed to retrieve task status",
			message: error instanceof Error ? error.message : String(error),
			status: 500,
		};
	}
}
