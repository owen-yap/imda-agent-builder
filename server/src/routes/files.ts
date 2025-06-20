import { Hono } from "hono";
import { extractTextFromPdf } from "../functions/rag/pdfProcessor.ts";
import { getOpenAIModel } from "../functions/clients/openai.ts";
import { generateObject } from "ai";
import { z } from "zod";

export const filesRouter = new Hono();

// POST endpoint to extract text from PDF and generate a description
filesRouter.post("/extract-description", async (c) => {
	try {
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

		// Verify file is a PDF
		if (!file.type.includes("pdf")) {
			return c.json(
				{
					message: "Invalid file type",
					error: "Only PDF files are currently supported",
					received: file.type,
				},
				400,
			);
		}

		// Convert file to buffer for processing
		const buffer = await file.arrayBuffer();

		// Extract text from PDF
		const extractedText = await extractTextFromPdf(buffer);

		if (!extractedText || extractedText.length === 0) {
			return c.json(
				{
					message: "No text could be extracted from the PDF",
					error: "The PDF may be empty, scanned, or contain only images",
				},
				400,
			);
		}

		// Trim the text if it's too long to send to the API
		const trimmedText =
			extractedText.length > 100000
				? `${extractedText.substring(0, 100000)}...`
				: extractedText;

		// Define schema for document description
		const descriptionSchema = z.object({
			description: z
				.string()
				.describe("A concise one sentence description of the document content"),
			topics: z
				.array(z.string())
				.describe(
					"Main topics covered in the document, limited to 5 key topics",
				),
		});

		// Get OpenAI model
		const model = getOpenAIModel();

		console.log("Grabbing description");
		// Use AI SDK to generate a structured description
		const { object } = await generateObject({
			model,
			schema: descriptionSchema,
			schemaName: "DocumentDescription",
			schemaDescription: "A concise description and key topics of a document",
			system:
				"You are an assistant that analyzes documents and extracts key information. Create a concise, one sentence description that captures the main topic and purpose of the document, and identify the 5 most important topics covered.",
			prompt: `Please analyze this document and provide a brief description and key topics:\n\n${trimmedText}`,
		});
		console.log("Returning description", object);

		// Return the extracted information
		return c.json({
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
			description: object.description,
			topics: object.topics,
			extractedTextLength: extractedText.length,
		});
	} catch (error) {
		console.error("Error processing PDF file:", error);
		return c.json(
			{
				error: "Failed to process PDF file",
				message: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
});
