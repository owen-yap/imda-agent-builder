import { Hono } from "hono";
import type { DocumentInsert } from "../db/schema/documents.validation.ts";
import type { AuthVariables } from "../types/hono.ts";
import {
	uploadDocument,
	processDocument,
	processAllDocuments,
	checkTaskStatus,
	getDocumentById,
	downloadDocument,
	listDocuments,
	deleteDocument,
} from "../functions/documents/index.ts";
import { workspaceRequiredMiddleware } from "../middleware/workspaceRequiredMiddleware.ts";

// Define custom variables interface for Hono context that extends the auth variables
interface Variables extends AuthVariables {
	documentData: DocumentInsert;
}

// Create the router with typed variables
export const documentsRouter = new Hono<{ Variables: Variables }>();

// Apply workspace check middleware to all routes
documentsRouter.use("*", workspaceRequiredMiddleware);

// POST endpoint to upload a document
documentsRouter.post("/", async (c) => {
	// Get userId and workspaceId from auth context
	const userId = c.get("userId");
	const workspaceId = c.get("workspaceId");

	// The middleware ensures workspaceId is not null at this point
	// But typescript doesn't know that, so we need to check again for type safety
	if (!workspaceId) {
		return c.json({ error: "Workspace ID is required" }, 400);
	}

	// Parse the multipart form data
	const body = await c.req.parseBody();

	// Get the file from the form data
	const file = body.file;

	// Check if file exists and is a valid File object
	if (!file || !(file instanceof File)) {
		return c.json(
			{
				message: "Invalid file upload",
				error: "Expected a file upload but received something else",
				received: typeof file,
			},
			400,
		);
	}

	// Get other form data
	const title = body.title as string;
	const description = (body.description as string) || "";

	// Validate required fields
	if (!title) {
		return c.json({ error: "Title is required" }, 400);
	}

	// Call upload document function
	const result = await uploadDocument(
		file,
		title,
		description,
		userId,
		workspaceId,
	);

	if ("error" in result) {
		return c.json({ error: result.error }, result.status as 400 | 500);
	}

	return c.json(result.document, 201);
});

// POST endpoint to process a document and generate embeddings
documentsRouter.post("/:id/process", async (c) => {
	const id = c.req.param("id");
	const workspaceId = c.get("workspaceId");

	// Type safety check after middleware
	if (!workspaceId) {
		return c.json({ error: "Workspace ID is required" }, 400);
	}

	const result = await processDocument(id, workspaceId);

	if ("error" in result) {
		return c.json(
			{ error: result.error, message: result.message },
			result.status as 404 | 500,
		);
	}

	return c.json(result.data, 200);
});

// POST endpoint to process all unprocessed documents
documentsRouter.post("/process-all", async (c) => {
	const result = await processAllDocuments();

	if ("error" in result) {
		return c.json(
			{ error: result.error, message: result.message },
			result.status as 500,
		);
	}

	return c.json(result.data, 200);
});

// GET endpoint to retrieve a document by ID
documentsRouter.get("/:id", async (c) => {
	const id = c.req.param("id");
	const workspaceId = c.get("workspaceId");

	// Type safety check after middleware
	if (!workspaceId) {
		return c.json({ error: "Workspace ID is required" }, 400);
	}

	const result = await getDocumentById(id, workspaceId);

	if ("error" in result) {
		return c.json({ error: result.error }, result.status as 404 | 500);
	}

	return c.json(result.data, 200);
});

// GET endpoint to download a document by ID
documentsRouter.get("/:id/download", async (c) => {
	const id = c.req.param("id");
	const workspaceId = c.get("workspaceId");

	// Type safety check after middleware
	if (!workspaceId) {
		return c.json({ error: "Workspace ID is required" }, 400);
	}

	const result = await downloadDocument(id, workspaceId);

	if ("error" in result) {
		return c.json({ error: result.error }, result.status as 404 | 500);
	}

	// Set headers for file download
	c.header("Content-Type", result.data.contentType);
	c.header(
		"Content-Disposition",
		`attachment; filename="${result.data.fileName}"`,
	);

	// Return the file data
	return c.body(result.data.arrayBuffer);
});

// GET endpoint to list all documents
documentsRouter.get("/", async (c) => {
	// Get the authenticated user's workspace ID
	const workspaceId = c.get("workspaceId");

	// Type safety check after middleware
	if (!workspaceId) {
		return c.json({ error: "Workspace ID is required" }, 400);
	}

	const result = await listDocuments(workspaceId);

	if ("error" in result) {
		return c.json({ error: result.error }, result.status as 500);
	}

	return c.json(result.data, 200);
});

// GET endpoint to check task status
documentsRouter.get("/tasks/:taskId", async (c) => {
	const taskId = c.req.param("taskId");

	const result = await checkTaskStatus(taskId);

	if ("error" in result) {
		return c.json(
			{ error: result.error, message: result.message },
			result.status as 500,
		);
	}

	return c.json(result.data, 200);
});

// DELETE endpoint to delete a document by ID
documentsRouter.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const workspaceId = c.get("workspaceId");

	// Type safety check after middleware
	if (!workspaceId) {
		return c.json({ error: "Workspace ID is required" }, 400);
	}

	const result = await deleteDocument(id, workspaceId);

	if ("error" in result) {
		return c.json(
			{ error: result.error, message: result.message },
			result.status as 404 | 500,
		);
	}

	return c.json(result.data, 200);
});
