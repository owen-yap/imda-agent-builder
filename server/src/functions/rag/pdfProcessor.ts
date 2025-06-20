import { extractText, getDocumentProxy, getMeta } from "unpdf";

/**
 * Extracts text from a PDF using unpdf
 * @param pdfBuffer ArrayBuffer containing the PDF data
 * @returns Extracted text content as a string
 */
export async function extractTextFromPdf(
	pdfBuffer: ArrayBuffer,
): Promise<string> {
	try {
		console.log(
			`Extracting text from PDF using unpdf. Buffer size: ${pdfBuffer.byteLength} bytes`,
		);

		// Convert buffer to Uint8Array for unpdf
		const uint8Array = new Uint8Array(pdfBuffer);

		// Load the PDF document
		console.log("Loading PDF document with unpdf...");
		const pdf = await getDocumentProxy(uint8Array);

		// Extract text from the PDF
		console.log(`Extracting text from PDF with ${pdf.numPages} pages...`);
		const result = await extractText(pdf, { mergePages: true });

		console.log(`Successfully extracted text from ${result.totalPages} pages`);

		// Handle the extracted text safely
		const extractedText = result.text;
		if (typeof extractedText === "string") {
			console.log(
				`First 200 characters of extracted text: ${extractedText.substring(0, 200)}...`,
			);
			return extractedText;
		}

		console.warn("Unexpected text format from unpdf", typeof extractedText);
		return "Unexpected format in extracted text";
	} catch (error) {
		console.error("Error in PDF text extraction with unpdf:", error);
		return "Error extracting text from PDF. Please try again with a different document.";
	}
}

/**
 * Extracts metadata from a PDF buffer (title, author, subject, etc.)
 * @param pdfBuffer ArrayBuffer containing the PDF data
 * @returns Object with PDF metadata
 */
export async function extractPdfMetadata(
	pdfBuffer: ArrayBuffer,
): Promise<Record<string, string>> {
	try {
		console.log(
			`Extracting metadata from PDF using unpdf. Buffer size: ${pdfBuffer.byteLength} bytes`,
		);

		// Convert buffer to Uint8Array for unpdf
		const uint8Array = new Uint8Array(pdfBuffer);

		// Load the PDF document
		const pdf = await getDocumentProxy(uint8Array);

		// Extract metadata
		console.log("Extracting PDF metadata...");
		const { info, metadata } = await getMeta(pdf);
		console.log("info: ", info);
		console.log("metadata: ", metadata);
		// Format metadata into a clean record
		const result: Record<string, string> = {
			title: info.Title || "Untitled Document",
			author: info.Author || "Unknown Author",
			pageCount: pdf.numPages.toString(),
			creationDate: info.CreationDate || new Date().toISOString(),
		};

		console.log("Extracted PDF metadata:", result);
		return result;
	} catch (error) {
		throw new Error(
			"Error extracting PDF metadata with unpdf:",
			error as Error,
		);
	}
}
