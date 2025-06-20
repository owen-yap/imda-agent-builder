import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton pattern to ensure only one instance exists
let supabaseInstance: SupabaseClient | null = null;

/**
 * Gets the Supabase client instance, creating it if it doesn't exist
 */
export function getSupabase() {
	if (supabaseInstance) return supabaseInstance;

	const supabaseUrl = Deno.env.get("SUPABASE_URL");
	const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

	if (!supabaseUrl || !supabaseKey) {
		throw new Error(
			"SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set",
		);
	}

	// Create and cache the Supabase client
	supabaseInstance = createClient(supabaseUrl, supabaseKey, {
		auth: {
			persistSession: false, // We're on the server, so no need to persist
		},
		db: {
			schema: "public",
		},
	});

	return supabaseInstance;
}

/**
 * Checks if the Supabase connection is working
 */
export async function checkSupabaseConnection(): Promise<boolean> {
	try {
		const supabase = getSupabase();

		// Simple query to test connection
		const { error } = await supabase.from("_dummy_query").select("*").limit(1);

		// If we get a "relation does not exist" error, that's fine - it means
		// the connection is working but the table doesn't exist
		if (
			error &&
			!error.message.includes("relation") &&
			!error.message.includes("does not exist")
		) {
			console.error("❌ Supabase connection error:", error.message);
			return false;
		}

		console.log("✅ Supabase connected successfully");
		return true;
	} catch (error) {
		console.error("❌ Supabase connection failed:", error);
		return false;
	}
}
