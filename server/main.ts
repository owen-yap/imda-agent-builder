import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "https://deno.land/std@0.157.0/http/server.ts";
import { checkDatabaseConnection } from "./src/db/drizzle.ts";
import { checkSupabaseConnection } from "./src/db/supabaseClient.ts";
import { documentsRouter } from "./src/routes/documents.ts";
import { filesRouter } from "./src/routes/files.ts";
import { playgroundRouter } from "./src/routes/playground.ts";
import { chatRouter } from "./src/routes/chat.ts";
import { workspacesRouter } from "./src/routes/workspaces.ts";
import invitationsRouter from "./src/routes/invitations.ts";
import { authMiddleware } from "./src/middleware/auth.ts";
import "jsr:@std/dotenv/load";

// Check connections to external services
await checkDatabaseConnection();
await checkSupabaseConnection();

const app = new Hono();

// Configure CORS properly for credentials
app.use(
	cors({
		origin: Deno.env.get("CLIENT_URL") || "http://localhost:5173",
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-Agent-Session-ID"],
		credentials: true, // Important for handling credentials
		maxAge: 600,
	}),
);

app.get("/", (c) => {
	return c.text("Welcome to the party!🎉");
});

// Create a public API router for unauthenticated endpoints
const publicApiRouter = new Hono();
publicApiRouter.route("/chat", chatRouter);
app.route("/api/public", publicApiRouter);

// Create authenticated API router for protected endpoints
const apiRouter = new Hono();

// Apply auth middleware to all protected API routes
apiRouter.use("*", authMiddleware);

apiRouter.route("/documents", documentsRouter);
apiRouter.route("/files", filesRouter);
apiRouter.route("/playground", playgroundRouter);
// Removed chat from authenticated routes
apiRouter.route("/workspaces", workspacesRouter);
apiRouter.route("/invitations", invitationsRouter);
app.route("/api/authenticated", apiRouter);

serve(app.fetch, {
	onListen({ hostname, port }) {
		console.log(`Listening on http://${hostname}:${port}`);
	},
});
