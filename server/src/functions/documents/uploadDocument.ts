import { getSupabase } from "../../db/supabaseClient.ts";
import { getDb } from "../../db/drizzle.ts";
import { documents } from "../../db/schema/documents.ts";
import {
	DocumentInsertSchema,
	type DocumentInsert,
} from "../../db/schema/documents.validation.ts";
import {
	processDocumentForRag,
	type ProcessingResult,
} from "../rag/documentRagService.ts";

export async function uploadDocument(
	file: File,
	title: string,
	description: string,
	userId: string,
	workspaceId: string,
) {
	try {
		// Extract file metadata
		const fileName = file.name;
		const fileType = file.type;
		const fileSize = file.size;

		// Create document data object
		const documentData: DocumentInsert = {
			title,
			fileName,
			fileType,
			fileSize,
			description,
		};

		// Validate data with Zod schema
		const parsed = DocumentInsertSchema.safeParse(documentData);

		if (!parsed.success) {
			return { error: parsed.error, status: 400 };
		}

		// Get service instances
		const supabase = getSupabase();
		const db = getDb();

		// Get file type folder (e.g., "pdf", "txt", "png")
		const fileExt = fileName.split(".").pop() || "other";
		const fileTypeFolder = fileType.split("/")[1] || fileExt;

		// Create storage path with UUID for uniqueness
		const fileId = crypto.randomUUID();
		const storagePath = `${fileTypeFolder}/${fileId}/${fileName}`;

		// Convert file to buffer for upload
		const buffer = await file.arrayBuffer();

		// Upload file to Supabase storage
		const { data: _uploadData, error: uploadError } = await supabase.storage
			.from("knowledge-documents")
			.upload(storagePath, buffer, {
				contentType: fileType,
				upsert: false,
			});

		if (uploadError) {
			console.error("Error uploading file:", uploadError);
			return { error: "Failed to upload file to storage", status: 500 };
		}

		// Save document metadata to database
		const newDocument = {
			fileName,
			fileType,
			fileSize,
			storagePath,
			title,
			description,
			isProcessed: false,
			userId,
			workspaceId,
		};

		const [insertedDocument] = await db
			.insert(documents)
			.values(newDocument)
			.returning();

		// Start processing the document in the background
		let processingResult: ProcessingResult | undefined;
		try {
			processingResult = await processDocumentForRag(insertedDocument.id);
			console.log(
				`Document processing started for document ${insertedDocument.id} with task ID ${processingResult.taskId}`,
			);
		} catch (processingError) {
			// Log the error but don't fail the upload
			console.error("Error starting document processing:", processingError);
			// We'll continue and return success for the upload
		}

		return {
			document: {
				...insertedDocument,
				processing: processingResult
					? {
							status: "processing",
							taskId: processingResult.taskId,
						}
					: {
							status: "pending",
							message:
								"Document was uploaded but processing could not be started automatically",
						},
			},
			status: 201,
		};
	} catch (error) {
		console.error("Error creating document:", error);
		return { error: "Failed to create document", status: 500 };
	}
}
