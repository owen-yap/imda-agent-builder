import { openai } from "@ai-sdk/openai";

/**
 * Get an OpenAI model instance for chat
 * @returns Configured OpenAI model instance
 */
export function getOpenAIModel() {
	const apiKey = Deno.env.get("OPENAI_API_KEY");
	if (!apiKey) {
		console.error("OPENAI_API_KEY environment variable is not set");
		throw new Error("OPENAI_API_KEY environment variable is not set");
	}

	try {
		// Ensure the OpenAI API key is set in the environment
		Deno.env.set("OPENAI_API_KEY", apiKey);
		return openai("gpt-4o");
	} catch (error) {
		console.error("Error initializing OpenAI model:", error);
		throw new Error(
			`Failed to initialize OpenAI model: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Get an OpenAI embedding model instance
 * @returns Configured OpenAI embedding model
 */
export function getOpenAIEmbeddingModel() {
	const apiKey = Deno.env.get("OPENAI_API_KEY");
	if (!apiKey) {
		console.error("OPENAI_API_KEY environment variable is not set");
		throw new Error("OPENAI_API_KEY environment variable is not set");
	}

	try {
		// Ensure the OpenAI API key is set in the environment
		Deno.env.set("OPENAI_API_KEY", apiKey);
		return openai.embedding("text-embedding-3-large");
	} catch (error) {
		console.error("Error initializing OpenAI embedding model:", error);
		throw new Error(
			`Failed to initialize OpenAI embedding model: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
