import { getDb } from "../../db/drizzle.ts";
import { documents } from "../../db/schema/documents.ts";
import { sql } from "drizzle-orm";
import { getSupabase } from "../../db/supabaseClient.ts";

export async function getDocumentById(id: string, workspaceId: string) {
	try {
		const db = getDb();

		// Retrieve document from database, ensuring it belongs to the user's workspace
		const [document] = await db
			.select()
			.from(documents)
			.where(
				sql`${documents.id} = ${id} AND ${documents.workspaceId} = ${workspaceId}`,
			);

		if (!document) {
			return { error: "Document not found", status: 404 };
		}

		return { data: document, status: 200 };
	} catch (error) {
		console.error("Error retrieving document:", error);
		return { error: "Failed to retrieve document", status: 500 };
	}
}

export async function downloadDocument(id: string, workspaceId: string) {
	try {
		const db = getDb();

		// Retrieve document from database, ensuring it belongs to the user's workspace
		const [document] = await db
			.select()
			.from(documents)
			.where(
				sql`${documents.id} = ${id} AND ${documents.workspaceId} = ${workspaceId}`,
			);

		if (!document) {
			return { error: "Document not found", status: 404 };
		}

		const supabase = getSupabase();

		// Get the document from Supabase storage
		const { data, error } = await supabase.storage
			.from("knowledge-documents")
			.download(document.storagePath);

		if (error) {
			console.error("Error downloading file:", error);
			return { error: "Failed to download file from storage", status: 500 };
		}

		// Convert Blob to ArrayBuffer
		const arrayBuffer = await data.arrayBuffer();

		return {
			data: {
				arrayBuffer,
				contentType: document.fileType,
				fileName: document.fileName,
			},
			status: 200,
		};
	} catch (error) {
		console.error("Error downloading document:", error);
		return { error: "Failed to download document", status: 500 };
	}
}

export async function listDocuments(workspaceId: string) {
	try {
		const db = getDb();

		// Retrieve all documents from the user's workspace
		const documentsList = await db
			.select()
			.from(documents)
			.where(sql`${documents.workspaceId} = ${workspaceId}`)
			.orderBy(documents.createdAt);

		return {
			data: { documents: documentsList },
			status: 200,
		};
	} catch (error) {
		console.error("Error listing documents:", error);
		return { error: "Failed to list documents", status: 500 };
	}
}
