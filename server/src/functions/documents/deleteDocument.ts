import { getDb } from "../../db/drizzle.ts";
import { documents } from "../../db/schema/documents.ts";
import { sql, eq } from "drizzle-orm";
import { getSupabase } from "../../db/supabaseClient.ts";

export async function deleteDocument(id: string, workspaceId: string) {
	try {
		const db = getDb();
		const supabase = getSupabase();

		// First retrieve the document to get the storage path, ensuring it belongs to the user's workspace
		const [document] = await db
			.select()
			.from(documents)
			.where(
				sql`${documents.id} = ${id} AND ${documents.workspaceId} = ${workspaceId}`,
			);

		if (!document) {
			return { error: "Document not found", status: 404 };
		}

		// Delete the file from Supabase storage
		const { error: storageError } = await supabase.storage
			.from("knowledge-documents")
			.remove([document.storagePath]);

		if (storageError) {
			console.error("Error deleting file from storage:", storageError);
			// Continue with DB deletion even if storage deletion fails
		}

		// Delete the document from the database
		const [deletedDocument] = await db
			.delete(documents)
			.where(eq(documents.id, id))
			.returning();

		return {
			data: {
				message: "Document deleted successfully",
				document: deletedDocument,
			},
			status: 200,
		};
	} catch (error) {
		console.error("Error deleting document:", error);
		return {
			error: "Failed to delete document",
			message: error instanceof Error ? error.message : String(error),
			status: 500,
		};
	}
}
