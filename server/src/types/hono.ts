import type { Context } from "hono";

// Define the type for our auth context variables
export type AuthVariables = {
	userId: string;
	workspaceId: string | null;
};

// Declare the context variable map for type safety
declare module "hono" {
	interface ContextVariableMap {
		userId: string;
		workspaceId: string | null;
	}
}

// Helper type for routes that need auth
export type AuthedContext = Context<{
	Variables: AuthVariables;
}>;
