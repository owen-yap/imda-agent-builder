import { processAllUnprocessedDocuments } from "../src/functions/documentRagService.ts";
import "jsr:@std/dotenv/load";

/**
 * Script to process all unprocessed documents and generate embeddings
 * This can be run as a standalone script or called from elsewhere
 */
async function main() {
	console.log("Starting batch processing of unprocessed documents...");

	try {
		const results = await processAllUnprocessedDocuments();

		if (results.length === 0) {
			console.log(
				"No documents were processed. All documents may already be processed.",
			);
		} else {
			console.log(`Successfully processed ${results.length} documents.`);

			for (const result of results) {
				console.log(`- Document ${result.documentId}:`);
				console.log(`  - Generated ${result.chunks.length} chunks`);
				console.log(
					`  - Generated ${result.embeddingResults.length} embeddings`,
				);
			}
		}

		console.log("Batch processing completed successfully!");
	} catch (error) {
		console.error("Error during batch processing:", error);
		Deno.exit(1);
	}
}

// Only run the main function if this file is executed directly
if (import.meta.main) {
	await main();
}

export { main as processBatchDocuments };
