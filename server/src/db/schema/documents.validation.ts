import { z } from "zod";

/**
 * Zod schema for document creation
 * Validates the form data for document uploads
 */
export const DocumentInsertSchema = z.object({
	// User-friendly title for the document
	title: z.string().min(1, "Title is required"),

	// Original filename provided by the user - will be extracted from the file
	fileName: z.string().min(1, "Filename is required"),

	// MIME type of the file - will be extracted from the file
	fileType: z.string().min(1, "File type is required"),

	// Size of the file in bytes - will be extracted from the file
	fileSize: z.number().positive("File size must be positive"),

	// Optional description or notes about the document
	description: z.string().optional(),

	// The file itself will be handled separately in multipart form data
	// This is just the schema for the JSON part of the request
});

// Type derived from the schema
export type DocumentInsert = z.infer<typeof DocumentInsertSchema>;

/**
 * Response schema for document creation
 */
export const DocumentResponseSchema = DocumentInsertSchema.extend({
	id: z.string().uuid(),
	storagePath: z.string(),
	isProcessed: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;
